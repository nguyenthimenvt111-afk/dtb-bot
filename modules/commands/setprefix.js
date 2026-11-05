module.exports.config = {
    name: "setprefix",
    version: "2.1.0",
    hasPermssion: 1,
    credits: "dtb",
    description: "Đặt lại prefix của nhóm",
    commandCategory: "Quản Lí Box",
    usages: "[prefix/reset]",
    cooldowns: 5
};

module.exports.handleReaction = async function({ api, event, Threads, handleReaction }) {
    try {
        if (event.userID != handleReaction.author) return;
        const { threadID, messageID } = event;
        let data = (await Threads.getData(String(threadID))).data || {};
        data["PREFIX"] = handleReaction.PREFIX;
        await Threads.setData(threadID, { data });
        global.data.threadData.set(String(threadID), data);
        api.unsendMessage(handleReaction.messageID);

        api.changeNickname(`『 ${handleReaction.PREFIX} 』 ⪼ ${global.config.BOTNAME || "dtb"}`, threadID, api.getCurrentUserID());

        return api.sendMessage(`➜ Cập nhật prefix thành công: ${handleReaction.PREFIX}`, threadID);
    } catch (e) {
        console.error(e);
    }
};

module.exports.run = async ({ api, event, args, Threads }) => {
    if (!args[0]) return api.sendMessage("➜ Bạn cần nhập dấu lệnh muốn đổi!", event.threadID, event.messageID);

    let prefix = args[0].trim();
    if (!prefix) return api.sendMessage("➜ Bạn cần nhập dấu lệnh muốn đổi!", event.threadID, event.messageID);

    if (prefix === "reset") {
        let data = (await Threads.getData(event.threadID)).data || {};
        data["PREFIX"] = global.config.PREFIX;
        await Threads.setData(event.threadID, { data });
        global.data.threadData.set(String(event.threadID), data);
        api.changeNickname(`『 ${global.config.PREFIX} 』 ⪼ ${global.config.BOTNAME || "dtb"}`, event.threadID, api.getCurrentUserID());
        return api.sendMessage(`➜ Đã đặt lại prefix về mặc định: ${global.config.PREFIX}`, event.threadID, event.messageID);
    }

    return api.sendMessage(`➜ Thả cảm xúc vào tin nhắn này nếu bạn chắc chắn muốn đổi prefix nhóm thành: ${prefix}`, event.threadID, (error, info) => {
        if (!error && global.client.handleReaction) {
            global.client.handleReaction.push({
                name: this.config.name,
                messageID: info.messageID,
                author: event.senderID,
                PREFIX: prefix
            });
        }
    }, event.messageID);
};
