module.exports.config = {
    name: "duyettv",
    version: "1.1.0",
    hasPermssion: 1,
    credits: "dtb",
    description: "Duyệt thành viên trong danh sách chờ duyệt của nhóm",
    commandCategory: "Quản Lí Box",
    usages: "",
    cooldowns: 0
};

module.exports.run = async function({ api, event, Users }) {
    try {
        const { threadID, senderID } = event;
        const threadInfo = await api.getThreadInfo(threadID);
        const adminIDs = Array.isArray(threadInfo.adminIDs) ? threadInfo.adminIDs.map(e => String(e.id)) : [];

        if (!adminIDs.includes(String(api.getCurrentUserID()))) {
            return api.sendMessage("➜ Bot cần quyền Quản trị viên để thực hiện phê duyệt thành viên!", threadID, event.messageID);
        }

        const queue = Array.isArray(threadInfo.approvalQueue) ? threadInfo.approvalQueue : [];
        if (queue.length === 0) {
            return api.sendMessage("➜ Hiện không có thành viên nào trong danh sách phê duyệt của nhóm.", threadID, event.messageID);
        }

        let msg = "====『 DANH SÁCH CHỜ DUYỆT 』====\n\n";
        for (let i = 0; i < queue.length; i++) {
            let uName = "Người dùng Facebook";
            try { uName = await Users.getNameUser(queue[i].requesterID) || uName; } catch (_) {}
            msg += `[${i + 1}]. ${uName} (UID: ${queue[i].requesterID})\n\n`;
        }
        msg += "👉 Reply tin nhắn này theo số thứ tự thành viên bạn muốn duyệt (hoặc 'all' để duyệt tất cả).";

        return api.sendMessage(msg, threadID, (err, info) => {
            if (!err && global.client.handleReply) {
                global.client.handleReply.push({
                    name: this.config.name,
                    author: senderID,
                    messageID: info.messageID,
                    type: "reply",
                    queue
                });
            }
        });
    } catch (e) {
        console.error(e);
        return api.sendMessage("➜ Không thể lấy danh sách phê duyệt thành viên!", event.threadID, event.messageID);
    }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
    const { threadID, messageID, body, senderID } = event;
    if (senderID !== handleReply.author) return;

    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const queue = Array.isArray(threadInfo.approvalQueue) ? threadInfo.approvalQueue : [];

        if (queue.length === 0) {
            api.unsendMessage(handleReply.messageID);
            return api.sendMessage("➜ Danh sách chờ duyệt hiện đã trống!", threadID, messageID);
        }

        if (body.trim().toLowerCase() === "all") {
            let success = 0;
            for (let req of queue) {
                try {
                    await api.addUserToGroup(req.requesterID, threadID);
                    success++;
                } catch (_) {}
            }
            api.unsendMessage(handleReply.messageID);
            return api.sendMessage(`➜ Đã duyệt tất cả (${success}/${queue.length}) thành viên vào nhóm!`, threadID);
        }

        const idx = parseInt(body.trim()) - 1;
        if (isNaN(idx) || idx < 0 || idx >= queue.length) {
            return api.sendMessage("➜ Số thứ tự bạn nhập không hợp lệ!", threadID, messageID);
        }

        const targetID = queue[idx].requesterID;
        api.addUserToGroup(targetID, threadID, (err) => {
            if (err) return api.sendMessage("➜ Không thể duyệt thành viên này!", threadID, messageID);
            api.sendMessage("➜ Đã duyệt thành viên vào nhóm thành công!", threadID);
            api.unsendMessage(handleReply.messageID);
        });
    } catch (e) {
        console.error(e);
        return api.sendMessage("➜ Đã xảy ra lỗi khi duyệt thành viên!", threadID, messageID);
    }
};
