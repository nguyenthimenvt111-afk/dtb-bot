module.exports.config = {
    name: "antibd",
    eventType: ["log:user-nickname"],
    version: "1.0.0",
    credits: "dtb",
    description: "Chống đổi biệt danh của Bot"
};

module.exports.run = async function({ api, event, Users, Threads }) {
    try {
        const { logMessageData, threadID, author } = event;
        if (!logMessageData) return;
        const botID = String(api.getCurrentUserID());
        const ADMINBOT = (global.config.ADMINBOT || []).map(String);
        const expectedNickname = `『 ${global.config.PREFIX} 』 ⪼ ${global.config.BOTNAME || "dtb"}`;

        if (String(logMessageData.participant_id) === botID && String(author) !== botID && !ADMINBOT.includes(String(author))) {
            if (logMessageData.nickname !== expectedNickname) {
                api.changeNickname(expectedNickname, threadID, botID);
                let info = "Người dùng";
                try { info = (await Users.getData(author)).name || info; } catch (_) {}
                return api.sendMessage(`➜ ${info}: Bạn không có quyền đổi biệt danh của Bot!`, threadID);
            }
        }
    } catch (e) {
        console.error("Lỗi antibd event:", e.message);
    }
};
