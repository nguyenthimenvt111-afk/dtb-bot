module.exports.config = {
    name: "chongcuopbox",
    version: "3.1.0",
    credits: "dtb",
    hasPermssion: 1,
    description: "Ngăn chặn việc thay đổi admin trái phép",
    usages: "chongcuopbox",
    commandCategory: "Quản Lí Box",
    cooldowns: 0
};

module.exports.run = async({ api, event, Threads, Users }) => {
    const moment = require("moment-timezone");
    const gio = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || DD/MM/YYYY");
    const dayOfWeek = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const thu = dayOfWeek[moment.tz('Asia/Ho_Chi_Minh').day()];

    let name = await Users.getNameUser(event.senderID);
    const info = await api.getThreadInfo(event.threadID);
    const adminIDs = Array.isArray(info.adminIDs) ? info.adminIDs : [];

    if (!adminIDs.some(item => String(item.id) === String(api.getCurrentUserID()))) {
        return api.sendMessage(
`==== 『 𝐄𝐑𝐑𝐎𝐑 』 ==== 
▱▱▱▱▱▱▱▱▱▱▱▱▱
➜ Muốn bot thực hiện lệnh này, vui lòng thêm bot làm Quản trị viên nhóm!
▱▱▱▱▱▱▱▱▱▱▱▱▱
=== 「${thu} || ${gio}」 ===`, event.threadID, event.messageID);
    }

    const threadData = (await Threads.getData(event.threadID)) || {};
    const data = threadData.data || {};

    data.guard = !data.guard;
    await Threads.setData(event.threadID, { data });
    global.data.threadData.set(String(event.threadID), data);

    return api.sendMessage(
`=== 『 𝐒𝐮𝐜𝐜𝐞𝐬𝐬 』 ===
▱▱▱▱▱▱▱▱▱▱▱▱▱
➜ Nhận lệnh ${data.guard ? "BẬT" : "TẮT"} chống cướp box từ ${name} thành công!
▱▱▱▱▱▱▱▱▱▱▱▱▱
=== 「${thu} || ${gio}」 ===`, event.threadID, event.messageID);
};
