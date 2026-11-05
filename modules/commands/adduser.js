module.exports.config = {
    name: "adduser",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Thêm người dùng vào nhóm bằng link hoặc UID",
    commandCategory: "Quản Lí Box",
    usages: "[link Facebook / UID]",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const input = (args[0] || (event.messageReply ? event.messageReply.body : "")).trim();

    if (!input) {
        return api.sendMessage(
`====『 ADDUSER 』====
➜ ${global.config.PREFIX}adduser [UID]
➜ ${global.config.PREFIX}adduser [Link trang cá nhân Facebook]`, threadID, messageID);
    }

    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const participants = threadInfo.participantIDs || [];
        const adminIDs = Array.isArray(threadInfo.adminIDs) ? threadInfo.adminIDs.map(a => String(a.id)) : [];
        const isBotAdmin = adminIDs.includes(String(api.getCurrentUserID()));

        let uidUser = input;
        if (input.includes("facebook.com") || input.includes("fb.me")) {
            try {
                uidUser = await api.getUID(input);
            } catch (_) {
                return api.sendMessage("➜ Không thể tìm thấy UID từ liên kết Facebook này!", threadID, messageID);
            }
        }

        if (participants.includes(String(uidUser))) {
            return api.sendMessage("➜ Thành viên này đã có mặt trong nhóm!", threadID, messageID);
        }

        api.addUserToGroup(uidUser, threadID, (err) => {
            if (err) return api.sendMessage("➜ Không thể thêm thành viên vào nhóm!", threadID, messageID);
            if (threadInfo.approvalMode && !isBotAdmin) {
                return api.sendMessage("➜ Đã thêm người dùng vào danh sách phê duyệt của nhóm!", threadID, messageID);
            }
            return api.sendMessage("➜ Thêm thành viên vào nhóm thành công!", threadID, messageID);
        });
    } catch (e) {
        console.error("Lỗi adduser:", e);
        return api.sendMessage("➜ Có lỗi xảy ra khi thêm thành viên!", threadID, messageID);
    }
};
