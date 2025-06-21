#!/usr/bin/env node

const { URL } = require('url');
const dns = require('dns').promises;
const http = require('http');
const https = require('https');

async function checkUrl(urlString) {
    const result = {
        input: urlString,
        ok: false,
        dnsResolved: false,
        redirects: [],
        finalUrl: null,
        protocol: null,
        statusCode: null,
        tls: {
            used: false,
            validated: false,
            protocol: null,
            validFrom: null,
            validTo: null,
            issuer: null,
            subject: null,
        },
        error: null
    };

    // normalize
    let input = urlString;
    if (!/^[a-z]+:\/\//i.test(input)) input = 'https://' + input;

    let url;
    try {
        url = new URL(input);
    } catch (e) {
        result.error = 'Invalid URL';
        return result;
    }

    // DNS
    try {
        await dns.lookup(url.hostname);
        result.dnsResolved = true;
    } catch (e) {
        result.error = 'DNS resolution failed';
        return result;
    }

    // follow up to 5 redirects
    let current = url;
    for (let i = 0; i < 5; i++) {
        const isHttps = current.protocol === 'https:';
        const lib = isHttps ? https : http;
        const port = current.port || (isHttps ? 443 : 80);

        const res = await new Promise(resolve => {
            const req = lib.request({
                hostname: current.hostname,
                port,
                path: current.pathname + current.search,
                method: 'HEAD',
                timeout: 5000
            }, resolve);

            req.on('timeout', () => { req.destroy(); resolve({ error: new Error('Timeout') }); });
            req.on('error', err => resolve({ error: err }));
            req.end();
        });

        if (res.error) {
            result.error = res.error.message;
            break;
        }

        result.statusCode = res.statusCode;
        result.protocol = current.protocol;
        result.redirects.push({ url: current.href, statusCode: res.statusCode });

        // TLS details
        if (isHttps && res.socket) {
            result.tls.used = true;
            try {
                const cert = res.socket.getPeerCertificate(true);
                const now = Date.now();
                const fromMs = Date.parse(cert.valid_from);
                const toMs = Date.parse(cert.valid_to);
                result.tls = {
                    ...result.tls,
                    validated: now >= fromMs && now <= toMs,
                    protocol: res.socket.getProtocol(),
                    validFrom: cert.valid_from,
                    validTo: cert.valid_to,
                    issuer: cert.issuer?.O || cert.issuer?.CN,
                    subject: cert.subject?.CN
                };
            } catch { }
        } else if (!isHttps) {
            // downgraded to HTTP
            result.tls.used = false;
        }

        // handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            current = new URL(res.headers.location, current);
            continue;
        }
        break;
    }

    result.finalUrl = result.redirects.slice(-1)[0]?.url || url.href;
    result.ok = result.dnsResolved && (result.statusCode >= 200 && result.statusCode < 400)
        && (!result.tls.used || result.tls.validated);
    return result;
}

async function runCli() {
    const input = process.argv[2];
    if (!input) {
        console.error('No URL provided.');
        process.exit(1);
    }
    const out = await checkUrl(input);
    console.log(JSON.stringify(out, null, 2));
}

if (require.main === module) {
    runCli().catch(err => {
        console.error(JSON.stringify({ ok: false, error: err.message }));
        process.exit(1);
    });
}

module.exports = checkUrl;
