module.exports.config = {
    name: "unban",
    version: "2.1.0",
    hasPermssion: 2,
    credits: "dtb",
    description: "Gỡ cấm nhóm và người dùng trên hệ thống bot",
    commandCategory: "Hệ Thống",
    usages: "unban [user/box/alluser/allbox/admin/ndh]",
    cooldowns: 2
};

module.exports.run = async ({ event, api, Users, Threads, args }) => {
    const { threadID, messageID, mentions, messageReply } = event;
    const sub = args[0] ? args[0].toLowerCase() : "";

    switch (sub) {
        case 'user':
        case 'u': {
            let targetID = null;
            if (messageReply) targetID = messageReply.senderID;
            else if (mentions && Object.keys(mentions).length > 0) targetID = Object.keys(mentions)[0];
            else if (args[1]) targetID = args[1];

            if (!targetID) return api.sendMessage("➜ Vui lòng tag, reply hoặc nhập UID người dùng cần gỡ cấm!", threadID, messageID);

            const data = (await Users.getData(targetID)).data || {};
            data.banned = false;
            data.reason = null;
            data.dateAdded = null;
            await Users.setData(targetID, { data });
            global.data.userBanned.delete(String(targetID));

            let uName = "Người dùng";
            try { uName = await Users.getNameUser(targetID) || uName; } catch (_) {}
            return api.sendMessage(`➜ Đã gỡ cấm thành công cho người dùng: ${uName} (UID: ${targetID})!`, threadID, messageID);
        }

        case 'admin':
        case 'ad': {
            const listAdmin = global.config.ADMINBOT || [];
            for (const idad of listAdmin) {
                const data = (await Users.getData(idad)).data || {};
                data.banned = false;
                data.reason = null;
                data.dateAdded = null;
                await Users.setData(idad, { data });
                global.data.userBanned.delete(String(idad));
            }
            return api.sendMessage("➜ Đã gỡ ban cho toàn bộ Admin Bot!", threadID, messageID);
        }

        case 'ndh': {
            const listNDH = global.config.NDH || [];
            for (const idNDH of listNDH) {
                const data = (await Users.getData(idNDH)).data || {};
                data.banned = false;
                data.reason = null;
                data.dateAdded = null;
                await Users.setData(idNDH, { data });
                global.data.userBanned.delete(String(idNDH));
            }
            return api.sendMessage("➜ Đã gỡ ban cho toàn bộ Support Bot!", threadID, messageID);
        }

        case 'allbox':
        case 'allthread': {
            const threadBannedKeys = [...global.data.threadBanned.keys()];
            for (const singleThread of threadBannedKeys) {
                const data = (await Threads.getData(singleThread)).data || {};
                data.banned = false;
                data.reason = null;
                data.dateAdded = null;
                await Threads.setData(singleThread, { data });
                global.data.threadBanned.delete(String(singleThread));
            }
            return api.sendMessage(`➜ Đã gỡ ban cho ${threadBannedKeys.length} nhóm trên server!`, threadID, messageID);
        }

        case 'box':
        case 'thread': {
            const idbox = String(args[1] || event.threadID);
            const data = (await Threads.getData(idbox)).data || {};
            data.banned = false;
            data.reason = null;
            data.dateAdded = null;
            await Threads.setData(idbox, { data });
            global.data.threadBanned.delete(idbox);
            return api.sendMessage(`➜ Đã gỡ ban cho nhóm (TID: ${idbox}) thành công!`, threadID, messageID);
        }

        case 'allmember':
        case 'alluser': {
            const userBannedKeys = [...global.data.userBanned.keys()];
            for (const singleUser of userBannedKeys) {
                const data = (await Users.getData(singleUser)).data || {};
                data.banned = false;
                data.reason = null;
                data.dateAdded = null;
                await Users.setData(singleUser, { data });
                global.data.userBanned.delete(String(singleUser));
            }
            return api.sendMessage(`➜ Đã gỡ ban cho ${userBannedKeys.length} người dùng!`, threadID, messageID);
        }

        default:
            return api.sendMessage(
`====『 HƯỚNG DẪN UNBAN 』====
➜ ${global.config.PREFIX}unban user [UID/tag/reply] -> Gỡ cấm người dùng cụ thể
➜ ${global.config.PREFIX}unban box [TID] -> Gỡ cấm nhóm
➜ ${global.config.PREFIX}unban alluser -> Gỡ cấm tất cả người dùng
➜ ${global.config.PREFIX}unban allbox -> Gỡ cấm tất cả nhóm
➜ ${global.config.PREFIX}unban admin -> Gỡ cấm Admin Bot`, threadID, messageID);
    }
};
