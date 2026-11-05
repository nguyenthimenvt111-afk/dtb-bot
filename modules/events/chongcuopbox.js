module.exports.config = {
    name: "guard",
    eventType: ["log:thread-admins"],
    version: "1.0.1",
    credits: "dtb",
    description: "Ngăn chặn việc thay đổi admin trái phép"
};

module.exports.run = async function ({ event, api, Threads }) {
    try {
        const { logMessageType, logMessageData, threadID, author } = event;
        if (!logMessageData) return;
        const threadData = (await Threads.getData(threadID)) || {};
        const data = threadData.data || {};
        if (!data.guard) return;

        const botID = String(api.getCurrentUserID());

        if (logMessageType === "log:thread-admins") {
            if (logMessageData.ADMIN_EVENT === "add_admin") {
                if (String(author) === botID || String(logMessageData.TARGET_ID) === botID) return;
                api.changeAdminStatus(threadID, author, false, (err) => {
                    if (!err) api.sendMessage("➜ [CHỐNG CƯỚP BOX] Đã hạ quyền người tự ý thêm Quản trị viên!", threadID);
                });
                api.changeAdminStatus(threadID, logMessageData.TARGET_ID, false);
            } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
                if (String(author) === botID || String(logMessageData.TARGET_ID) === botID) return;
                api.changeAdminStatus(threadID, author, false, (err) => {
                    if (!err) api.sendMessage("➜ [CHỐNG CƯỚP BOX] Đã hạ quyền người tự ý gỡ Quản trị viên!", threadID);
                });
                api.changeAdminStatus(threadID, logMessageData.TARGET_ID, true);
            }
        }
    } catch (e) {
        console.error("Lỗi guard event:", e.message);
    }
};
