const assert = require('assert');
const http = require('http');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { spawn } = require('child_process');
const path = require('path');

console.log("=== TESTING PC PROXY BRIDGE & TUNNELING ===");

const bridgePath = path.resolve(__dirname, 'pc_proxy_bridge.js');
const testPort = '8877';
const env = { ...process.env, PROXY_PORT: testPort, PROXY_AUTH: 'testuser:testpass' };

const child = spawn(process.execPath, [bridgePath], { env });

let stdout = '';
child.stdout.on('data', (d) => { stdout += d.toString(); });
child.stderr.on('data', (d) => { console.error('Bridge stderr:', d.toString()); });

setTimeout(async () => {
    try {
        console.log("[1] Checking local HTTP status...");
        const res = await axios.get(`http://127.0.0.1:${testPort}/`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.status, 'online');
        console.log("[PASS] Bridge HTTP server responds HTTP 200 online");

        console.log("[2] Checking HTTPS CONNECT with Basic Auth...");
        const proxyUrl = `http://testuser:testpass@127.0.0.1:${testPort}`;
        const agent = new HttpsProxyAgent(proxyUrl);
        const ipRes = await axios.get('https://api.ipify.org?format=json', { httpsAgent: agent, timeout: 6000 });
        assert(ipRes.data && ipRes.data.ip, "Must retrieve IP through authenticated proxy");
        console.log("[PASS] Successfully proxied HTTPS request with credentials. Egress IP:", ipRes.data.ip);

        console.log("=== PC PROXY BRIDGE VERIFIED 100% ===");
        child.kill();
        process.exit(0);
    } catch (e) {
        console.error("[FAIL] Proxy Bridge test failed:", e.message);
        child.kill();
        process.exit(1);
    }
}, 2500);
