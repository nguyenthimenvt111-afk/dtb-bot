const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "timejoin",
    eventType: ["log:unsubscribe"],
    version: "1.0.1",
    credits: "dtb",
    description: "Tự xóa data timejoin khi user rời nhóm"
};

module.exports.run = async function ({ event }) {
    try {
        const { threadID, logMessageData } = event;
        if (!logMessageData || !logMessageData.leftParticipantFbId) return;
        const filePath = path.join(__dirname, "../commands/cache/timejoin", `${threadID}.json`);
        if (!fs.existsSync(filePath)) return;

        let data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (Array.isArray(data)) {
            data = data.filter(item => String(item.senderID) !== String(logMessageData.leftParticipantFbId));
            fs.writeFileSync(filePath, JSON.stringify(data, null, 4), "utf-8");
        }
    } catch (_) {}
};
