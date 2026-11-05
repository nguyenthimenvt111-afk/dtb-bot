module.exports.config = {
    name: "setdatabox",
    version: "2.0.0",
    hasPermssion: 3,
    credits: "dtb",
    description: "Cập nhật dữ liệu các nhóm vào cơ sở dữ liệu bot",
    commandCategory: "Hệ Thống",
    usages: "",
    cooldowns: 5
};

module.exports.run = async function ({ event, api, Threads }) { 
    const { threadID } = event;
    try {
        const inbox = await api.getThreadList(100, null, ['INBOX']);
        const list = [...inbox].filter(group => group.isSubscribed && group.isGroup);
        let success = 0;

        for (const groupInfo of list) {
            try {
                const threadInfo = await api.getThreadInfo(groupInfo.threadID);
                await Threads.setData(groupInfo.threadID, { threadInfo });
                success++;
            } catch (_) {}
        }

        return api.sendMessage(`➜ Đã cập nhật dữ liệu của ${success}/${list.length} nhóm thành công!`, threadID);
    } catch (e) {
        return api.sendMessage("➜ Không thể cập nhật dữ liệu nhóm!", threadID);
    }
};
