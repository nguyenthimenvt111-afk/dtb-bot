module.exports.config = {
    name: "unban",
    version: "2.0.0",
    hasPermssion: 3,
    credits: "dtb",
    description: "Gỡ ban nhóm và người dùng",
    commandCategory: "Hệ Thống",
    usages: "unban [admin/ndh/allbox/box/alluser]",
    cooldowns: 2
};

module.exports.run = async ({ event, api, Users, Threads, args }) => {
    const { threadID, messageID } = event;

    switch (args[0] ? args[0].toLowerCase() : "") {
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
            const idbox = String(event.threadID);
            const data = (await Threads.getData(idbox)).data || {};
            data.banned = false;
            data.reason = null;
            data.dateAdded = null;
            await Threads.setData(idbox, { data });
            global.data.threadBanned.delete(idbox);
            return api.sendMessage("➜ Đã gỡ ban cho nhóm hiện tại!", threadID, messageID);
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
`====『 UNBAN 』====
➜ ${global.config.PREFIX}unban box -> Gỡ ban cho nhóm hiện tại
➜ ${global.config.PREFIX}unban allbox -> Gỡ ban cho tất cả nhóm
➜ ${global.config.PREFIX}unban alluser -> Gỡ ban cho tất cả người dùng
➜ ${global.config.PREFIX}unban admin -> Gỡ ban cho Admin Bot`, threadID, messageID);
    }
};
