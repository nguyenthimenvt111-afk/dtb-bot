module.exports.config = {
    name: 'listbox',
    version: '2.0.0',
    credits: "dtb",
    hasPermssion: 3,
    description: 'Danh sách các nhóm bot đã tham gia',
    commandCategory: 'Hệ Thống',
    usages: '[số trang/all]',
    cooldowns: 5
};

module.exports.handleReply = async function({ api, event, Threads, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    if (String(senderID) !== String(handleReply.author)) return;

    const args = body.trim().split(/\s+/);
    const action = args[0].toLowerCase();
    const nums = args.slice(1).map(n => parseInt(n)).filter(n => !isNaN(n));

    if (nums.length === 0) return api.sendMessage("➜ Vui lòng nhập số thứ tự nhóm cần xử lý!", threadID, messageID);

    if (action === "ban") {
        let msg = "";
        for (const num of nums) {
            const tid = handleReply.groupid[num - 1];
            const gName = handleReply.groupName[num - 1];
            if (!tid) continue;

            const data = (await Threads.getData(tid)).data || {};
            data.banned = true;
            data.dateAdded = new Date().toISOString();
            await Threads.setData(tid, { data });
            global.data.threadBanned.set(tid, { dateAdded: data.dateAdded });
            msg += `+ Đã cấm: ${gName} (TID: ${tid})\n`;
        }
        api.unsendMessage(handleReply.messageID);
        return api.sendMessage(`➜ Thực thi cấm nhóm:\n${msg}`, threadID);
    }

    if (action === "unban") {
        let msg = "";
        for (const num of nums) {
            const tid = handleReply.groupid[num - 1];
            const gName = handleReply.groupName[num - 1];
            if (!tid) continue;

            const data = (await Threads.getData(tid)).data || {};
            data.banned = false;
            data.dateAdded = null;
            await Threads.setData(tid, { data });
            global.data.threadBanned.delete(tid);
            msg += `+ Đã gỡ cấm: ${gName} (TID: ${tid})\n`;
        }
        api.unsendMessage(handleReply.messageID);
        return api.sendMessage(`➜ Thực thi gỡ cấm nhóm:\n${msg}`, threadID);
    }

    if (action === "out") {
        let msg = "";
        for (const num of nums) {
            const tid = handleReply.groupid[num - 1];
            const gName = handleReply.groupName[num - 1];
            if (!tid) continue;
            api.removeUserFromGroup(api.getCurrentUserID(), tid);
            msg += `+ Đã rời nhóm: ${gName} (TID: ${tid})\n`;
        }
        api.unsendMessage(handleReply.messageID);
        return api.sendMessage(`➜ Thực thi rời nhóm:\n${msg}`, threadID);
    }
};

module.exports.run = async function({ api, event, args }) {
    try {
        const inbox = await api.getThreadList(100, null, ['INBOX']);
        const list = [...inbox].filter(group => group.isSubscribed && group.isGroup);

        let listthread = [];
        for (const groupInfo of list) {
            listthread.push({
                id: groupInfo.threadID,
                name: groupInfo.name || "Chưa đặt tên",
                participants: groupInfo.participants ? groupInfo.participants.length : 0,
                messageCount: groupInfo.messageCount || 0
            });
        }

        listthread.sort((a, b) => b.participants - a.participants);

        const page = parseInt(args[0]) || 1;
        const limit = 20;
        const numPage = Math.ceil(listthread.length / limit) || 1;
        const pagedList = listthread.slice((page - 1) * limit, page * limit);

        if (pagedList.length === 0) return api.sendMessage("➜ Trang bạn chọn không có dữ liệu!", event.threadID, event.messageID);

        let groupid = [];
        let groupName = [];
        let msg = `=====『 LIST NHÓM (${listthread.length}) 』=====\n━━━━━━━━━━━━━━━━━━\n`;

        pagedList.forEach((group, i) => {
            const stt = (page - 1) * limit + i + 1;
            msg += `${stt}. ${group.name}\n[🔰] TID: ${group.id}\n[👤] Thành viên: ${group.participants} | Tin nhắn: ${group.messageCount}\n\n`;
            groupid.push(group.id);
            groupName.push(group.name);
        });

        msg += `Trang ${page}/${numPage} (Dùng: listbox <số trang>)\n━━━━━━━━━━━━━━━━━━\n👉 Reply [out / ban / unban] + [số thứ tự] để thao tác.`;

        return api.sendMessage(msg, event.threadID, (err, info) => {
            if (!err && global.client.handleReply) {
                global.client.handleReply.push({
                    name: this.config.name,
                    author: event.senderID,
                    messageID: info.messageID,
                    groupid,
                    groupName
                });
            }
        }, event.messageID);
    } catch (e) {
        console.error(e);
        return api.sendMessage("➜ Không thể lấy danh sách nhóm!", event.threadID, event.messageID);
    }
};
