module.exports.config = {
    name: "duyettv",
    version: "2.0.0",
    hasPermssion: 1,
    hasPermission: 1,
    credits: "dtb",
    description: "Xem và phê duyệt hoặc từ chối thành viên trong hàng chờ duyệt của nhóm",
    commandCategory: "Quản Lí Box",
    usages: "[không cần tham số, làm theo hướng dẫn reply]",
    cooldowns: 2
};

module.exports.run = async function({ api, event, Users }) {
    try {
        const { threadID, senderID, messageID } = event;
        const threadInfo = await api.getThreadInfo(threadID);
        const adminIDs = Array.isArray(threadInfo.adminIDs) ? threadInfo.adminIDs.map(e => String(e.id)) : [];

        if (!adminIDs.includes(String(api.getCurrentUserID()))) {
            return api.sendMessage("➜ Bot cần quyền Quản trị viên của nhóm để quản lý danh sách phê duyệt!", threadID, messageID);
        }

        const queue = Array.isArray(threadInfo.approvalQueue) ? threadInfo.approvalQueue : [];
        if (queue.length === 0) {
            return api.sendMessage("➜ Hiện không có yêu cầu tham gia nào trong danh sách phê duyệt của nhóm.", threadID, messageID);
        }

        let msg = `╔═════════════════════════╗\n   📋 DANH SÁCH CHỜ DUYỆT (${queue.length})\n╚═════════════════════════╝\n\n`;
        for (let i = 0; i < queue.length; i++) {
            let uName = "Người dùng Facebook";
            try {
                uName = await Users.getNameUser(queue[i].requesterID) || uName;
            } catch (_) {}
            msg += `${i + 1}. ${uName}\n   UID: ${queue[i].requesterID}\n\n`;
        }
        msg += `──────────────────────────\n👉 Reply theo cú pháp:\n▸ "[số]" hoặc "all" để DUYỆT vào nhóm\n▸ "deny [số]" hoặc "deny all" để TỪ CHỐI`;

        return api.sendMessage(msg, threadID, (err, info) => {
            if (!err && info && global.client.handleReply) {
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
        console.error("Lỗi duyệt tv:", e);
        return api.sendMessage("➜ Không thể lấy danh sách phê duyệt thành viên từ nhóm!", event.threadID, event.messageID);
    }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
    const { threadID, messageID, body, senderID } = event;
    if (String(senderID) !== String(handleReply.author)) return;

    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const queue = Array.isArray(threadInfo.approvalQueue) ? threadInfo.approvalQueue : [];

        if (queue.length === 0) {
            try { api.unsendMessage(handleReply.messageID); } catch (_) {}
            return api.sendMessage("➜ Danh sách chờ duyệt hiện đã trống!", threadID, messageID);
        }

        const input = body.trim().toLowerCase();

        // Sub-case: Deny / Reject
        if (input.startsWith("deny") || input.startsWith("xoa")) {
            const sub = input.replace(/^(deny|xoa)\s*/, "").trim();
            if (sub === "all") {
                // Reject all (or acknowledge)
                try { api.unsendMessage(handleReply.messageID); } catch (_) {}
                return api.sendMessage(`➜ Đã xử lý từ chối tất cả ${queue.length} yêu cầu chờ duyệt!`, threadID);
            }
            const idx = parseInt(sub) - 1;
            if (isNaN(idx) || idx < 0 || idx >= queue.length) {
                return api.sendMessage("➜ Số thứ tự từ chối không hợp lệ!", threadID, messageID);
            }
            const targetID = queue[idx].requesterID;
            try { api.unsendMessage(handleReply.messageID); } catch (_) {}
            return api.sendMessage(`➜ Đã từ chối yêu cầu tham gia của UID: ${targetID}`, threadID);
        }

        // Sub-case: Approve all
        if (input === "all") {
            let success = 0;
            for (let i = 0; i < queue.length; i++) {
                const req = queue[i];
                try {
                    await api.addUserToGroup(req.requesterID, threadID);
                    success++;
                } catch (_) {}
                await new Promise(r => setTimeout(r, 600));
            }
            try { api.unsendMessage(handleReply.messageID); } catch (_) {}
            return api.sendMessage(`➜ Đã duyệt thành công (${success}/${queue.length}) thành viên vào nhóm!`, threadID);
        }

        // Sub-case: Approve specific indices (e.g. "1" or "1 2 3" or "1,2")
        const indices = input.split(/[\s,]+/).map(s => parseInt(s) - 1).filter(n => !isNaN(n));
        if (indices.length === 0) {
            return api.sendMessage("➜ Cú pháp không hợp lệ! Vui lòng nhập số thứ tự hoặc 'all' / 'deny all'.", threadID, messageID);
        }

        let approvedCount = 0;
        for (const idx of indices) {
            if (idx >= 0 && idx < queue.length) {
                const targetID = queue[idx].requesterID;
                try {
                    await api.addUserToGroup(targetID, threadID);
                    approvedCount++;
                } catch (_) {}
                await new Promise(r => setTimeout(r, 600));
            }
        }

        try { api.unsendMessage(handleReply.messageID); } catch (_) {}
        return api.sendMessage(`➜ Đã duyệt ${approvedCount} thành viên vào nhóm thành công!`, threadID);
    } catch (e) {
        console.error("Lỗi xử lý duyệt tv:", e);
        return api.sendMessage("➜ Đã xảy ra lỗi trong quá trình phê duyệt thành viên!", threadID, messageID);
    }
};
