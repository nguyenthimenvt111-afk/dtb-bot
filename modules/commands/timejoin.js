const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

module.exports.config = {
    name: "timejoin",
    version: "2.1.0",
    hasPermssion: 0,
    hasPermission: 0,
    credits: "dtb",
    description: "Xem thời gian tham gia nhóm của thành viên",
    commandCategory: "Quản Lí Box",
    usages: "[tag / reply / để trống]",
    cooldowns: 2
};

const dir = path.join(__dirname, "cache", "timejoin");
fs.ensureDirSync(dir);

// In-memory cache of known sender IDs per thread to avoid repeated disk reads
const knownSendersCache = new Map();

const loadThreadData = (threadID) => {
    const tidStr = String(threadID);
    const filePath = path.join(dir, `${tidStr}.json`);
    let data = [];
    if (fs.existsSync(filePath)) {
        try {
            data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            if (!Array.isArray(data)) data = [];
        } catch (_) {
            data = [];
        }
    }
    const set = new Set(data.map(i => String(i.senderID)));
    knownSendersCache.set(tidStr, set);
    return data;
};

module.exports.handleEvent = async function({ event, Users }) {
    try {
        const { threadID, senderID } = event;
        if (!threadID || !senderID) return;

        const tidStr = String(threadID);
        const sidStr = String(senderID);

        let set = knownSendersCache.get(tidStr);
        if (!set) {
            loadThreadData(tidStr);
            set = knownSendersCache.get(tidStr);
        }

        // Fast path: sender is already recorded
        if (set && set.has(sidStr)) return;

        // Record new sender
        const filePath = path.join(dir, `${tidStr}.json`);
        let dataJson = [];
        if (fs.existsSync(filePath)) {
            try { dataJson = JSON.parse(await fs.promises.readFile(filePath, "utf-8")); } catch (_) {}
            if (!Array.isArray(dataJson)) dataJson = [];
        }

        if (!dataJson.find(i => String(i.senderID) === sidStr)) {
            const now = moment.tz("Asia/Ho_Chi_Minh");
            let resname = "Người dùng";
            try { resname = (await Users.getData(sidStr)).name || resname; } catch (_) {}
            dataJson.push({
                senderID: sidStr,
                opt: {
                    name: resname,
                    gio: now.format("HH:mm:ss"),
                    ngay: now.format("YYYY-MM-DD"),
                    burh: now.format("DD/MM/YYYY")
                }
            });
            await fs.promises.writeFile(filePath, JSON.stringify(dataJson, null, 2), "utf-8");
            set.add(sidStr);
        }
    } catch (_) {}
};

module.exports.run = async function({ api, event, args, Users }) {
    try {
        const { threadID, senderID, messageID, mentions, messageReply, type } = event;
        const now = moment.tz("Asia/Ho_Chi_Minh");
        const tidStr = String(threadID);
        const filePath = path.join(dir, `${tidStr}.json`);

        let dataJson = [];
        if (fs.existsSync(filePath)) {
            try { dataJson = JSON.parse(fs.readFileSync(filePath, "utf-8")); } catch (_) {}
            if (!Array.isArray(dataJson)) dataJson = [];
        }

        let targetID = String(senderID);
        if (type === 'message_reply') {
            targetID = String(messageReply.senderID);
        } else if (mentions && Object.keys(mentions).length > 0) {
            targetID = String(Object.keys(mentions)[0]);
        }

        let user = dataJson.find(item => String(item.senderID) === targetID);
        if (!user) {
            let uName = "Người dùng";
            try { uName = (await Users.getData(targetID)).name || uName; } catch (_) {}
            user = {
                senderID: targetID,
                opt: {
                    name: uName,
                    gio: now.format("HH:mm:ss"),
                    ngay: now.format("YYYY-MM-DD"),
                    burh: now.format("DD/MM/YYYY")
                }
            };
            dataJson.push(user);
            fs.writeFileSync(filePath, JSON.stringify(dataJson, null, 2), "utf-8");
            let set = knownSendersCache.get(tidStr);
            if (set) set.add(targetID);
        }

        let threadName = "Nhóm chat";
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            threadName = threadInfo.threadName || threadName;
        } catch (_) {}

        const dateJoin = new Date(`${user.opt.ngay} ${user.opt.gio}`);
        const diffDays = Math.max(0, Math.floor((Date.now() - dateJoin.getTime()) / (24 * 60 * 60 * 1000)));

        const msg = 
`╔═════════════════════════╗
   ⏰ THỜI GIAN THAM GIA
╚═════════════════════════╝
👤 Thành viên: ${user.opt.name}
🆔 UID: ${user.senderID}
🏠 Nhóm: ${threadName}
⏱ Giờ tham gia: ${user.opt.gio}
📆 Ngày ghi nhận: ${user.opt.burh}
⏳ Đã gắn bó: ${diffDays} ngày`;

        return api.sendMessage(msg, threadID, messageID);
    } catch (e) {
        console.error("Lỗi timejoin:", e);
        return api.sendMessage("➜ Không thể lấy thông tin thời gian tham gia!", event.threadID, event.messageID);
    }
};
