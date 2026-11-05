module.exports.config = {
    name: "guard",
    eventType: ["log:thread-admins"],
    version: "1.1.0",
    credits: "dtb",
    description: "Ngăn chặn việc thay đổi quản trị viên trái phép trong nhóm"
};

module.exports.run = async function ({ event, api, Threads }) {
    try {
        const { logMessageType, logMessageData, threadID, author } = event;
        if (!logMessageData) return;
        const threadData = (await Threads.getData(threadID)) || {};
        const data = threadData.data || {};
        if (!data.guard) return;

        const botID = String(api.getCurrentUserID());
        const ADMINBOT = (global.config.ADMINBOT || []).map(String);

        // Exempt Bot itself and Bot Admins from being demoted or restricted
        if (String(author) === botID || ADMINBOT.includes(String(author))) return;

        if (logMessageType === "log:thread-admins") {
            const targetID = String(logMessageData.TARGET_ID);

            if (logMessageData.ADMIN_EVENT === "add_admin") {
                if (targetID === botID || ADMINBOT.includes(targetID)) return;
                api.changeAdminStatus(threadID, author, false, (err) => {
                    if (!err) api.sendMessage("➜ [CHỐNG CƯỚP BOX] Đã hạ quyền người tự ý thêm Quản trị viên!", threadID);
                });
                api.changeAdminStatus(threadID, targetID, false);
            } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
                if (targetID === botID) {
                    // Someone attempted to demote the bot!
                    api.changeAdminStatus(threadID, author, false);
                    api.changeAdminStatus(threadID, botID, true);
                    return api.sendMessage("➜ [CHỐNG CƯỚP BOX] Phát hiện hành vi tự ý hạ quyền Bot! Đã tước quyền QTV của thủ phạm.", threadID);
                }
                api.changeAdminStatus(threadID, author, false, (err) => {
                    if (!err) api.sendMessage("➜ [CHỐNG CƯỚP BOX] Đã hạ quyền người tự ý gỡ Quản trị viên!", threadID);
                });
                api.changeAdminStatus(threadID, targetID, true);
            }
        }
    } catch (e) {
        console.error("Lỗi guard event:", e.message);
    }
};
