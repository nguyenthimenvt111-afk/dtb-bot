module.exports.config = {
    name: "listban",
    version: "2.0.0",
    hasPermssion: 2,
    credits: "dtb",
    description: "Xem danh sách cấm của nhóm hoặc của người dùng",
    commandCategory: "Hệ Thống",
    usages: "[thread/user]",
    cooldowns: 5
};

module.exports.run = async function ({ event, api, Users, args, Threads }) {
    const { threadID, messageID } = event;
    const type = args[0] ? args[0].toLowerCase() : "";

    if (type === "thread" || type === "t" || type === "-t") {
        const threadBannedKeys = [...global.data.threadBanned.keys()];
        if (threadBannedKeys.length === 0) return api.sendMessage("➜ Hiện không có nhóm nào bị cấm!", threadID, messageID);

        let msg = `====『 NHÓM BỊ CẤM (${threadBannedKeys.length}) 』====\n━━━━━━━━━━━━━━━━━━\n`;
        let count = 1;
        for (const tid of threadBannedKeys) {
            let tObj = global.data.threadInfo.get(String(tid));
            let nameT = tObj ? tObj.threadName : "Nhóm chat";
            let reason = (global.data.threadBanned.get(String(tid)) || {}).reason || "Không có lý do";
            msg += `${count++}. ${nameT}\n➜ TID: ${tid}\n➜ Lý do: ${reason}\n\n`;
        }
        return api.sendMessage(msg, threadID, messageID);
    }

    if (type === "user" || type === "u" || type === "-u") {
        const userBannedKeys = [...global.data.userBanned.keys()];
        if (userBannedKeys.length === 0) return api.sendMessage("➜ Hiện không có người dùng nào bị cấm!", threadID, messageID);

        let msg = `====『 NGƯỜI DÙNG BỊ CẤM (${userBannedKeys.length}) 』====\n━━━━━━━━━━━━━━━━━━\n`;
        let count = 1;
        for (const uid of userBannedKeys) {
            let uName = "Người dùng Facebook";
            try { uName = (await Users.getNameUser(uid)) || uName; } catch (_) {}
            let reason = (global.data.userBanned.get(String(uid)) || {}).reason || "Không có lý do";
            msg += `${count++}. ${uName}\n➜ UID: ${uid}\n➜ Lý do: ${reason}\n\n`;
        }
        return api.sendMessage(msg, threadID, messageID);
    }

    return api.sendMessage(
`====『 LIST BAN 』====
➜ ${global.config.PREFIX}listban thread -> Xem danh sách nhóm bị cấm
➜ ${global.config.PREFIX}listban user -> Xem danh sách người dùng bị cấm`, threadID, messageID);
};
