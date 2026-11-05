const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const moment = require('moment-timezone');

module.exports.config = {
    name: "noti",
    version: "2.0.0",
    hasPermssion: 2,
    hasPermission: 2,
    credits: "dtb",
    description: "Thông báo cho toàn bộ các nhóm kèm file/ảnh",
    commandCategory: "Hệ Thống",
    usages: "[nội dung / reply ảnh]",
    cooldowns: 5
};

const fullTime = () => moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || DD/MM/YYYY");

const downloadAttachment = async (url, dest) => {
    const res = await axios({
        method: "GET",
        url,
        responseType: "stream"
    });
    const writer = fs.createWriteStream(dest);
    res.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
};

module.exports.run = async function ({ api, event, args, Users }) {
    const { threadID, messageID, senderID, messageReply, type, attachments } = event;
    const isBotAdmin = (global.config.ADMINBOT || []).includes(String(senderID));
    if (!isBotAdmin) {
        return api.sendMessage("⚠️ Chỉ Admin Bot mới được sử dụng lệnh noti!", threadID, messageID);
    }

    if (!args[0] && type !== "message_reply") {
        return api.sendMessage("『 🌸 』 Vui lòng nhập nội dung hoặc đính kèm ảnh cần thông báo!", threadID, messageID);
    }

    const allThread = (global.data.allThreadID || []).filter(t => String(t) !== String(threadID));
    if (allThread.length === 0) {
        return api.sendMessage("⚠️ Không có nhóm nào khác ngoài nhóm hiện tại.", threadID, messageID);
    }

    let senderName = "Admin";
    try {
        senderName = await Users.getNameUser(senderID) || senderName;
    } catch (_) {}

    const cacheDir = path.join(__dirname, "cache", "noti");
    fs.ensureDirSync(cacheDir);

    let rawAtm = [];
    if (type === "message_reply" && messageReply.attachments && messageReply.attachments.length > 0) {
        rawAtm = messageReply.attachments;
    } else if (attachments && attachments.length > 0) {
        rawAtm = attachments;
    }

    const downloadedPaths = [];
    try {
        for (let i = 0; i < rawAtm.length; i++) {
            const a = rawAtm[i];
            if (!a.url) continue;
            const ext = a.type === "photo" ? "jpg" : a.type === "video" ? "mp4" : "dat";
            const fPath = path.join(cacheDir, `${Date.now()}_${i}.${ext}`);
            await downloadAttachment(a.url, fPath);
            downloadedPaths.push(fPath);
        }
    } catch (e) {
        console.error("Lỗi download noti attachment:", e);
    }

    api.sendMessage(`[📢] Đang gửi thông báo tới ${allThread.length} nhóm...`, threadID, messageID);

    let success = 0;
    let fail = 0;

    for (const each of allThread) {
        const bodyText = `[📝] 𝗧𝗛𝗢̂𝗡𝗚 𝗕𝗔́𝗢 𝗧𝗨̛̀ 𝗔𝗗𝗠𝗜𝗡\n『 🌸 』 Người gửi: ${senderName}\n[⏱] Thời gian: ${fullTime()}\n──────────────────\n${args.join(" ") || "Tệp đính kèm"}\n──────────────────\n[❤️] Reply tin nhắn này để gửi phản hồi về Admin.`;

        const payload = { body: bodyText };
        if (downloadedPaths.length > 0) {
            payload.attachment = downloadedPaths.map(p => fs.createReadStream(p));
        }

        try {
            await new Promise(resolve => {
                api.sendMessage(payload, each, (err, info) => {
                    if (!err && info && global.client.handleReply) {
                        success++;
                        global.client.handleReply.push({
                            name: this.config.name,
                            type: "noti",
                            messageID: info.messageID,
                            messID: messageID,
                            threadID: each,
                            author: senderID
                        });
                    } else {
                        fail++;
                    }
                    resolve();
                });
            });
            await new Promise(r => setTimeout(r, 350));
        } catch (_) {
            fail++;
        }
    }

    // Clean up cache
    for (const p of downloadedPaths) {
        try { fs.unlinkSync(p); } catch (_) {}
    }

    return api.sendMessage(`[✅] Đã gửi thông báo thành công đến ${success} nhóm! (Thất bại: ${fail})`, threadID, messageID);
};

module.exports.handleReply = async function ({ api, event, handleReply, Users, Threads }) {
    const { threadID, messageID, senderID, body, type, attachments } = event;
    const ADMINBOT = (global.config.ADMINBOT || []).map(String);

    let name = "Người dùng";
    try { name = await Users.getNameUser(senderID) || name; } catch (_) {}

    switch (handleReply.type) {
        case "noti": {
            let tName = "Nhóm chat";
            try { tName = (await Threads.getInfo(threadID)).threadName || tName; } catch (_) {}

            const text = `[📩] 𝗣𝗛𝗔̉𝗡 𝗛𝗢̂̀𝗜 𝗧𝗨̛̀ 𝗡𝗚𝗨̛𝗢̛̀𝗜 𝗗𝗨̀𝗡𝗚\n『 🌸 』 Từ: ${name} (UID: ${senderID})\n[🏠] Nhóm: ${tName} (TID: ${threadID})\n[⏱] Thời gian: ${fullTime()}\n──────────────────\n[📝] Nội dung: ${body || "Không có nội dung"}`;

            for (const adID of ADMINBOT) {
                api.sendMessage(text, adID, (err, info) => {
                    if (!err && info && global.client.handleReply) {
                        global.client.handleReply.push({
                            name: this.config.name,
                            type: "reply",
                            messageID: info.messageID,
                            messID: messageID,
                            threadID
                        });
                    }
                });
            }
            return api.sendMessage("➜ Phản hồi của bạn đã được chuyển đến Admin!", threadID, messageID);
        }
        case "reply": {
            if (!ADMINBOT.includes(String(senderID))) return;

            const text = `[📩] 𝗧𝗥𝗔̉ 𝗟𝗢̛̀𝗜 𝗧𝗨̛̀ 𝗔𝗗𝗠𝗜𝗡\n『 🌸 』 Từ: ${name}\n[⏱] Thời gian: ${fullTime()}\n──────────────────\n[📝] Nội dung: ${body}\n──────────────────\n👉 Reply tin nhắn này để tiếp tục gửi phản hồi.`;

            api.sendMessage(text, handleReply.threadID, (err, info) => {
                if (!err && info && global.client.handleReply) {
                    global.client.handleReply.push({
                        name: this.config.name,
                        type: "noti",
                        messageID: info.messageID,
                        threadID: handleReply.threadID
                    });
                }
            }, handleReply.messID);

            return api.sendMessage("➜ Đã gửi phản hồi về nhóm thành công!", threadID, messageID);
        }
    }
};
