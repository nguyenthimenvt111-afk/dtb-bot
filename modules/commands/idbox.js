module.exports.config = {
    name: "idbox",
    version: "1.0.1",
    hasPermssion: 0,
    credits: "dtb",
    description: "Lấy ID nhóm chat hiện tại",
    commandCategory: "Nhóm",
    usages: "",
    cooldowns: 3
};

module.exports.run = async({ api, event }) => {
    return api.sendMessage(`➜ ID nhóm chat: ${event.threadID}`, event.threadID, event.messageID);
};
