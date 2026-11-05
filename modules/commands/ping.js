module.exports.config = {
    name: "ping",
    version: "2.0.0",
    hasPermssion: 1,
    credits: "dtb",
    description: "Tag toàn bộ thành viên trong nhóm",
    commandCategory: "Quản Lí Box",
    usages: "[nội dung tag]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    try {
        const botID = String(api.getCurrentUserID());
        const threadInfo = await api.getThreadInfo(event.threadID);
        const participants = threadInfo.participantIDs || [];
        const listUserID = participants.filter(id => String(id) !== botID && String(id) !== String(event.senderID));

        if (listUserID.length === 0) {
            return api.sendMessage("➜ Nhóm không có thành viên nào khác để tag!", event.threadID, event.messageID);
        }

        let bodyText = args.length > 0 ? args.join(" ") : "Mọi người ơi dậy tương tác nào!";
        let mentions = [];
        let body = "";
        let index = 0;

        for (const idUser of listUserID) {
            body += "‎";
            mentions.push({ id: idUser, tag: "‎", fromIndex: index });
            index++;
        }
        body += " " + bodyText;

        return api.sendMessage({ body, mentions }, event.threadID, event.messageID);
    } catch (e) {
        console.error("Lỗi ping:", e);
        return api.sendMessage("➜ Có lỗi khi tag mọi người!", event.threadID, event.messageID);
    }
};
