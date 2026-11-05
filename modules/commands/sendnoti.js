const request = require("request");
const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

module.exports.config = {
    name: "sendnoti",
    version: "1.2.0",
    hasPermssion: 3,
    credits: "dtb",
    description: "Gửi thông báo từ Admin đến tất cả nhóm",
    commandCategory: "Hệ Thống",
    usages: "sendnoti [nội dung]",
    cooldowns: 2
};

const fullTime = () => moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || DD/MM/YYYY");

module.exports.run = async function({ api, event, args, Users }) {
    const { threadID, messageID, senderID, type, messageReply, attachments } = event;
    const allTid = global.data.allThreadID || [];

    if (!args[0] && type !== "message_reply") {
        return api.sendMessage("➜ Vui lòng nhập nội dung thông báo muốn gửi!", threadID, messageID);
    }

    let content = args.join(" ");
    let atm = type === "message_reply" && messageReply.attachments && messageReply.attachments.length > 0
        ? messageReply.attachments
        : (attachments && attachments.length > 0 ? attachments : []);

    let senderName = "Admin";
    try { senderName = (await Users.getData(senderID)).name || senderName; } catch (_) {}

    let msg = `[📢] 𝗧𝗛𝗢̂𝗡𝗚 𝗕𝗔́𝗢 𝗧𝗨̛̀ 𝗔𝗗𝗠𝗜𝗡: ${senderName}\n[⏱] 𝗧𝗶𝗺𝗲: ${fullTime()}\n[📝] 𝗡𝗼̣̂𝗶 𝗱𝘂𝗻𝗴: ${content || "Tệp đính kèm"}\n\n👉 Reply tin nhắn này để gửi phản hồi về Admin.`;

    let success = 0, fail = 0;
    for (const tid of allTid) {
        if (String(tid) === String(threadID)) continue;
        try {
            api.sendMessage(msg, tid, (err, info) => {
                if (!err && info && global.client.handleReply) {
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: senderID,
                        type: "userReply"
                    });
                }
            });
            success++;
        } catch (_) {
            fail++;
        }
    }

    return api.sendMessage(`[✅] Đã gửi thông báo đến ${success} nhóm! (Thất bại: ${fail})`, threadID, messageID);
};

module.exports.handleReply = async function({ api, event, handleReply, Users, Threads }) {
    const { threadID, messageID, senderID, body, type } = event;
    const ADMINBOT = global.config.ADMINBOT || [];

    if (handleReply.type === "userReply") {
        let uName = "User";
        try { uName = (await Users.getData(senderID)).name || uName; } catch (_) {}
        let tName = "Nhóm chat";
        try { tName = (await Threads.getData(threadID)).threadInfo.threadName || tName; } catch (_) {}

        let msg = `[📩] 𝗣𝗵𝗮̉𝗻 𝗵𝗼̂̀𝗶 𝘁𝘂̛̀: ${uName}\n[🔎] 𝗡𝗵𝗼́𝗺: ${tName}\n[⏱] 𝗧𝗶𝗺𝗲: ${fullTime()}\n[📝] 𝗡𝗼̣̂𝗶 𝗱𝘂𝗻𝗴: ${body}\n\n👉 Reply để phản hồi lại người dùng.`;

        for (const adID of ADMINBOT) {
            api.sendMessage(msg, adID, (err, info) => {
                if (!err && info && global.client.handleReply) {
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: handleReply.author,
                        idThread: threadID,
                        idUser: senderID,
                        type: "adminReply"
                    });
                }
            });
        }
        return api.sendMessage("➜ Phản hồi của bạn đã được gửi đến Admin!", threadID, messageID);
    }

    if (handleReply.type === "adminReply") {
        let adName = "Admin";
        try { adName = (await Users.getData(senderID)).name || adName; } catch (_) {}
        let msg = `[📩] 𝗣𝗵𝗮̉𝗻 𝗵𝗼̂̀𝗶 𝘁𝘂̛̀ 𝗔𝗱𝗺𝗶𝗻: ${adName}\n[⏱] 𝗧𝗶𝗺𝗲: ${fullTime()}\n[📝] 𝗡𝗼̣̂𝗶 𝗱𝘂𝗻𝗴: ${body}`;

        api.sendMessage(msg, handleReply.idThread);
        return api.sendMessage("➜ Đã gửi câu trả lời về nhóm người dùng!", threadID, messageID);
    }
};
