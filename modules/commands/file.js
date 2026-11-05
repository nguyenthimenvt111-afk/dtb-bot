const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "file",
    version: "1.1.0",
    hasPermssion: 3,
    credits: "dtb",
    description: "Quản lý xem và dọn dẹp các file/folder trong thư mục commands",
    commandCategory: "Hệ Thống",
    usages: "[start <ký tự> / ext <đuôi file> / <từ khóa> / trống]",
    cooldowns: 5
};

module.exports.handleReply = ({ api, event, handleReply }) => {
    if (String(event.senderID) !== String(handleReply.author)) return; 
    const arrnum = event.body.trim().split(/\s+/);
    let msg = "";
    const nums = arrnum.map(n => parseInt(n)).filter(n => !isNaN(n));

    for (let num of nums) {
        const target = handleReply.files[num - 1];
        if (!target) continue;
        const targetPath = path.join(__dirname, target);
        if (!fs.existsSync(targetPath)) continue;

        const stat = fs.statSync(targetPath);
        if (stat.isDirectory()) {
            fs.removeSync(targetPath);
            msg += `[Thư mục 🗂️] ${target}\n`;
        } else {
            fs.unlinkSync(targetPath);
            msg += `[Tệp tin 📄] ${target}\n`;
        }
    }
    api.sendMessage("⚡️ Đã xóa các file sau trong thư mục commands:\n\n" + (msg || "Không có file nào bị xóa"), event.threadID, event.messageID);
};

module.exports.run = async function({ api, event, args }) {
    const adminBot = (global.config.ADMINBOT || []).map(String);
    if (!adminBot.includes(String(event.senderID))) {
        return api.sendMessage("➜ Bạn không có quyền sử dụng chức năng quản lý tệp tin hệ thống!", event.threadID, event.messageID);
    }

    const files = fs.readdirSync(__dirname) || [];
    let filteredFiles = files;

    if (args[0] === "start" && args[1]) {
        filteredFiles = files.filter(f => f.toLowerCase().startsWith(args[1].toLowerCase()));
    } else if (args[0] === "ext" && args[1]) {
        filteredFiles = files.filter(f => f.toLowerCase().endsWith(args[1].toLowerCase()));
    } else if (args[0]) {
        filteredFiles = files.filter(f => f.toLowerCase().includes(args[0].toLowerCase()));
    }

    if (filteredFiles.length === 0) {
        return api.sendMessage("➜ Không tìm thấy tệp hoặc thư mục nào phù hợp!", event.threadID, event.messageID);
    }

    let msg = `====『 DANH SÁCH FILE (${filteredFiles.length}) 』====\n`;
    const limit = 30;
    const slice = filteredFiles.slice(0, limit);

    slice.forEach((f, idx) => {
        const isDir = fs.statSync(path.join(__dirname, f)).isDirectory();
        msg += `${idx + 1}. [${isDir ? "Folder" : "File"}] ${f}\n`;
    });

    if (filteredFiles.length > limit) {
        msg += `... và còn ${filteredFiles.length - limit} file khác.\n`;
    }

    msg += "\n👉 Reply số thứ tự các file cách nhau bởi dấu cách để XÓA file.";

    return api.sendMessage(msg, event.threadID, (err, info) => {
        if (!err && global.client.handleReply) {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: event.senderID,
                files: slice
            });
        }
    }, event.messageID);
};
