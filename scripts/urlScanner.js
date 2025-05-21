#!/usr/bin/env node

/**
 * validateUrlExtended.js
 *
 * - Parses URL components
 * - DNS lookup (A/AAAA records)
 * - Follows up to 5 redirects (HEAD requests)
 * - Prints full headers for each hop
 * - For HTTPS: shows TLS version, cipher, cert subject/issuer/validity
 * - Final verdict: secure or not
 */

const readline = require('readline');
const { URL } = require('url');
const dns = require('dns').promises;
const http = require('http');
const https = require('https');

async function run() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (q) =>
        new Promise(res => rl.question(q, ans => res(ans.trim())));

    let input = await question('Enter a URL to validate and check security: ');
    rl.close();

    // Ensure URL has a scheme
    if (!/^[a-z]+:\/\//i.test(input)) {
        input = 'https://' + input;
    }

    let url;
    try {
        url = new URL(input);
    } catch (err) {
        console.error('\x1b[31mInvalid URL format.\x1b[0m');
        return;
    }

    // 1) Display URL components
    console.log('\n🔍 URL Components:');
    console.log(`  • Protocol : ${url.protocol}`);
    console.log(`  • Hostname : ${url.hostname}`);
    console.log(`  • Port     : ${url.port || '(default)'}`);
    console.log(`  • Path     : ${url.pathname}`);
    console.log(`  • Query    : ${url.search || '(none)'}`);
    console.log(`  • Fragment : ${url.hash || '(none)'}\n`);

    // 2) DNS lookup
    try {
        const records = await dns.lookup(url.hostname, { all: true });
        console.log('🌐 DNS Records:');
        records.forEach(r => {
            console.log(`  • ${r.family === 4 ? 'A' : 'AAAA'} : ${r.address}`);
        });
        console.log();
    } catch (err) {
        console.warn(`⚠️  DNS lookup failed: ${err.message}\n`);
    }

    // 3) Follow redirects
    const supported = ['http:', 'https:'];
    let current = url;
    const chain = [];
    let isSecure = false;

    for (let i = 0; i < 5; i++) {
        const isHttps = current.protocol === 'https:';
        if (!supported.includes(current.protocol)) {
            chain.push({
                url: current.href,
                error: `Unsupported protocol ${current.protocol}`
            });
            break;
        }

        const lib = isHttps ? https : http;
        const port = current.port || (isHttps ? 443 : 80);

        const res = await new Promise(resolve => {
            const req = lib.request(
                { hostname: current.hostname, port, path: current.pathname + current.search, method: 'HEAD' },
                resolve
            );
            req.on('error', err => resolve({ error: err }));
            req.end();
        });

        if (res.error) {
            chain.push({ url: current.href, error: res.error.message });
            break;
        }

        // Gather hop info
        const hop = {
            url: current.href,
            status: res.statusCode,
            headers: res.headers
        };

        if (isHttps && res.socket) {
            const cert = res.socket.getPeerCertificate(true);
            hop.tls = {
                protocol: res.socket.getProtocol(),
                cipher: res.socket.getCipher(),
                valid_from: cert.valid_from,
                valid_to: cert.valid_to,
                issuer: cert.issuer.CN,
                subject: cert.subject.CN
            };
            isSecure = true;
        }

        chain.push(hop);

        // redirect?
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            // resolve relative redirects
            current = new URL(res.headers.location, current);
        } else {
            break;
        }
    }

    // Print chain
    console.log('🔗 Redirect / Header Chain:');
    chain.forEach((hop, idx) => {
        console.log(`\n  Hop #${idx + 1}: ${hop.url}`);
        if (hop.error) {
            console.log(`    ✖ Error: ${hop.error}`);
            return;
        }
        console.log(`    • Status: ${hop.status}`);
        console.log('    • Headers:');
        Object.entries(hop.headers).forEach(([k, v]) => {
            console.log(`        ${k}: ${v}`);
        });
        if (hop.tls) {
            console.log('    • TLS Info:');
            console.log(`        Protocol : ${hop.tls.protocol}`);
            console.log(`        Cipher   : ${hop.tls.cipher.name}`);
            console.log(`        Issuer   : ${hop.tls.issuer}`);
            console.log(`        Subject  : ${hop.tls.subject}`);
            console.log(`        Valid From: ${hop.tls.valid_from}`);
            console.log(`        Valid To  : ${hop.tls.valid_to}`);
        }
    });

    // Final verdict
    console.log(
        isSecure
            ? '\n✅ Secure: Yes (at least one HTTPS hop verified TLS)'
            : '\n❌ Secure: No (no HTTPS with valid TLS detected)'
    );
}

run();
