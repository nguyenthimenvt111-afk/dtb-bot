const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

module.exports.config = {
    name: "timejoin",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Xem thời gian tham gia nhóm của thành viên",
    commandCategory: "Quản Lí Box",
    usages: "[tag/reply/trống]",
    cooldowns: 3
};

module.exports.handleEvent = async function({ event, Users }) {
    try {
        const { threadID, senderID } = event;
        const now = moment.tz("Asia/Ho_Chi_Minh");
        const dir = path.join(__dirname, "cache", "timejoin");
        fs.ensureDirSync(dir);
        const filePath = path.join(dir, `${threadID}.json`);

        let dataJson = [];
        if (fs.existsSync(filePath)) {
            try { dataJson = JSON.parse(fs.readFileSync(filePath, "utf-8")); } catch (_) {}
        }

        if (!dataJson.find(i => String(i.senderID) === String(senderID))) {
            let resname = "Người dùng";
            try { resname = (await Users.getData(senderID)).name || resname; } catch (_) {}
            dataJson.push({
                senderID: String(senderID),
                opt: {
                    name: resname,
                    gio: now.format("HH:mm:ss"),
                    ngay: now.format("YYYY-MM-DD"),
                    burh: now.format("DD/MM/YYYY")
                }
            });
            fs.writeFileSync(filePath, JSON.stringify(dataJson, null, 4), "utf-8");
        }
    } catch (_) {}
};

module.exports.run = async function({ api, event, args, Users }) {
    try {
        const { threadID, senderID, messageID, mentions, messageReply, type } = event;
        const now = moment.tz("Asia/Ho_Chi_Minh");
        const dir = path.join(__dirname, "cache", "timejoin");
        fs.ensureDirSync(dir);
        const filePath = path.join(dir, `${threadID}.json`);

        let dataJson = [];
        if (fs.existsSync(filePath)) {
            try { dataJson = JSON.parse(fs.readFileSync(filePath, "utf-8")); } catch (_) {}
        }

        let targetID = senderID;
        if (type === 'message_reply') {
            targetID = messageReply.senderID;
        } else if (mentions && Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
        }

        let user = dataJson.find(item => String(item.senderID) === String(targetID));
        if (!user) {
            let uName = "Người dùng";
            try { uName = (await Users.getData(targetID)).name || uName; } catch (_) {}
            user = {
                senderID: String(targetID),
                opt: {
                    name: uName,
                    gio: now.format("HH:mm:ss"),
                    ngay: now.format("YYYY-MM-DD"),
                    burh: now.format("DD/MM/YYYY")
                }
            };
            dataJson.push(user);
            fs.writeFileSync(filePath, JSON.stringify(dataJson, null, 4), "utf-8");
        }

        let threadInfo = await api.getThreadInfo(threadID);
        let threadName = threadInfo.threadName || "Nhóm chat";
        let dateJoin = new Date(`${user.opt.ngay} ${user.opt.gio}`);
        let diffDays = Math.max(0, Math.floor((Date.now() - dateJoin.getTime()) / (24 * 60 * 60 * 1000)));

        let msg = 
`====『 THỜI GIAN THAM GIA 』====
━━━━━━━━━━━━━━━━━━
👤 Thành viên: ${user.opt.name}
🏠 Nhóm: ${threadName}
⏰ Giờ tham gia: ${user.opt.gio}
📆 Ngày tham gia: ${user.opt.burh}
⏳ Đã gắn bó: ${diffDays} ngày`;

        return api.sendMessage(msg, threadID, messageID);
    } catch (e) {
        console.error("Lỗi timejoin:", e);
        return api.sendMessage("➜ Không thể lấy thông tin thời gian tham gia!", event.threadID, event.messageID);
    }
};
