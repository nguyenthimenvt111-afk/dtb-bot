module.exports.config = {
    name: "kick",
    version: "2.0.0",
    hasPermssion: 1,
    credits: "dtb",
    description: "Xoá người dùng khỏi nhóm bằng tag, reply hoặc all",
    commandCategory: "Quản Lí Box",
    usages: "[tag/reply/all]",
    cooldowns: 0
};

module.exports.run = async function ({ args, api, event, Threads }) {
    try {
        const botID = String(api.getCurrentUserID());
        const threadInfo = await api.getThreadInfo(event.threadID);
        const adminIDs = (Array.isArray(threadInfo.adminIDs) ? threadInfo.adminIDs : []).map(a => String(a.id));

        if (!adminIDs.includes(botID)) {
            return api.sendMessage("➜ Bot cần quyền Quản trị viên để kick thành viên!", event.threadID, event.messageID);
        }

        const participants = threadInfo.participantIDs || [];

        if (event.mentions && Object.keys(event.mentions).length > 0) {
            const mentionIDs = Object.keys(event.mentions);
            for (let id of mentionIDs) {
                if (id === botID) continue;
                setTimeout(() => {
                    api.removeUserFromGroup(id, event.threadID);
                }, 1000);
            }
            return;
        }

        if (event.type === "message_reply") {
            const uid = event.messageReply.senderID;
            if (uid === botID) return api.sendMessage("➜ Không thể kick Bot!", event.threadID, event.messageID);
            return api.removeUserFromGroup(uid, event.threadID);
        }

        if (args[0] === "all") {
            const listUserID = participants.filter(id => id !== botID && id !== String(event.senderID));
            api.sendMessage(`➜ Bắt đầu kick ${listUserID.length} thành viên...`, event.threadID);
            for (let idUser of listUserID) {
                setTimeout(() => {
                    api.removeUserFromGroup(idUser, event.threadID);
                }, 1200);
            }
            return;
        }

        return api.sendMessage("➜ Vui lòng tag hoặc reply người muốn kick, hoặc dùng 'kick all'!", event.threadID, event.messageID);
    } catch (e) {
        console.error("Lỗi kick:", e);
        return api.sendMessage("➜ Không thể kick thành viên!", event.threadID, event.messageID);
    }
};
