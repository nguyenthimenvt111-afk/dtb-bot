const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const moment = require('moment-timezone');

module.exports.config = {
    name: "ghichu",
    version: "2.0.0",
    hasPermssion: 2,
    hasPermission: 2,
    credits: "dtb",
    description: "Công cụ quản lý mã nguồn module: Tải code lên Pastebin hoặc lưu code từ Pastebin/GitHub vào bot (Chỉ Admin)",
    commandCategory: "Hệ Thống",
    usages: "[tên_module / reply link]",
    cooldowns: 2
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, messageReply, type } = event;
    const ADMINBOT = (global.config.ADMINBOT || []).map(String);

    if (!ADMINBOT.includes(String(senderID))) {
        return api.sendMessage("⚠️ Lệnh này chỉ dành riêng cho Admin Bot!", threadID, messageID);
    }

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    let targetName = args[0];
    let replyText = type === "message_reply" && messageReply ? messageReply.body : null;

    if (!replyText && !targetName) {
        const menu = 
`╔═════════════════════════╗
   🛠️ QUẢN LÝ CODE MODULE
╚═════════════════════════╝
▸ ${global.config.PREFIX}ghichu [tên_module] : Upload code module lên Pastebin
▸ Reply link Pastebin/Raw + [tên_module] : Áp dụng code tải về vào file module
──────────────────────────
⏱ Bot online: ${hours}h ${minutes}m ${seconds}s
📅 Thời gian: ${moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY")}`;
        return api.sendMessage(menu, threadID, messageID);
    }

    // Case 1: Upload local module code to Pastebin
    if (!replyText && targetName) {
        const filePath = path.join(__dirname, `${targetName.replace(/\.js$/, '')}.js`);
        if (!fs.existsSync(filePath)) {
            return api.sendMessage(`❎ File module "${targetName}.js" không tồn tại trên hệ thống!`, threadID, messageID);
        }

        try {
            const code = fs.readFileSync(filePath, "utf-8");
            let pasteUrl = "";
            try {
                const { PasteClient } = require('pastebin-api');
                const client = new PasteClient("R02n6-lNPJqKQCd5VtL4bKPjuK6ARhHb");
                const url = await client.createPaste({
                    code,
                    expireDate: 'N',
                    format: "javascript",
                    name: targetName,
                    publicity: 1
                });
                const id = url.split('/').pop();
                pasteUrl = `https://pastebin.com/raw/${id}`;
            } catch (_) {
                // Fallback to catbox / dpaste if pastebin-api token limits out
                const res = await axios.post("https://dpaste.com/api/", `content=${encodeURIComponent(code)}&expiry_days=30`, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
                pasteUrl = res.data.trim() + ".txt";
            }
            return api.sendMessage(`✅ Đã tải code module "${targetName}.js" lên thành công:\n🔗 ${pasteUrl}`, threadID, messageID);
        } catch (e) {
            console.error("Lỗi ghichu pastebin:", e);
            return api.sendMessage(`❎ Lỗi khi upload code module "${targetName}": ${e.message}`, threadID, messageID);
        }
    }

    // Case 2: Apply code from link to local module
    if (replyText && targetName) {
        const urlMatch = replyText.match(/https?:\/\/[^\s]+/);
        if (!urlMatch) {
            return api.sendMessage("❎ Tin nhắn bạn reply không chứa đường link hợp lệ!", threadID, messageID);
        }
        let url = urlMatch[0];

        // Format raw links
        if (url.includes("pastebin.com") && !url.includes("/raw/")) {
            url = url.replace("pastebin.com/", "pastebin.com/raw/");
        } else if (url.includes("github.com") && url.includes("/blob/")) {
            url = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
        }

        try {
            const response = await axios.get(url, { responseType: 'text' });
            const code = response.data;
            if (typeof code !== "string" || code.trim().length === 0) {
                return api.sendMessage("❎ Không thể lấy được mã nguồn từ đường link trên!", threadID, messageID);
            }

            const moduleFileName = `${targetName.replace(/\.js$/, '')}.js`;
            const destPath = path.join(__dirname, moduleFileName);
            fs.writeFileSync(destPath, code, "utf-8");

            return api.sendMessage(`✅ Đã áp dụng thành công mã nguồn vào file "${moduleFileName}"!\n👉 Dùng lệnh "cmd load ${moduleFileName}" hoặc "restart" để tải lại module.`, threadID, messageID);
        } catch (e) {
            console.error("Lỗi áp dụng code ghichu:", e);
            return api.sendMessage(`❎ Lỗi khi tải và ghi mã nguồn vào module: ${e.message}`, threadID, messageID);
        }
    }
};
