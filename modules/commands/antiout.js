module.exports.config = {
    name: "antiout",
    version: "1.1.0",
    credits: "dtb",
    hasPermssion: 1,
    hasPermission: 1,
    description: "Bật/tắt chế độ tự động thêm lại khi có thành viên tự ý rời nhóm",
    usages: "antiout",
    commandCategory: "Nhóm",
    cooldowns: 3
};

module.exports.run = async({ api, event, Threads }) => {
    const { threadID, messageID } = event;
    const tidStr = String(threadID);

    let threadData = (await Threads.getData(tidStr)) || {};
    let data = threadData.data || {};

    if (typeof data["antiout"] === "undefined" || data["antiout"] === false) {
        data["antiout"] = true;
    } else {
        data["antiout"] = false;
    }

    await Threads.setData(tidStr, { data });
    global.data.threadData.set(tidStr, data);

    const statusText = data["antiout"] ? "BẬT ✅ (Sẽ tự động thêm lại khi thành viên tự rời nhóm)" : "TẮT ❌";
    return api.sendMessage(`➜ Đã ${statusText} chế độ Antiout cho nhóm!`, threadID, messageID);
};
