module.exports.config = {
    name: "kick",
    version: "2.1.0",
    hasPermssion: 1,
    hasPermission: 1,
    credits: "dtb",
    description: "Xoá người dùng khỏi nhóm bằng tag, reply, UID hoặc kick all",
    commandCategory: "Quản Lí Box",
    usages: "[tag / reply / UID / all]",
    cooldowns: 2
};

module.exports.run = async function ({ args, api, event }) {
    try {
        const { threadID, messageID, senderID, mentions, type, messageReply } = event;
        const botID = String(api.getCurrentUserID());
        const threadInfo = await api.getThreadInfo(threadID);
        const adminIDs = (Array.isArray(threadInfo.adminIDs) ? threadInfo.adminIDs : []).map(a => String(a.id));
        const ADMINBOT = (global.config.ADMINBOT || []).map(String);

        if (!adminIDs.includes(botID)) {
            return api.sendMessage("➜ Bot cần có quyền Quản trị viên của nhóm để thực hiện kick!", threadID, messageID);
        }

        const participants = (threadInfo.participantIDs || []).map(String);

        // Case 1: Kick by mentions (Tag)
        if (mentions && Object.keys(mentions).length > 0) {
            const mentionIDs = Object.keys(mentions);
            let kickedCount = 0;
            mentionIDs.forEach((id, index) => {
                if (id === botID || ADMINBOT.includes(id)) return;
                setTimeout(() => {
                    api.removeUserFromGroup(id, threadID, (err) => {
                        if (err) console.error(`Không thể kick UID ${id}:`, err);
                    });
                }, index * 1200);
                kickedCount++;
            });
            if (kickedCount === 0) {
                return api.sendMessage("➜ Không thể kick Bot hoặc Admin Bot!", threadID, messageID);
            }
            return api.sendMessage(`➜ Đang tiến hành kick ${kickedCount} thành viên được gắn thẻ...`, threadID);
        }

        // Case 2: Kick by reply
        if (type === "message_reply") {
            const uid = String(messageReply.senderID);
            if (uid === botID) return api.sendMessage("➜ Không thể kick Bot!", threadID, messageID);
            if (ADMINBOT.includes(uid)) return api.sendMessage("➜ Không thể kick Admin Bot!", threadID, messageID);
            return api.removeUserFromGroup(uid, threadID, (err) => {
                if (err) return api.sendMessage("➜ Lỗi khi xóa thành viên khỏi nhóm!", threadID, messageID);
            });
        }

        // Case 3: Kick all
        if (args[0] && args[0].toLowerCase() === "all") {
            const listUserID = participants.filter(id => id !== botID && id !== String(senderID) && !ADMINBOT.includes(id));
            if (listUserID.length === 0) {
                return api.sendMessage("➜ Không có thành viên nào đủ điều kiện để kick!", threadID, messageID);
            }

            api.sendMessage(`➜ Bắt đầu kick ${listUserID.length} thành viên khỏi nhóm (giãn cách 1.2s/người)...`, threadID);
            listUserID.forEach((idUser, idx) => {
                setTimeout(() => {
                    api.removeUserFromGroup(idUser, threadID, (err) => {
                        if (err) console.error(`Lỗi kick UID ${idUser}:`, err);
                    });
                }, idx * 1200);
            });
            return;
        }

        // Case 4: Kick by UID directly
        if (args[0] && /^\d+$/.test(args[0])) {
            const uid = String(args[0]);
            if (uid === botID) return api.sendMessage("➜ Không thể kick Bot!", threadID, messageID);
            if (ADMINBOT.includes(uid)) return api.sendMessage("➜ Không thể kick Admin Bot!", threadID, messageID);
            if (!participants.includes(uid)) {
                return api.sendMessage(`➜ Người dùng có UID [${uid}] không có trong nhóm!`, threadID, messageID);
            }
            return api.removeUserFromGroup(uid, threadID, (err) => {
                if (err) return api.sendMessage(`➜ Không thể kick UID [${uid}]!`, threadID, messageID);
                return api.sendMessage(`➜ Đã kick người dùng có UID: ${uid}`, threadID);
            });
        }

        return api.sendMessage(
`╔═════════════════════════╗
       HƯỚNG DẪN KICK
╚═════════════════════════╝
▸ ${global.config.PREFIX}kick @tag : Kick người được tag
▸ ${global.config.PREFIX}kick [reply] : Reply tin nhắn người cần kick
▸ ${global.config.PREFIX}kick [UID] : Kick trực tiếp theo UID
▸ ${global.config.PREFIX}kick all : Kick tất cả thành viên`, threadID, messageID);
    } catch (e) {
        console.error("Lỗi kick:", e);
        return api.sendMessage("➜ Đã xảy ra sự cố khi thực hiện lệnh kick!", event.threadID, event.messageID);
    }
};
