const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "autosetname",
    version: "2.1.0",
    hasPermssion: 1,
    hasPermission: 1,
    credits: "dtb",
    description: "Tự động đặt biệt danh cho thành viên mới tham gia nhóm",
    commandCategory: "Quản Lí Box",
    usages: "[add <định dạng> / remove]",
    cooldowns: 2
};

const getDataPath = () => {
    const dir = path.resolve(__dirname, "cache", "data");
    fs.ensureDirSync(dir);
    return path.join(dir, "autosetname.json");
};

module.exports.onLoad = () => {
    const filePath = getDataPath();
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "[]", "utf-8");
};

module.exports.run = async function({ event, api, args }) {
    const { threadID, messageID } = event;
    const prefix = (global.data.threadData.get(String(threadID)) || {}).PREFIX || global.config.PREFIX;
    const filePath = getDataPath();
    let dataJson = [];
    try { dataJson = JSON.parse(fs.readFileSync(filePath, "utf-8")); } catch (_) {}

    let thisThread = dataJson.find(item => String(item.threadID) === String(threadID));
    if (!thisThread) {
        thisThread = { threadID: String(threadID), nameUser: [] };
        dataJson.push(thisThread);
    }

    const action = args[0] ? args[0].toLowerCase() : "";
    const content = args.slice(1).join(" ").trim();

    switch (action) {
        case "add": {
            if (!content) return api.sendMessage("➜ Định dạng biệt danh không được để trống!", threadID, messageID);
            thisThread.nameUser = [content];
            fs.writeFileSync(filePath, JSON.stringify(dataJson, null, 4), "utf-8");
            const preview = content.includes("{name}") ? content.replace(/\{name\}/g, "Nguyễn Văn A") : `${content} Nguyễn Văn A`;
            return api.sendMessage(`➜ Cấu hình biệt danh thành viên mới thành công!\n➜ Xem trước: ${preview}`, threadID, messageID);
        }
        case "rm":
        case "remove":
        case "del":
        case "delete": {
            if (!thisThread.nameUser || thisThread.nameUser.length === 0) {
                return api.sendMessage("➜ Nhóm hiện chưa cài đặt biệt danh tự động!", threadID, messageID);
            }
            thisThread.nameUser = [];
            fs.writeFileSync(filePath, JSON.stringify(dataJson, null, 4), "utf-8");
            return api.sendMessage("➜ Đã xóa cấu hình tự động đặt biệt danh cho thành viên mới!", threadID, messageID);
        }
        default:
            return api.sendMessage(
`╔═════════════════════════╗
       AUTOSETNAME DTB
╚═════════════════════════╝
▸ ${prefix}autosetname add <tiền tố> : Đặt tiền tố (VD: [TVM])
▸ ${prefix}autosetname add <mẫu {name}> : Đặt theo mẫu (VD: [TVM] {name})
▸ ${prefix}autosetname remove : Xóa cấu hình`, threadID, messageID);
    }
};
