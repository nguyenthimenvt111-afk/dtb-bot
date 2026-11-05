const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "cấm",
    version: "2.0.0",
    hasPermssion: 1,
    credits: "dtb",
    description: "Cấm đổi tên box và ảnh box",
    commandCategory: "Quản Lí Box",
    usages: "cấm [boxname/avtbox]",
    cooldowns: 5
};

const getBoxPath = () => {
    const dir = path.resolve(__dirname, "cache");
    fs.ensureDirSync(dir);
    return path.join(dir, "boxname.json");
};

module.exports.onLoad = () => {
    const p = getBoxPath();
    if (!fs.existsSync(p)) fs.writeFileSync(p, "[]", "utf-8");
};

module.exports.run = async ({ event, api, args }) => {
    const p = getBoxPath();
    const { threadID, messageID } = event;
    let dataJson = [];
    try { dataJson = JSON.parse(fs.readFileSync(p, "utf-8")); } catch (_) {}

    let threadItem = dataJson.find(item => String(item.boxid) === String(threadID));
    if (!threadItem) {
        threadItem = { boxid: String(threadID), boxname: false, avtbox: false };
        dataJson.push(threadItem);
    }

    const action = args[0] ? args[0].toLowerCase() : "";
    if (action === "boxname") {
        threadItem.boxname = !threadItem.boxname;
        fs.writeFileSync(p, JSON.stringify(dataJson, null, 4), "utf-8");
        return api.sendMessage(`➜ Đã ${threadItem.boxname ? "BẬT" : "TẮT"} chế độ cấm đổi tên nhóm!`, threadID, messageID);
    }

    if (action === "avtbox" || action === "image") {
        threadItem.avtbox = !threadItem.avtbox;
        fs.writeFileSync(p, JSON.stringify(dataJson, null, 4), "utf-8");
        return api.sendMessage(`➜ Đã ${threadItem.avtbox ? "BẬT" : "TẮT"} chế độ cấm đổi ảnh nhóm!`, threadID, messageID);
    }

    return api.sendMessage(
`=== 『 CẤM THAY ĐỔI 』 ===
◆━━━━━━━━━━━━━━━━◆
➜ ${global.config.PREFIX}cấm boxname => Cấm đổi tên nhóm (Hiện tại: ${threadItem.boxname ? "BẬT" : "TẮT"})
➜ ${global.config.PREFIX}cấm avtbox => Cấm đổi ảnh nhóm (Hiện tại: ${threadItem.avtbox ? "BẬT" : "TẮT"})`, threadID, messageID);
};
