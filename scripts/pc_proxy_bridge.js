/**
 * PC PROXY BRIDGE FOR DTB BOT
 * Author: dtb
 * Description: Biến máy tính cá nhân thành một HTTP/HTTPS CONNECT Proxy Server bảo mật.
 * Giúp Bot chạy trên VPS/Replit hoặc bất kỳ đâu có thể mượn IP mạng dân cư của máy tính này,
 * hoàn toàn loại bỏ nguy cơ bị Facebook Checkpoint / Khóa nick do đăng nhập từ IP lạ.
 */

const http = require('http');
const net = require('net');
const axios = require('axios');

const PORT = parseInt(process.env.PROXY_PORT || process.argv[2] || '8888', 10);
const AUTH = process.env.PROXY_AUTH || 'dtb:dtbbot2026'; // format: user:pass

let publicNetInfo = null;

async function fetchPublicIP() {
    try {
        const res = await axios.get('http://ip-api.com/json?fields=status,country,city,isp,org,as,hosting,query', { timeout: 4000 });
        if (res.data && res.data.status === 'success') {
            publicNetInfo = res.data;
            return res.data;
        }
    } catch (_) {}
    try {
        const ipify = await axios.get('https://api.ipify.org?format=json', { timeout: 3000 });
        if (ipify.data && ipify.data.ip) {
            publicNetInfo = { query: ipify.data.ip, isp: 'Internet Service Provider', city: 'Việt Nam', country: 'VN', hosting: false };
            return publicNetInfo;
        }
    } catch (_) {}
    return null;
}

function checkProxyAuth(req) {
    if (!AUTH) return true;
    const authHeader = req.headers['proxy-authorization'];
    if (!authHeader) return false;
    const [type, credentials] = authHeader.split(' ');
    if (type !== 'Basic' || !credentials) return false;
    const decoded = Buffer.from(credentials, 'base64').toString('utf8');
    return decoded === AUTH;
}

const server = http.createServer((req, res) => {
    // Normal HTTP requests (Status check)
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
        status: 'online',
        service: 'DTB Bot PC Proxy Bridge',
        publicIP: publicNetInfo ? publicNetInfo.query : 'Detecting...',
        isp: publicNetInfo ? publicNetInfo.isp : 'Unknown',
        message: 'Proxy Bridge đang hoạt động bình thường trên máy tính của bạn.'
    }, null, 2));
});

// Handle HTTPS CONNECT Tunneling (Direct bit-pipe to Facebook TLS)
server.on('connect', (req, clientSocket, head) => {
    if (AUTH && !checkProxyAuth(req)) {
        clientSocket.write('HTTP/1.1 407 Proxy Authentication Required\r\nProxy-Authenticate: Basic realm="DTB Proxy"\r\n\r\n');
        clientSocket.end();
        return;
    }

    const [hostname, port] = req.url.split(':');
    const targetPort = parseInt(port || '443', 10);

    const serverSocket = net.connect(targetPort, hostname, () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        if (head && head.length > 0) {
            serverSocket.write(head);
        }
        serverSocket.pipe(clientSocket);
        clientSocket.pipe(serverSocket);
    });

    serverSocket.on('error', (err) => {
        clientSocket.end();
    });

    clientSocket.on('error', (err) => {
        serverSocket.end();
    });
});

server.listen(PORT, '0.0.0.0', async () => {
    await fetchPublicIP();
    console.clear();
    console.log("================================================================================");
    console.log("             DTB BOT - PC RESIDENTIAL PROXY BRIDGE                              ");
    console.log("================================================================================");
    if (publicNetInfo) {
        console.log(`[*] IP Dân cư máy tính:   ${publicNetInfo.query} (${publicNetInfo.city}, ${publicNetInfo.country})`);
        console.log(`[*] Nhà mạng (ISP):       ${publicNetInfo.isp}`);
        console.log(`[*] Loại mạng:            ${publicNetInfo.hosting ? "Hosting/VPS" : "Mạng gia đình dân cư (AN TOÀN CHO FB 100%)"}`);
    }
    console.log(`[*] Proxy Port nội bộ:    ${PORT}`);
    console.log(`[*] Mật khẩu xác thực:   ${AUTH ? AUTH : "Không (mở)"}`);
    console.log("--------------------------------------------------------------------------------");
    console.log("[HƯỚNG DẪN CẤU HÌNH BOT TRÊN VPS / REPLIT DÙNG IP MÁY NÀY]");
    console.log("1. Mở một Terminal khác trên máy này và chạy Ngrok hoặc Cloudflared:");
    console.log(`   -> Lệnh Ngrok:         ngrok http ${PORT}`);
    console.log("2. Ngrok sẽ cấp một địa chỉ dạng: https://abc-xyz.ngrok-free.app");
    console.log("3. Dán link đó vào file config.json trên VPS:");
    if (AUTH) {
        const [u, p] = AUTH.split(':');
        console.log(`   "proxy": "http://${u}:${p}@<domain-ngrok>:<port>"`);
    } else {
        console.log(`   "proxy": "http://<domain-ngrok>:<port>"`);
    }
    console.log("--------------------------------------------------------------------------------");
    console.log("[*] Proxy đang lắng nghe kết nối... Nhấn Ctrl+C để dừng.");
    console.log("================================================================================");
});
