module.exports.config = {
    name: "admin",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Cấu hình quản trị viên bot và chế độ chỉ admin dùng",
    commandCategory: "Hệ Thống",
    usages: "[add/sp/list/remove/delete/boxonly/only/support/ibrieng]",
    cooldowns: 0,
    dependencies: {
        "fs-extra": ""
    }
};

module.exports.languages = {
    "vi": {
        "listAdmin": "===== ADMINBOT =====\n»============«\n\n%1",
        "addedNewAdmin": "➜ Đã thêm %1 người dùng làm ADMINBOT:\n\n%2",
        "removedAdmin": "➜ Đã gỡ bỏ %1 ADMINBOT:\n\n%2",
        "adminsupport": "➜ Đã thêm %1 người dùng làm SUPPORTBOT:\n\n%2",
        "removedAdminSupport": "➜ Đã gỡ bỏ %1 SUPPORTBOT:\n\n%2"
    }
};

module.exports.onLoad = function() {
    const fs = require('fs-extra');
    const path = require("path");
    const dataPath = path.resolve(__dirname, 'cache', 'data.json');
    fs.ensureDirSync(path.resolve(__dirname, 'cache'));
    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, JSON.stringify({ adminbox: {} }, null, 4));
    } else {
        try {
            const data = fs.readJsonSync(dataPath);
            if (!data.adminbox) data.adminbox = {};
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 4));
        } catch (_) {}
    }
};

