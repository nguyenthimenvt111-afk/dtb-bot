const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const moment = require("moment-timezone");

module.exports.config = {
    name: "sendnoti",
    version: "2.0.0",
    hasPermssion: 2,
    hasPermission: 2,
    credits: "dtb",
    description: "Gửi thông báo từ Admin Bot đến tất cả nhóm có kèm file/ảnh",
    commandCategory: "Hệ Thống",
    usages: "[nội dung / kèm ảnh hoặc reply ảnh]",
    cooldowns: 5
};

const fullTime = () => moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || DD/MM/YYYY");

const downloadFile = async (url, dest) => {
    const response = await axios({
        method: "GET",
        url,
        responseType: "stream"
    });
    const writer = fs.createWriteStream(dest);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
};

module.exports.run = async function({ api, event, args, Users }) {
    const { threadID, messageID, senderID, type, messageReply, attachments } = event;
    const isBotAdmin = (global.config.ADMINBOT || []).includes(String(senderID));
    if (!isBotAdmin) {
        return api.sendMessage("⚠️ Chỉ Admin Bot mới có quyền gửi thông báo toàn hệ thống!", threadID, messageID);
    }

    if (!args[0] && type !== "message_reply") {
        return api.sendMessage("➜ Vui lòng nhập nội dung thông báo hoặc reply ảnh/video cần gửi!", threadID, messageID);
    }

    const allTid = (global.data.allThreadID || []).filter(id => String(id) !== String(threadID));
    if (allTid.length === 0) {
        return api.sendMessage("⚠️ Hiện tại không có nhóm nào khác trong danh sách bot tham gia.", threadID, messageID);
    }

    let content = args.join(" ").trim();
    let rawAttachments = [];
    if (type === "message_reply" && messageReply.attachments && messageReply.attachments.length > 0) {
        rawAttachments = messageReply.attachments;
    } else if (attachments && attachments.length > 0) {
        rawAttachments = attachments;
    }

    let senderName = "Admin";
    try {
        senderName = (await Users.getData(senderID)).name || senderName;
    } catch (_) {}

    const cacheDir = path.join(__dirname, "cache", "sendnoti");
    fs.ensureDirSync(cacheDir);

    const savedFiles = [];
    try {
        for (let i = 0; i < rawAttachments.length; i++) {
            const atm = rawAttachments[i];
            const url = atm.url;
            if (!url) continue;
            const ext = atm.type === "photo" ? "jpg" : atm.type === "video" ? "mp4" : atm.type === "audio" ? "mp3" : "dat";
            const filePath = path.join(cacheDir, `${Date.now()}_${i}.${ext}`);
            await downloadFile(url, filePath);
            savedFiles.push(filePath);
        }
    } catch (e) {
        console.error("Lỗi tải tệp đính kèm sendnoti:", e);
    }

    api.sendMessage(`[📢] Đang tiến hành gửi thông báo đến ${allTid.length} nhóm... Vui lòng chờ!`, threadID, messageID);

    let success = 0;
    let fail = 0;

    for (let i = 0; i < allTid.length; i++) {
        const tid = allTid[i];
        const bodyText = 
`╔═════════════════════════╗
   📢 THÔNG BÁO TỪ ADMIN
╚═════════════════════════╝
👤 Người gửi: ${senderName}
⏱ Thời gian: ${fullTime()}
──────────────────────────
📝 Nội dung:
${content || "(Đính kèm hình ảnh/tệp tin)"}
──────────────────────────
👉 Reply (phản hồi) tin nhắn này nếu muốn gửi ý kiến trực tiếp về Admin!`;

        const msgPayload = {
            body: bodyText
        };

        if (savedFiles.length > 0) {
            msgPayload.attachment = savedFiles.map(f => fs.createReadStream(f));
        }

        try {
            await new Promise(res => {
                api.sendMessage(msgPayload, tid, (err, info) => {
                    if (!err && info && global.client.handleReply) {
                        global.client.handleReply.push({
                            name: this.config.name,
                            messageID: info.messageID,
                            author: senderID,
                            targetThread: tid,
                            type: "userReply"
                        });
                        success++;
                    } else {
                        fail++;
                    }
                    res();
                });
            });
            // 350ms delay between sending to groups to prevent rate limits
            await new Promise(r => setTimeout(r, 350));
        } catch (_) {
            fail++;
        }
    }

    // Cleanup saved files
    for (const file of savedFiles) {
        try { fs.unlinkSync(file); } catch (_) {}
    }

    return api.sendMessage(
`╔═════════════════════════╗
   ✅ KẾT QUẢ GỬI THÔNG BÁO
╚═════════════════════════╝
▸ Tổng nhóm nhận: ${allTid.length}
▸ Thành công: ${success} nhóm
▸ Thất bại: ${fail} nhóm
▸ Thời gian hoàn tất: ${fullTime()}`, threadID);
};

module.exports.handleReply = async function({ api, event, handleReply, Users, Threads }) {
    const { threadID, messageID, senderID, body } = event;
    const ADMINBOT = (global.config.ADMINBOT || []).map(String);

    if (handleReply.type === "userReply") {
        let uName = "Người dùng";
        try { uName = (await Users.getData(senderID)).name || uName; } catch (_) {}
        let tName = "Nhóm chat";
        try { tName = (await Threads.getData(threadID)).threadInfo.threadName || tName; } catch (_) {}

        const msg = 
`╔═════════════════════════╗
   📩 PHẢN HỒI THÔNG BÁO
╚═════════════════════════╝
👤 Người gửi: ${uName} (UID: ${senderID})
🏠 Nhóm: ${tName} (TID: ${threadID})
⏱ Thời gian: ${fullTime()}
──────────────────────────
📝 Nội dung:
${body || "Không có nội dung"}
──────────────────────────
👉 Admin có thể reply tin nhắn này để phản hồi trực tiếp cho nhóm!`;

        for (const adID of ADMINBOT) {
            api.sendMessage(msg, adID, (err, info) => {
                if (!err && info && global.client.handleReply) {
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: senderID,
                        idThread: threadID,
                        idUser: senderID,
                        type: "adminReply"
                    });
                }
            });
        }
        return api.sendMessage("➜ Phản hồi của bạn đã được gửi đến Admin thành công!", threadID, messageID);
    }

    if (handleReply.type === "adminReply") {
        if (!ADMINBOT.includes(String(senderID))) return;

        let adName = "Admin";
        try { adName = (await Users.getData(senderID)).name || adName; } catch (_) {}
        const msg = 
`╔═════════════════════════╗
   📩 PHẢN HỒI TỪ ADMIN
╚═════════════════════════╝
👤 Admin: ${adName}
⏱ Thời gian: ${fullTime()}
──────────────────────────
📝 Lời nhắn:
${body || "Đã xem phản hồi của bạn."}`;

        api.sendMessage(msg, handleReply.idThread, () => {
            api.sendMessage(`➜ Đã chuyển câu trả lời của bạn tới nhóm [${handleReply.idThread}]!`, threadID, messageID);
        });
    }
};
