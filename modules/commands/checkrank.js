const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "checkrank",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Kiểm tra tương tác và rank của thành viên",
    commandCategory: "Quản Lí Box",
    usages: "[help/all/trống]",
    cooldowns: 0,
    dependencies: {
        "fs-extra": ""
    }
};

const dirPath = path.join(__dirname, 'tuongtac', 'checkrank');
fs.ensureDirSync(dirPath);

module.exports.onLoad = () => {
    fs.ensureDirSync(dirPath);
    const dirMaterial = path.join(__dirname, 'Noprefix');
    fs.ensureDirSync(dirMaterial);
};

module.exports.handleEvent = function ({ event }) {
    const { threadID, senderID } = event;
    if (!global.data.allThreadID.some(tid => String(tid) === String(threadID))) return;

    const threadPath = path.join(dirPath, `${threadID}.json`);
    if (!fs.existsSync(threadPath)) {
        fs.writeFileSync(threadPath, JSON.stringify({}, null, 4));
    }
    try {
        const getThreadJSON = JSON.parse(fs.readFileSync(threadPath, 'utf8')) || {};
        if (!getThreadJSON[senderID]) getThreadJSON[senderID] = 0;
        getThreadJSON[senderID]++;
        fs.writeFileSync(threadPath, JSON.stringify(getThreadJSON, null, 4));
    } catch (_) {}
};

const getRankName = count => {
    return count > 4440 ? 'Thách Đấu ( 🏆 )'
        : count > 3440 ? 'Chiến Tướng (🏅)'
        : count > 2440 ? 'Cao Thủ (⭐)'
        : count > 1760 ? 'Tinh Anh (💎)'
        : count > 1260 ? 'Kim Cương (💠)'
        : count > 760  ? 'Bạch Kim (🛡️)'
        : count > 440  ? 'Vàng (🥇)'
        : count > 200  ? 'Bạc (🥈)'
        : 'Đồng (🥉)';
};

module.exports.run = async function ({ api, event, args, Users }) {
    const { threadID, senderID, mentions, type, messageReply } = event;
    const threadPath = path.join(dirPath, `${threadID}.json`);
    if (!fs.existsSync(threadPath)) {
        fs.writeFileSync(threadPath, JSON.stringify({}, null, 4));
    }

    const query = args[0] ? args[0].toLowerCase() : '';
    let getThreadJSON = {};
    try { getThreadJSON = JSON.parse(fs.readFileSync(threadPath, 'utf8')) || {}; } catch (_) {}
    if (!getThreadJSON[senderID]) getThreadJSON[senderID] = 1;

    let storage = [];
    if (query === 'all') {
        let allThread = await api.getThreadInfo(threadID);
        for (let id of (allThread.participantIDs || [])) {
            if (!getThreadJSON[id]) getThreadJSON[id] = 0;
        }
    }

    for (const id in getThreadJSON) {
        let name = "Người dùng";
        try { name = await Users.getNameUser(id) || name; } catch (_) {}
        storage.push({ id, name, count: getThreadJSON[id] });
    }

    storage.sort((a, b) => b.count - a.count);

    let msg = '';
    if (query === 'all') {
        let count = 1;
        msg += '『 🌸 』==== 𝐂𝐇𝐄𝐂𝐊 𝐀𝐋𝐋 ====『 🌸 』\n';
        for (const user of storage.slice(0, 30)) {
            msg += `\nTop ${count++}: ${user.name}\n➜ Tổng tin nhắn: ${user.count} | Rank: ${getRankName(user.count)}\n`;
        }
    } else if (query === 'help') {
        msg += 
`====『 CÁC CẤP BẬC RANK 』====
》Đồng (0 tin nhắn)
》Bạc (200 tin nhắn)
》Vàng (440 tin nhắn)
》Bạch Kim (760 tin nhắn)
》Kim Cương (1260 tin nhắn)
》Tinh Anh (1760 tin nhắn)
》Cao Thủ (2440 tin nhắn)
》Chiến Tướng (3440 tin nhắn)
》Thách Đấu (4440 tin nhắn)
Chúc bạn tương tác vui vẻ!`;
    } else {
        const moment = require("moment-timezone");
        const timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");

        let userID = senderID;
        if (type === "message_reply") userID = messageReply.senderID;
        else if (mentions && Object.keys(mentions).length > 0) userID = Object.keys(mentions)[0];

        const rankIndex = storage.findIndex(e => String(e.id) === String(userID));
        const userCount = rankIndex >= 0 ? storage[rankIndex].count : (getThreadJSON[userID] || 0);
        let userName = "Bạn";
        try { userName = await Users.getNameUser(userID) || userName; } catch (_) {}

        msg += `『 🌸 』=== 𝗖𝗛𝗘𝗖𝗞 𝗥𝗔𝗡𝗞 ===『 🌸 』\n\n🏆 Top của ${userID === senderID ? 'bạn' : userName}: ${rankIndex >= 0 ? rankIndex + 1 : 'Chưa xếp hạng'}\n💬 Tổng số tin nhắn: ${userCount}\n🏅 Rank: ${getRankName(userCount)}\n⏰ Time: ${timeNow}\n❓ Dùng [ /checkrank help ] hoặc [ /checkrank all ]\n『 🌸 』 ➜ Chúc bạn tương tác vui vẻ!`;
    }

    const imgPath = path.join(__dirname, 'Noprefix', 'checkrank.jpg');
    if (fs.existsSync(imgPath)) {
        return api.sendMessage({ body: msg, attachment: fs.createReadStream(imgPath) }, threadID, event.messageID);
    } else {
        return api.sendMessage(msg, threadID, event.messageID);
    }
};
