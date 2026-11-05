module.exports.config = {
    name: 'listqtv',
    version: '1.1.0',
    hasPermssion: 0,
    credits: "dtb",
    description: 'Xem danh sách quản trị viên nhóm',
    commandCategory: 'Nhóm',
    usages: 'listqtv',
    cooldowns: 5
};

module.exports.run = async function({ api, event, Users }) {
    try {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const adminIDs = Array.isArray(threadInfo.adminIDs) ? threadInfo.adminIDs : [];
        let listad = '';
        let dem = 1;

        for (const admin of adminIDs) {
            let name = "Quản trị viên";
            try { name = await Users.getNameUser(admin.id) || name; } catch (_) {}
            listad += `${dem++}. ${name} (UID: ${admin.id})\n`;
        }

        return api.sendMessage(
`====『 QUẢN TRỊ VIÊN (${adminIDs.length}) 』====
━━━━━━━━━━━━━━━━━━
${listad || "Không có quản trị viên nào"}`, event.threadID, event.messageID);
    } catch (e) {
        return api.sendMessage("➜ Không thể lấy danh sách Quản trị viên nhóm!", event.threadID, event.messageID);
    }
};
