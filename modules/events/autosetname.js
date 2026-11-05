const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "autosetname",
    eventType: ["log:subscribe"],
    version: "2.0.0",
    credits: "dtb",
    description: "Tự động set biệt danh cho thành viên mới"
};

module.exports.run = async function({ api, event, Users }) {
    try {
        const { threadID, logMessageData } = event;
        if (!logMessageData || !Array.isArray(logMessageData.addedParticipants)) return;

        const dataPath = path.resolve(__dirname, "../commands/cache/data/autosetname.json");
        if (!fs.existsSync(dataPath)) return;

        let dataJson = [];
        try { dataJson = JSON.parse(fs.readFileSync(dataPath, "utf-8")); } catch (_) {}
        const thisThread = dataJson.find(item => String(item.threadID) === String(threadID));
        if (!thisThread || !thisThread.nameUser || thisThread.nameUser.length === 0) return;

        const prefixName = thisThread.nameUser[0];
        const botID = String(api.getCurrentUserID());

        for (const user of logMessageData.addedParticipants) {
            const uid = String(user.userFbId);
            if (uid === botID) continue;
            let realName = user.fullName || "Thành viên";
            try {
                const info = await api.getUserInfo(uid);
                if (info[uid] && info[uid].name) realName = info[uid].name;
            } catch (_) {}

            setTimeout(() => {
                api.changeNickname(`${prefixName} ${realName}`, threadID, uid);
            }, 1500);
        }
    } catch (e) {
        console.error("Lỗi autosetname event:", e);
    }
};
