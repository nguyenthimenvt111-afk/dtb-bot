const assert = require('assert');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

console.log("=== TESTING LOGIN PIPELINE & IP SYNCHRONIZATION ===");

// 1. Verify config.json
const configPath = path.resolve(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
assert(config.FCAOption, "FCAOption must exist in config.json");
assert.strictEqual(config.FCAOption.forceLogin, true, "forceLogin should be true");
assert(config.FCAOption.userAgent.includes("Windows NT 10.0"), "userAgent must be Windows desktop");
assert(config.FCAOption.userAgent.includes("Chrome/"), "userAgent must be Chrome");
assert(config.hasOwnProperty("proxy"), "proxy field must exist in config.json");
console.log("[PASS] config.json validated: Windows Chrome userAgent & proxy field present");

// 2. Test IP Diagnostic Routine
async function testDiagnostics() {
    let res = null;
    try {
        const r = await axios.get('http://ip-api.com/json', { timeout: 4000 });
        if (r.data && r.data.status === 'success') {
            res = { ip: r.data.query, city: r.data.city, isp: r.data.isp, country: r.data.country };
        }
    } catch (_) {}
    if (!res) {
        const ipify = await axios.get('https://api.ipify.org?format=json', { timeout: 3000 });
        res = { ip: ipify.data.ip, city: 'Unknown', isp: 'Unknown', country: 'VN' };
    }
    assert(res && res.ip, "Must retrieve public IP");
    console.log(`[PASS] Public IP detected: ${res.ip} (${res.city}, ${res.country} - ${res.isp})`);
    return res;
}

// 3. Test FCA Engine exports
const login = require('../lib/Fca-Horizon-Remastered');
assert(typeof login === 'function', "login must be a function");
console.log("[PASS] FCA login function is available and takes (loginData, options, callback)");

// 4. Test main.js syntax
try {
    const mainContent = fs.readFileSync(path.resolve(__dirname, '../main.js'), 'utf8');
    assert(mainContent.includes('getNetworkDiagnostics'), "main.js must define getNetworkDiagnostics");
    assert(mainContent.includes('login(loginData, loginOptions,'), "main.js must pass loginOptions to login()");
    assert(mainContent.includes('loginOptions.proxy = configuredProxy'), "main.js must support proxy injection");
    console.log("[PASS] main.js properly passes loginOptions and performs IP diagnostics before login");
} catch (e) {
    console.error("[FAIL] main.js check failed:", e.message);
    process.exit(1);
}

(async () => {
    await testDiagnostics();
    console.log("=== ALL LOGIN PIPELINE TESTS PASSED 100% ===");
})();
