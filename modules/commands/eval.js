const util = require('util');

module.exports.config = {
    name: 'eval',
    version: '2.0.0',
    hasPermssion: 2,
    hasPermission: 2,
    credits: "dtb",
    description: 'Thực thi mã JavaScript trực tiếp trên hệ thống (Chỉ Admin Bot)',
    commandCategory: 'Hệ Thống',
    usages: '[code js]',
    cooldowns: 1
};

module.exports.run = async function(o) {
    const { api, event, args } = o;
    const { threadID, messageID, senderID } = event;
    const isBotAdmin = (global.config.ADMINBOT || []).includes(String(senderID));

    if (!isBotAdmin) {
        return api.sendMessage("⚠️ Chỉ Admin Bot mới có quyền thực thi lệnh eval!", threadID, messageID);
    }

    if (!args[0]) {
        return api.sendMessage("➜ Vui lòng nhập mã JavaScript cần thực thi!", threadID, messageID);
    }

    const code = args.join(' ');
    try {
        let result = eval(code);
        if (result instanceof Promise) {
            result = await result;
        }
        let output = util.inspect(result, { depth: 2, maxArrayLength: 50 });
        if (output.length > 2000) {
            output = output.substring(0, 1990) + "\n... [Đã rút gọn]";
        }
        return api.sendMessage(`=== [ EVAL RESULT ] ===\n${output}`, threadID, messageID);
    } catch (e) {
        return api.sendMessage(`=== [ EVAL ERROR ] ===\n${e.stack || e.toString()}`, threadID, messageID);
    }
};
