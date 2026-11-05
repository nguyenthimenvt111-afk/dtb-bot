module.exports.config = {
    name: "out",
    version: "1.1.0",
    hasPermssion: 2,
    credits: "dtb",
    description: "Bot rời khỏi nhóm",
    commandCategory: "Hệ Thống",
    usages: "[tid]",
    cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
    const id = args.join(" ").trim() || event.threadID;
    return api.sendMessage('➜ Đã nhận lệnh rời nhóm từ Admin!', id, () => {
        api.removeUserFromGroup(api.getCurrentUserID(), id);
    });
};
