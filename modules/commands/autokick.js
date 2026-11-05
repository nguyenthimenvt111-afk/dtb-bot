const fs = require('fs');
const path = require('path');

const databanuserFolderPath = path.join(__dirname, 'cache', 'data', 'databanuser');
if (!fs.existsSync(databanuserFolderPath)) {
    fs.mkdirSync(databanuserFolderPath, { recursive: true });
}

async function createIfNotExist(filePath) {
    if (!fs.existsSync(filePath)) {
        await fs.promises.writeFile(filePath, JSON.stringify([]), 'utf8');
    }
}

module.exports.config = {
    name: "autokick",
    version: "2.0.0",
    hasPermssion: 1,
    credits: "dtb",
    description: "Tự động kick người dùng theo danh sách cấm của nhóm",
    commandCategory: "Quản Lí Box",
    usages: "[add/remove/list] [UID]",
    cooldowns: 5,
    dependencies: {
        "fs-extra": ""
    }
};

module.exports.run = async ({ event, api, args }) => {
    const threadID = event.threadID;
    if (args.length === 0) {
        return api.sendMessage(
`[ CÁCH SỬ DỤNG AUTOKICK ]
- Thêm ID vào danh sách cấm: ${global.config.PREFIX}autokick add <ID1>|<ID2>|...
- Xóa ID khỏi danh sách cấm: ${global.config.PREFIX}autokick remove <ID1>|<ID2>|...
- Liệt kê danh sách cấm: ${global.config.PREFIX}autokick list`, threadID, event.messageID);
    }

    const threadFilePath = path.join(databanuserFolderPath, `${threadID}.json`);
    await createIfNotExist(threadFilePath);
    let data = JSON.parse(await fs.promises.readFile(threadFilePath, 'utf8'));
    const action = args[0].toLowerCase();

    switch (action) {
        case "add": {
            args.shift();
            const userIDsToAdd = args.join(" ").split('|').map(id => id.trim()).filter(Boolean);
            const addedInfos = [];
            for (const userID of userIDsToAdd) {
                if (!data.includes(userID)) {
                    data.push(userID);
                    let userName = "Người dùng";
                    try {
                        const userInfo = await api.getUserInfo(userID);
                        userName = userInfo[userID] ? userInfo[userID].name : userName;
                    } catch (_) {}
                    addedInfos.push(`${userName} (ID: ${userID})`);
                }
            }
            await fs.promises.writeFile(threadFilePath, JSON.stringify(data, null, 2));
            if (addedInfos.length > 0) {
                return api.sendMessage(`➜ Đã thêm vào danh sách cấm:\n${addedInfos.join('\n')}`, threadID);
            } else {
                return api.sendMessage("➜ Không có UID mới nào được thêm vào.", threadID);
            }
        }
        case "remove": {
            args.shift();
            const userIDsToRemove = args.join(" ").split('|').map(id => id.trim());
            const removedIDs = [];
            data = data.filter(userID => {
                if (!userIDsToRemove.includes(userID)) return true;
                removedIDs.push(userID);
                return false;
            });
            await fs.promises.writeFile(threadFilePath, JSON.stringify(data, null, 2));
            return api.sendMessage(`➜ Đã xóa khỏi danh sách cấm: ${removedIDs.join(', ')}`, threadID);
        }
        case "list": {
            if (data.length === 0) return api.sendMessage("➜ Danh sách cấm của nhóm hiện đang trống.", threadID);
            let msg = `====『 DANH SÁCH BỊ CẤM (${data.length}) 』====\n`;
            for (let i = 0; i < data.length; i++) {
                let uName = "Người dùng";
                try {
                    const uInfo = await api.getUserInfo(data[i]);
                    uName = uInfo[data[i]] ? uInfo[data[i]].name : uName;
                } catch (_) {}
                msg += `${i + 1}. ${uName} (UID: ${data[i]})\n`;
            }
            return api.sendMessage(msg, threadID);
        }
        default:
            return api.sendMessage("➜ Lệnh sai! Sử dụng 'autokick' để xem hướng dẫn.", threadID);
    }
};

module.exports.handleEvent = async ({ api, event }) => {
    const { senderID, threadID } = event;
    if (!threadID || !senderID) return;
    const threadFilePath = path.join(databanuserFolderPath, `${threadID}.json`);
    if (!fs.existsSync(threadFilePath)) return;

    try {
        const bannedUsers = JSON.parse(await fs.promises.readFile(threadFilePath, 'utf8'));
        if (bannedUsers.includes(String(senderID))) {
            await api.removeUserFromGroup(senderID, threadID).catch(() => {});
            api.sendMessage(`➜ Đã tự động kick người dùng ${senderID} vì nằm trong danh sách cấm của nhóm!`, threadID);
        }
    } catch (_) {}
};