module.exports.run = async function ({ api, event, args, Users, permssion, getText }) {
    const fs = require("fs-extra");
    const path = require("path");
    const content = args.slice(1);
    const moment = require("moment-timezone");
    const timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");

    if (args.length === 0) {
        return api.sendMessage(
`=== 『 𝐂𝐀́𝐂𝐇 𝐃𝐔̀𝐍𝐆 』 ===
▱▱▱▱▱▱▱▱▱▱▱▱▱
→ admin list => Xem danh sách admin & support
→ admin add => Thêm admin bot
→ admin sp => Thêm support bot
→ admin remove => Gỡ admin bot
→ admin delete => Gỡ support bot
→ admin boxonly => Bật/tắt chế độ chỉ QTV nhóm dùng bot
→ admin only => Bật/tắt chế độ chỉ admin dùng bot
→ admin support => Bật/tắt chế độ chỉ support bot dùng bot
→ admin ibrieng => Bật/tắt chế độ nhắn riêng với bot
▱▱▱▱▱▱▱▱▱▱▱▱▱
===「${timeNow}」===`, event.threadID, event.messageID);
    }

    const { threadID, messageID, mentions, senderID } = event;
    const { configPath } = global.client;
    const ADMINBOT = global.config.ADMINBOT || [];
    const NDH = global.config.NDH || [];
    const mention = Object.keys(mentions || {});

    delete require.cache[require.resolve(configPath)];
    const config = require(configPath);
    if (!config.ADMINBOT) config.ADMINBOT = [];
    if (!config.NDH) config.NDH = [];

    const isBotAdmin = ADMINBOT.includes(String(senderID)) || permssion >= 2;

    switch (args[0].toLowerCase()) {
        case "list": {
            let msg = [];
            let i = 1;
            for (const idAdmin of (config.ADMINBOT || [])) {
                try {
                    const name = (await Users.getData(idAdmin)).name;
                    msg.push(`${i++}. ${name || "Admin"} (UID: ${idAdmin})`);
                } catch (_) {
                    msg.push(`${i++}. UID: ${idAdmin}`);
                }
            }
            let msg1 = [];
            let j = 1;
            for (const idNDH of (config.NDH || [])) {
                try {
                    const name1 = (await Users.getData(idNDH)).name;
                    msg1.push(`${j++}. ${name1 || "Support"} (UID: ${idNDH})`);
                } catch (_) {
                    msg1.push(`${j++}. UID: ${idNDH}`);
                }
            }
            return api.sendMessage(
`===== ADMINBOT =====
»============«
${msg.join("\n") || "Chưa có admin bot"}

——————🔱——————

==== SUPPORTBOT ====
»============«
${msg1.join("\n") || "Chưa có support bot"}`, threadID, messageID);
        }

        case "add": {
            if (!isBotAdmin) return api.sendMessage("➜ Bạn không có quyền sử dụng chức năng này!", threadID, messageID);
            let targetID = null;
            if (event.type === "message_reply") targetID = event.messageReply.senderID;
            else if (mention.length > 0) targetID = mention[0];
            else if (content[0] && !isNaN(content[0])) targetID = content[0];

            if (!targetID) return api.sendMessage("➜ Vui lòng tag, reply hoặc nhập UID người cần thêm làm ADMINBOT!", threadID, messageID);
            if (config.ADMINBOT.includes(targetID)) return api.sendMessage("➜ Người dùng này đã là ADMINBOT!", threadID, messageID);

            config.ADMINBOT.push(targetID);
            if (!global.config.ADMINBOT.includes(targetID)) global.config.ADMINBOT.push(targetID);
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');

            let uName = "Admin";
            try { uName = (await Users.getData(targetID)).name || uName; } catch (_) {}
            return api.sendMessage(`➜ Đã thêm ${uName} (UID: ${targetID}) làm ADMINBOT thành công!`, threadID, messageID);
        }

        case "sp": {
            if (!isBotAdmin) return api.sendMessage("➜ Bạn không có quyền sử dụng chức năng này!", threadID, messageID);
            let targetID = null;
            if (event.type === "message_reply") targetID = event.messageReply.senderID;
            else if (mention.length > 0) targetID = mention[0];
            else if (content[0] && !isNaN(content[0])) targetID = content[0];

            if (!targetID) return api.sendMessage("➜ Vui lòng tag, reply hoặc nhập UID người cần thêm làm SUPPORTBOT!", threadID, messageID);
            if (config.NDH.includes(targetID)) return api.sendMessage("➜ Người dùng này đã là SUPPORTBOT!", threadID, messageID);

            config.NDH.push(targetID);
            if (!global.config.NDH.includes(targetID)) global.config.NDH.push(targetID);
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');

            let uName = "Support";
            try { uName = (await Users.getData(targetID)).name || uName; } catch (_) {}
            return api.sendMessage(`➜ Đã thêm ${uName} (UID: ${targetID}) làm SUPPORTBOT thành công!`, threadID, messageID);
        }

        case "remove": {
            if (!isBotAdmin) return api.sendMessage("➜ Bạn không có quyền sử dụng chức năng này!", threadID, messageID);
            let targetID = null;
            if (event.type === "message_reply") targetID = event.messageReply.senderID;
            else if (mention.length > 0) targetID = mention[0];
            else if (content[0] && !isNaN(content[0])) targetID = content[0];

            if (!targetID) return api.sendMessage("➜ Vui lòng tag, reply hoặc nhập UID người cần gỡ ADMINBOT!", threadID, messageID);
            const idx = config.ADMINBOT.indexOf(targetID);
            if (idx === -1) return api.sendMessage("➜ Người dùng này không có trong danh sách ADMINBOT!", threadID, messageID);

            config.ADMINBOT.splice(idx, 1);
            const gIdx = global.config.ADMINBOT.indexOf(targetID);
            if (gIdx !== -1) global.config.ADMINBOT.splice(gIdx, 1);
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');

            return api.sendMessage(`➜ Đã gỡ bỏ ADMINBOT có UID: ${targetID} thành công!`, threadID, messageID);
        }

        case "delete": {
            if (!isBotAdmin) return api.sendMessage("➜ Bạn không có quyền sử dụng chức năng này!", threadID, messageID);
            let targetID = null;
            if (event.type === "message_reply") targetID = event.messageReply.senderID;
            else if (mention.length > 0) targetID = mention[0];
            else if (content[0] && !isNaN(content[0])) targetID = content[0];

            if (!targetID) return api.sendMessage("➜ Vui lòng tag, reply hoặc nhập UID người cần gỡ SUPPORTBOT!", threadID, messageID);
            const idx = config.NDH.indexOf(targetID);
            if (idx === -1) return api.sendMessage("➜ Người dùng này không có trong danh sách SUPPORTBOT!", threadID, messageID);

            config.NDH.splice(idx, 1);
            const gIdx = global.config.NDH.indexOf(targetID);
            if (gIdx !== -1) global.config.NDH.splice(gIdx, 1);
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');

            return api.sendMessage(`➜ Đã gỡ bỏ SUPPORTBOT có UID: ${targetID} thành công!`, threadID, messageID);
        }

        case "boxonly": {
            if (permssion < 1) return api.sendMessage("➜ Chỉ Quản trị viên nhóm mới có thể dùng lệnh này!", threadID, messageID);
            const pathData = path.resolve(__dirname, 'cache', 'data.json');
            const database = fs.readJsonSync(pathData);
            if (!database.adminbox) database.adminbox = {};
            database.adminbox[threadID] = !database.adminbox[threadID];
            fs.writeFileSync(pathData, JSON.stringify(database, null, 4));

            return api.sendMessage(`➜ ${database.adminbox[threadID] ? "Bật" : "Tắt"} thành công chế độ chỉ Quản trị viên nhóm mới dùng được bot!`, threadID, messageID);
        }

        case "only":
        case "-o": {
            if (!isBotAdmin) return api.sendMessage("➜ Chỉ ADMINBOT mới có quyền bật/tắt chế độ này!", threadID, messageID);
            config.adminOnly = !config.adminOnly;
            global.config.adminOnly = config.adminOnly;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
            return api.sendMessage(`➜ ${config.adminOnly ? "Bật" : "Tắt"} thành công chế độ chỉ ADMINBOT mới dùng được bot!`, threadID, messageID);
        }

        case "support":
        case "-sp": {
            if (!isBotAdmin) return api.sendMessage("➜ Chỉ ADMINBOT hoặc Support mới có quyền sử dụng!", threadID, messageID);
            config.ndhOnly = !config.ndhOnly;
            global.config.ndhOnly = config.ndhOnly;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
            return api.sendMessage(`➜ ${config.ndhOnly ? "Bật" : "Tắt"} thành công chế độ chỉ SUPPORTBOT mới dùng được bot!`, threadID, messageID);
        }

        case "ibrieng": {
            if (!isBotAdmin) return api.sendMessage("➜ Chỉ ADMINBOT mới có quyền sử dụng chức năng này!", threadID, messageID);
            config.adminPaseOnly = !config.adminPaseOnly;
            global.config.adminPaseOnly = config.adminPaseOnly;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
            return api.sendMessage(`➜ ${config.adminPaseOnly ? "Bật" : "Tắt"} thành công chế độ chỉ ADMINBOT mới chat riêng được với bot!`, threadID, messageID);
        }

        default:
            return api.sendMessage("➜ Lệnh không hợp lệ! Dùng 'admin' để xem hướng dẫn sử dụng.", threadID, messageID);
    }
};
