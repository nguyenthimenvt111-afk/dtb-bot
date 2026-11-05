const fs = require('fs-extra');
const path = require('path');

const databanuserFolderPath = path.join(__dirname, 'cache', 'data', 'databanuser');
fs.ensureDirSync(databanuserFolderPath);

// In-memory cache for banned user IDs per thread to eliminate disk I/O on every message
const autokickCache = new Map();

const getThreadBannedList = async (threadID) => {
    const tidStr = String(threadID);
    if (autokickCache.has(tidStr)) {
        return autokickCache.get(tidStr);
    }
    const threadFilePath = path.join(databanuserFolderPath, `${tidStr}.json`);
    let list = [];
    if (fs.existsSync(threadFilePath)) {
        try {
            list = JSON.parse(await fs.promises.readFile(threadFilePath, 'utf8'));
            if (!Array.isArray(list)) list = [];
        } catch (_) {
            list = [];
        }
    }
    const set = new Set(list.map(String));
    autokickCache.set(tidStr, set);
    return set;
};

const saveThreadBannedList = async (threadID, set) => {
    const tidStr = String(threadID);
    autokickCache.set(tidStr, set);
    const threadFilePath = path.join(databanuserFolderPath, `${tidStr}.json`);
    const arr = Array.from(set);
    await fs.promises.writeFile(threadFilePath, JSON.stringify(arr, null, 2), 'utf8');
};

module.exports.config = {
    name: "autokick",
    version: "2.1.0",
    hasPermssion: 1,
    hasPermission: 1,
    credits: "dtb",
    description: "Tự động kick người dùng theo danh sách cấm của nhóm",
    commandCategory: "Quản Lí Box",
    usages: "[add / remove / list] [UID]",
    cooldowns: 3
};

module.exports.run = async ({ event, api, args }) => {
    const { threadID, messageID, senderID } = event;
    const prefix = (global.data.threadData.get(String(threadID)) || {}).PREFIX || global.config.PREFIX;
    const botID = String(api.getCurrentUserID());
    const ADMINBOT = (global.config.ADMINBOT || []).map(String);

    if (args.length === 0) {
        return api.sendMessage(
`╔═════════════════════════╗
       HỆ THỐNG AUTOKICK
╚═════════════════════════╝
▸ ${prefix}autokick add <UID1>|<UID2>... : Thêm UID vào danh sách cấm
▸ ${prefix}autokick remove <UID1>|<UID2>... : Xóa UID khỏi danh sách cấm
▸ ${prefix}autokick list : Xem danh sách cấm của nhóm`, threadID, messageID);
    }

    const bannedSet = await getThreadBannedList(threadID);
    const action = args[0].toLowerCase();

    switch (action) {
        case "add": {
            args.shift();
            const userIDsToAdd = args.join(" ").split('|').map(id => id.trim()).filter(Boolean);
            if (userIDsToAdd.length === 0) {
                return api.sendMessage("➜ Vui lòng nhập ít nhất một UID để thêm vào danh sách cấm!", threadID, messageID);
            }

            const addedInfos = [];
            for (const userID of userIDsToAdd) {
                const uidStr = String(userID);
                if (uidStr === botID) continue; // Cannot ban bot
                if (ADMINBOT.includes(uidStr)) continue; // Cannot ban bot admin

                if (!bannedSet.has(uidStr)) {
                    bannedSet.add(uidStr);
                    let userName = "Người dùng";
                    try {
                        const userInfo = await api.getUserInfo(uidStr);
                        userName = (userInfo[uidStr] && userInfo[uidStr].name) ? userInfo[uidStr].name : userName;
                    } catch (_) {}
                    addedInfos.push(`${userName} (UID: ${uidStr})`);
                }
            }

            await saveThreadBannedList(threadID, bannedSet);
            if (addedInfos.length > 0) {
                return api.sendMessage(`➜ Đã thêm vào danh sách cấm của nhóm:\n${addedInfos.join('\n')}`, threadID);
            } else {
                return api.sendMessage("➜ Không có UID mới nào hợp lệ được thêm vào (đã tồn tại hoặc là Bot/Admin).", threadID);
            }
        }
        case "rm":
        case "remove":
        case "del": {
            args.shift();
            const userIDsToRemove = args.join(" ").split('|').map(id => id.trim()).filter(Boolean);
            if (userIDsToRemove.length === 0) {
                return api.sendMessage("➜ Vui lòng nhập UID muốn xóa khỏi danh sách cấm!", threadID, messageID);
            }

            const removed = [];
            for (const uid of userIDsToRemove) {
                const uidStr = String(uid);
                if (bannedSet.has(uidStr)) {
                    bannedSet.delete(uidStr);
                    removed.push(uidStr);
                }
            }

            await saveThreadBannedList(threadID, bannedSet);
            if (removed.length > 0) {
                return api.sendMessage(`➜ Đã xóa ${removed.length} UID khỏi danh sách cấm: ${removed.join(', ')}`, threadID);
            } else {
                return api.sendMessage("➜ Các UID trên không có trong danh sách cấm!", threadID);
            }
        }
        case "list": {
            if (bannedSet.size === 0) {
                return api.sendMessage("➜ Danh sách cấm của nhóm hiện đang trống.", threadID, messageID);
            }
            const arr = Array.from(bannedSet);
            let msg = `╔═════════════════════════╗\n   🚫 DANH SÁCH BỊ CẤM (${arr.length})\n╚═════════════════════════╝\n`;
            for (let i = 0; i < Math.min(arr.length, 30); i++) {
                let uName = "Người dùng";
                try {
                    const uInfo = await api.getUserInfo(arr[i]);
                    uName = (uInfo[arr[i]] && uInfo[arr[i]].name) ? uInfo[arr[i]].name : uName;
                } catch (_) {}
                msg += `${i + 1}. ${uName} (UID: ${arr[i]})\n`;
            }
            if (arr.length > 30) {
                msg += `\n... và ${arr.length - 30} người dùng khác.`;
            }
            return api.sendMessage(msg, threadID, messageID);
        }
        default:
            return api.sendMessage(`➜ Lệnh không hợp lệ! Dùng "${prefix}autokick" để xem hướng dẫn.`, threadID, messageID);
    }
};

module.exports.handleEvent = async ({ api, event }) => {
    const { senderID, threadID } = event;
    if (!threadID || !senderID) return;

    const botID = String(api.getCurrentUserID());
    const senderStr = String(senderID);
    if (senderStr === botID) return;

    const ADMINBOT = (global.config.ADMINBOT || []).map(String);
    if (ADMINBOT.includes(senderStr)) return;

    try {
        const bannedSet = await getThreadBannedList(threadID);
        if (bannedSet.has(senderStr)) {
            await api.removeUserFromGroup(senderStr, threadID).catch(() => {});
            api.sendMessage(`➜ [AUTOKICK] Đã tự động kick người dùng (UID: ${senderStr}) vì có tên trong danh sách đen của nhóm!`, threadID);
        }
    } catch (_) {}
};
