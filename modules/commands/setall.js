module.exports.config = {
    name: "setall",
    version: "1.1.0",
    hasPermssion: 1,
    credits: "dtb",
    description: "Đặt biệt danh cho tất cả thành viên trong nhóm",
    commandCategory: "Quản Lí Box",
    usages: "[biệt danh mới]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    try {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const idtv = threadInfo.participantIDs || [];
        const name = args.join(" ");

        api.sendMessage(`➜ Đang tiến hành đặt biệt danh cho ${idtv.length} thành viên...`, event.threadID, event.messageID);
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        for (let setname of idtv) {
            await delay(1200);
            api.changeNickname(name, event.threadID, setname);
        }

        return api.sendMessage("➜ Đã hoàn tất đặt biệt danh cho tất cả thành viên trong nhóm!", event.threadID);
    } catch (e) {
        console.error("Lỗi setall:", e);
        return api.sendMessage("➜ Đã xảy ra lỗi khi đặt biệt danh đồng loạt!", event.threadID, event.messageID);
    }
};
