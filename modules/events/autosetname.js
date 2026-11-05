const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "autosetname",
    eventType: ["log:subscribe"],
    version: "2.1.0",
    credits: "dtb",
    description: "Tự động đặt biệt danh cho thành viên mới tham gia nhóm"
};

module.exports.run = async function({ api, event, Users }) {
    try {
        const { threadID, logMessageData } = event;
        if (!logMessageData || !Array.isArray(logMessageData.addedParticipants)) return;

        const dataPath = path.resolve(__dirname, "../commands/cache/data/autosetname.json");
        if (!fs.existsSync(dataPath)) return;

        let dataJson = [];
        try {
            dataJson = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
        } catch (_) {
            return;
        }

        const thisThread = dataJson.find(item => String(item.threadID) === String(threadID));
        if (!thisThread || !thisThread.nameUser || thisThread.nameUser.length === 0) return;

        const template = thisThread.nameUser[0];
        const botID = String(api.getCurrentUserID());

        logMessageData.addedParticipants.forEach((user, idx) => {
            const uid = String(user.userFbId);
            if (uid === botID) return;

            setTimeout(async () => {
                let realName = user.fullName || "Thành viên";
                try {
                    const info = await api.getUserInfo(uid);
                    if (info[uid] && info[uid].name) realName = info[uid].name;
                } catch (_) {}

                let newNickname = "";
                if (template.includes("{name}")) {
                    newNickname = template.replace(/\{name\}/g, realName);
                } else {
                    newNickname = `${template} ${realName}`;
                }

                // Nickname max length on FB is 32 characters
                if (newNickname.length > 32) newNickname = newNickname.substring(0, 32);

                api.changeNickname(newNickname, threadID, uid, (err) => {
                    if (err) console.error(`Lỗi đặt biệt danh cho UID ${uid}:`, err);
                });
            }, idx * 1500);
        });
    } catch (e) {
        console.error("Lỗi autosetname event:", e);
    }
};
