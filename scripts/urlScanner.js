#!/usr/bin/env node

const { URL } = require('url');
const dns = require('dns').promises;
const http = require('http');
const https = require('https');

async function run() {
    let input = process.argv[2];

    if (!input) {
        console.error('No URL provided.');
        process.exit(1);
    }

    if (!/^[a-z]+:\/\//i.test(input)) {
        input = 'https://' + input;
    }

    let url;
    try {
        url = new URL(input);
    } catch {
        console.log('❌ Secure: No (Invalid URL)');
        return;
    }

    try {
        await dns.lookup(url.hostname);
    } catch {
        console.log('❌ Secure: No (DNS resolution failed)');
        return;
    }

    const supported = ['http:', 'https:'];
    let current = url;
    let secure = true;
    let tlsValidated = false;

    for (let i = 0; i < 5; i++) {
        const isHttps = current.protocol === 'https:';
        if (!supported.includes(current.protocol)) {
            secure = false;
            break;
        }

        const lib = isHttps ? https : http;
        const port = current.port || (isHttps ? 443 : 80);

        const res = await new Promise(resolve => {
            const req = lib.request(
                {
                    hostname: current.hostname,
                    port,
                    path: current.pathname + current.search,
                    method: 'HEAD',
                    timeout: 5000,
                },
                resolve
            );
            req.on('timeout', () => {
                req.destroy();
                resolve({ error: new Error('Request timed out') });
            });
            req.on('error', err => resolve({ error: err }));
            req.end();
        });

        if (res.error) {
            secure = false;
            break;
        }

        if (isHttps && res.socket) {
            try {
                const cert = res.socket.getPeerCertificate(true);
                const now = new Date();
                const validFrom = new Date(cert.valid_from);
                const validTo = new Date(cert.valid_to);
                const protocol = res.socket.getProtocol();

                if (
                    cert.subject &&
                    cert.issuer &&
                    cert.valid_from &&
                    cert.valid_to &&
                    protocol &&
                    now >= validFrom &&
                    now <= validTo
                ) {
                    tlsValidated = true;
                } else {
                    secure = false;
                    break;
                }
            } catch {
                secure = false;
                break;
            }
        } else if (!isHttps) {
            secure = false; // downgraded to HTTP
            break;
        }

        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            current = new URL(res.headers.location, current);
        } else {
            break;
        }
    }

    if (secure && tlsValidated) {
        console.log('✅ Secure: Yes');
    } else {
        console.log('❌ Secure: No');
    }
}

run().catch(() => {
    console.log('❌ Secure: No (Unexpected Error)');
    process.exit(1);
});

module.exports = async function checkUrl(url) {
    // Your security logic here...
    return { secure: true }; // or false
};