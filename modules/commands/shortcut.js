const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "shortcut",
    version: "2.0.0",
    hasPermssion: 1,
    credits: "dtb",
    description: "Phím tắt tự động trả lời theo từ khóa trong nhóm",
    commandCategory: "Nhóm",
    usages: "[all/delete <stt hoặc từ khóa>]",
    cooldowns: 3
};

const getFilePath = () => {
    const dataDir = path.resolve(__dirname, "cache", "data");
    fs.ensureDirSync(dataDir);
    return path.join(dataDir, "shortcutdata.json");
};

module.exports.onLoad = function () {
    const dataPath = getFilePath();
    if (!global.moduleData.shortcut) global.moduleData.shortcut = new Map();
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify([]), "utf-8");

    try {
        const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
        for (const threadData of data) {
            global.moduleData.shortcut.set(String(threadData.threadID), threadData.shortcuts || []);
        }
    } catch (_) {}
};

module.exports.handleEvent = async function ({ event, api, Users }) {
    const { threadID, messageID, body, senderID } = event;
    if (!body || !global.moduleData.shortcut || !global.moduleData.shortcut.has(String(threadID))) return;

    const data = global.moduleData.shortcut.get(String(threadID)) || [];
    const matched = data.find(item => item.input.toLowerCase() === body.trim().toLowerCase());
    if (matched) {
        let output = matched.output;
        if (/\{name}/g.test(output)) {
            let name = "Bạn";
            try { name = await Users.getNameUser(senderID) || name; } catch (_) {}
            output = output.replace(/\{name}/g, name);
        }
        return api.sendMessage(output, threadID, messageID);
    }
};

module.exports.handleReply = async function ({ event, api, handleReply }) {
    if (String(handleReply.author) !== String(event.senderID)) return;
    const { threadID, messageID, body } = event;
    const dataPath = getFilePath();

    if (handleReply.type === "requireInput") {
        if (!body.trim()) return api.sendMessage("➜ Từ khóa không được để trống!", threadID, messageID);
        const data = global.moduleData.shortcut.get(String(threadID)) || [];
        if (data.some(item => item.input.toLowerCase() === body.trim().toLowerCase())) {
            return api.sendMessage("➜ Từ khóa này đã tồn tại trong nhóm!", threadID, messageID);
        }
        api.unsendMessage(handleReply.messageID);
        return api.sendMessage("➜ Reply tin nhắn này để nhập câu trả lời khi gặp từ khóa:", threadID, (err, info) => {
            if (!err && global.client.handleReply) {
                global.client.handleReply.push({
                    type: "requireOutput",
                    name: this.config.name,
                    author: event.senderID,
                    messageID: info.messageID,
                    input: body.trim()
                });
            }
        }, messageID);
    }

    if (handleReply.type === "requireOutput") {
        if (!body.trim()) return api.sendMessage("➜ Câu trả lời không được để trống!", threadID, messageID);
        api.unsendMessage(handleReply.messageID);

        let data = [];
        try { data = JSON.parse(fs.readFileSync(dataPath, "utf-8")); } catch (_) {}

        let threadEntry = data.find(item => String(item.threadID) === String(threadID));
        if (!threadEntry) {
            threadEntry = { threadID: String(threadID), shortcuts: [] };
            data.push(threadEntry);
        }

        const id = Date.now().toString(36);
        const shortcutObj = { id, input: handleReply.input, output: body.trim() };
        threadEntry.shortcuts.push(shortcutObj);

        let globalShortcuts = global.moduleData.shortcut.get(String(threadID)) || [];
        globalShortcuts.push(shortcutObj);
        global.moduleData.shortcut.set(String(threadID), globalShortcuts);

        fs.writeFileSync(dataPath, JSON.stringify(data, null, 4), "utf-8");
        return api.sendMessage(
`➜ Đã thêm shortcut mới thành công:
- Từ khóa: ${handleReply.input}
- Câu trả lời: ${body.trim()}`, threadID, messageID);
    }
};

module.exports.run = function ({ event, api, args }) {
    const { threadID, messageID, senderID } = event;
    const dataPath = getFilePath();
    const action = args[0] ? args[0].toLowerCase() : "";

    if (action === "remove" || action === "delete" || action === "del" || action === "-d") {
        let data = [];
        try { data = JSON.parse(fs.readFileSync(dataPath, "utf-8")); } catch (_) {}
        let threadEntry = data.find(item => String(item.threadID) === String(threadID));
        if (!threadEntry || !threadEntry.shortcuts || threadEntry.shortcuts.length === 0) {
            return api.sendMessage("➜ Nhóm của bạn hiện chưa có shortcut nào được tạo!", threadID, messageID);
        }

        let idxNeedRemove = -1;
        if (args[1] && !isNaN(args[1])) {
            let numIdx = parseInt(args[1]) - 1;
            if (numIdx >= 0 && numIdx < threadEntry.shortcuts.length) {
                idxNeedRemove = numIdx;
            }
        }

        if (idxNeedRemove === -1 && args[1]) {
            let searchKey = args.slice(1).join(" ").toLowerCase();
            idxNeedRemove = threadEntry.shortcuts.findIndex(i => i.input.toLowerCase() === searchKey || i.id === searchKey);
        }

        if (idxNeedRemove === -1) {
            return api.sendMessage("➜ Không tìm thấy shortcut phù hợp để xóa!", threadID, messageID);
        }

        let removed = threadEntry.shortcuts.splice(idxNeedRemove, 1);
        global.moduleData.shortcut.set(String(threadID), threadEntry.shortcuts);
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 4), "utf-8");

        return api.sendMessage(`➜ Đã xóa shortcut "${removed[0].input}" thành công!`, threadID, messageID);
    }

    if (action === "list" || action === "all" || action === "-a") {
        const shortcuts = global.moduleData.shortcut.get(String(threadID)) || [];
        if (shortcuts.length === 0) return api.sendMessage("➜ Nhóm hiện chưa có shortcut nào!", threadID, messageID);

        let msg = "====『 SHORTCUT CỦA NHÓM 』====\n━━━━━━━━━━━━━━━━━━\n";
        shortcuts.forEach((item, i) => {
            msg += `${i + 1}. "${item.input}" => "${item.output}"\n`;
        });
        return api.sendMessage(msg, threadID, messageID);
    }

    return api.sendMessage("➜ Reply tin nhắn này để nhập từ khóa cho shortcut mới:", threadID, (err, info) => {
        if (!err && global.client.handleReply) {
            global.client.handleReply.push({
                type: "requireInput",
                name: this.config.name,
                author: senderID,
                messageID: info.messageID
            });
        }
    }, messageID);
};
