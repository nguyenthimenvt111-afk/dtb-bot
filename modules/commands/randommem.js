module.exports.config = {
    name: "randommem",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Chọn ngẫu nhiên thành viên may mắn trong nhóm",
    commandCategory: "Nhóm",
    usages: "[số lượng]",
    cooldowns: 0
};

module.exports.run = async ({ api, event, args, Users }) => {
    try {
        const { threadID, messageID, isGroup } = event;
        if (isGroup === false) return api.sendMessage("➜ Lệnh này chỉ dùng được trong nhóm!", threadID, messageID);

        const threadInfo = await api.getThreadInfo(threadID);
        const participants = threadInfo.participantIDs || [];
        if (participants.length === 0) return api.sendMessage("➜ Không tìm thấy thành viên trong nhóm!", threadID, messageID);

        let num = parseInt(args[0]) || 1;
        if (num > participants.length) num = participants.length;
        if (num < 1) num = 1;

        let shuffled = [...participants].sort(() => 0.5 - Math.random());
        let picked = shuffled.slice(0, num);

        let members = [];
        for (let uid of picked) {
            let name = "Người dùng Facebook";
            try { name = await Users.getNameUser(uid) || name; } catch (_) {}
            members.push(name);
        }

        return api.sendMessage(`🎉 Thành viên may mắn được chọn là:\n${members.map((m, i) => `${i + 1}. ${m}`).join("\n")}`, threadID, messageID);
    } catch (e) {
        console.error(e);
        return api.sendMessage("➜ Đã xảy ra lỗi khi chọn thành viên ngẫu nhiên!", event.threadID, event.messageID);
    }
};
