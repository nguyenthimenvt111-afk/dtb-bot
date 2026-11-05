const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "checkrank",
    version: "2.1.0",
    hasPermssion: 0,
    hasPermission: 0,
    credits: "dtb",
    description: "Kiểm tra tương tác và thứ hạng của thành viên trong nhóm",
    commandCategory: "Quản Lí Box",
    usages: "[help / all / tag / reply / trống]",
    cooldowns: 2
};

const dirPath = path.join(__dirname, 'tuongtac', 'checkrank');
fs.ensureDirSync(dirPath);

// In-memory cache to debounce disk I/O
const rankCache = new Map();
const dirtyThreads = new Set();

const loadThreadData = (threadID) => {
    const tidStr = String(threadID);
    if (rankCache.has(tidStr)) {
        return rankCache.get(tidStr);
    }
    const threadPath = path.join(dirPath, `${tidStr}.json`);
    let data = {};
    if (fs.existsSync(threadPath)) {
        try {
            data = JSON.parse(fs.readFileSync(threadPath, 'utf8')) || {};
        } catch (_) {
            data = {};
        }
    }
    rankCache.set(tidStr, data);
    return data;
};

// Periodic flush dirty threads to disk every 10 seconds
setInterval(() => {
    if (dirtyThreads.size === 0) return;
    const threadsToFlush = Array.from(dirtyThreads);
    dirtyThreads.clear();

    for (const tid of threadsToFlush) {
        const data = rankCache.get(tid);
        if (data) {
            const threadPath = path.join(dirPath, `${tid}.json`);
            fs.writeFile(threadPath, JSON.stringify(data, null, 2), 'utf8', () => {});
        }
    }
}, 10000);

module.exports.onLoad = () => {
    fs.ensureDirSync(dirPath);
};

module.exports.handleEvent = function ({ event }) {
    const { threadID, senderID } = event;
    if (!threadID || !senderID) return;
    const allTids = (global.data.allThreadID || []).map(String);
    if (!allTids.includes(String(threadID))) return;

    const tidStr = String(threadID);
    const sidStr = String(senderID);
    const data = loadThreadData(tidStr);

    data[sidStr] = (data[sidStr] || 0) + 1;
    dirtyThreads.add(tidStr);
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
    const { threadID, senderID, mentions, type, messageReply, messageID } = event;
    const tidStr = String(threadID);
    const data = loadThreadData(tidStr);

    const query = args[0] ? args[0].toLowerCase() : '';

    if (query === 'help') {
        const helpMsg = 
`╔═════════════════════════╗
    CÁC CẤP BẬC TƯƠNG TÁC
╚═════════════════════════╝
▸ Đồng (🥉) : 0 tin nhắn
▸ Bạc (🥈) : 200 tin nhắn
▸ Vàng (🥇) : 440 tin nhắn
▸ Bạch Kim (🛡️) : 760 tin nhắn
▸ Kim Cương (💠) : 1260 tin nhắn
▸ Tinh Anh (💎) : 1760 tin nhắn
▸ Cao Thủ (⭐) : 2440 tin nhắn
▸ Chiến Tướng (🏅) : 3440 tin nhắn
▸ Thách Đấu (🏆) : 4440 tin nhắn trở lên`;
        return api.sendMessage(helpMsg, threadID, messageID);
    }

    if (query === 'all') {
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            for (const pid of (threadInfo.participantIDs || [])) {
                if (!data[pid]) data[pid] = 0;
            }
        } catch (_) {}

        const storage = [];
        for (const id in data) {
            let name = "Người dùng";
            try { name = await Users.getNameUser(id) || name; } catch (_) {}
            storage.push({ id, name, count: data[id] });
        }

        storage.sort((a, b) => b.count - a.count);

        let msg = `╔═════════════════════════╗\n   📊 BẢNG XẾP HẠNG NHÓM (${storage.length})\n╚═════════════════════════╝\n`;
        const topList = storage.slice(0, 25);
        topList.forEach((user, idx) => {
            msg += `\n#${idx + 1}. ${user.name}\n   ➜ Tin nhắn: ${user.count.toLocaleString()} | Rank: ${getRankName(user.count)}`;
        });
        return api.sendMessage(msg, threadID, messageID);
    }

    // Single user check (mention, reply or self)
    let targetID = String(senderID);
    if (type === 'message_reply') {
        targetID = String(messageReply.senderID);
    } else if (mentions && Object.keys(mentions).length > 0) {
        targetID = String(Object.keys(mentions)[0]);
    }

    let targetName = "Bạn";
    try {
        targetName = await Users.getNameUser(targetID) || targetName;
    } catch (_) {}

    const userCount = data[targetID] || 0;

    // Calculate rank position in group
    const allCounts = Object.values(data).sort((a, b) => b - a);
    const position = allCounts.indexOf(userCount) + 1;

    const rankMsg = 
`╔═════════════════════════╗
   🏆 THÔNG TIN TƯƠNG TÁC
╚═════════════════════════╝
👤 Thành viên: ${targetName}
🆔 UID: ${targetID}
💬 Tổng tin nhắn: ${userCount.toLocaleString()} tin
🏅 Cấp bậc: ${getRankName(userCount)}
📊 Vị trí trong nhóm: Top ${position || 1}/${allCounts.length || 1}`;

    return api.sendMessage(rankMsg, threadID, messageID);
};
