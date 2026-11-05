module.exports.config = {
    name: "uidall",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Lấy toàn bộ UID và tên thành viên trong nhóm",
    commandCategory: "Nhóm",
    cooldowns: 5
};

module.exports.run = async ({ api, event, Users }) => {
    try {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const participants = threadInfo.participantIDs || [];
        if (participants.length === 0) return api.sendMessage("➜ Không lấy được danh sách thành viên!", event.threadID, event.messageID);

        let msg = `====『 UID THÀNH VIÊN (${participants.length}) 』====\n━━━━━━━━━━━━━━━━━━\n`;
        let count = 1;
        for (const uid of participants) {
            let name = "Người dùng Facebook";
            try { name = await Users.getNameUser(uid) || name; } catch (_) {}
            msg += `${count++}. ${name}\n➜ UID: ${uid}\n\n`;
        }

        return api.sendMessage(msg, event.threadID, event.messageID);
    } catch (e) {
        console.error("Lỗi uidall:", e);
        return api.sendMessage("➜ Không thể lấy danh sách UID thành viên!", event.threadID, event.messageID);
    }
};
