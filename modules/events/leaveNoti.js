const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

module.exports.config = {
    name: "leavenoti",
    eventType: ["log:unsubscribe"],
    version: "2.0.0",
    credits: "dtb",
    description: "Thông báo thành viên rời nhóm và hỗ trợ chống tự ý out (antiout)"
};

module.exports.run = async function ({ api, event, Users, Threads }) {
    try {
        if (!event.logMessageData || !event.logMessageData.leftParticipantFbId) return;
        const leftID = String(event.logMessageData.leftParticipantFbId);
        const botID = String(api.getCurrentUserID());
        if (leftID === botID) return;

        const { threadID, author } = event;
        const threadData = (await Threads.getData(threadID)) || {};
        const data = threadData.data || {};

        let name = "Người dùng Facebook";
        try { name = await Users.getNameUser(leftID) || name; } catch (_) {}

        const dayOfWeek = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
        const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss - DD/MM/YYYY");
        const thu = dayOfWeek[moment.tz('Asia/Ho_Chi_Minh').day()];

        const isSelfLeave = String(author) === leftID;
        const type = isSelfLeave ? "Đã tự rời khỏi nhóm." : "Đã bị Quản trị viên xóa khỏi nhóm.";

        // Antiout integration
        if (data.antiout === true && isSelfLeave) {
            api.addUserToGroup(leftID, threadID, (err) => {
                if (!err) {
                    api.sendMessage(`[ ANTIOUT ] Đã tự động thêm lại ${name} vào nhóm!`, threadID);
                }
            });
        }

        let msg = data.customLeave || 
`[ Thành Viên Thoát Nhóm ]
─────────────────
👤 Thành viên: {name}
📌 Lý do: {type}
📆 Thoát nhóm vào: {thu}
⏰ Thời gian: {time}`;

        msg = msg.replace(/\{name}/g, name)
                 .replace(/\{type}/g, type)
                 .replace(/\{time}/g, time)
                 .replace(/\{uid}/g, leftID)
                 .replace(/\{thu}/g, thu);

        try {
            await api.shareContact(msg, leftID, threadID);
        } catch (_) {
            api.sendMessage(msg, threadID);
        }
    } catch (e) {
        console.error("Lỗi leaveNoti:", e.message);
    }
};
