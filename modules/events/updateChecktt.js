const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "updateChecktt",
    eventType: ["log:unsubscribe"],
    version: "1.1.0",
    credits: "dtb",
    description: "Xóa dữ liệu tương tác khi thành viên rời nhóm"
};

module.exports.run = async ({ event, api }) => { 
    try {
        if (!event.logMessageData || !event.logMessageData.leftParticipantFbId) return;
        if (String(event.logMessageData.leftParticipantFbId) === String(api.getCurrentUserID())) return;

        const leftID = String(event.logMessageData.leftParticipantFbId);
        const filePath = path.resolve(__dirname, '../commands/tuongtac/checktt', `${event.threadID}.json`);
        if (!fs.existsSync(filePath)) return;

        const threadData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        ['total', 'week', 'day'].forEach(key => {
            if (Array.isArray(threadData[key])) {
                const idx = threadData[key].findIndex(item => String(item.id) === leftID);
                if (idx !== -1) threadData[key].splice(idx, 1);
            }
        });

        fs.writeFileSync(filePath, JSON.stringify(threadData, null, 2), 'utf-8');
    } catch (e) {
        console.error("Lỗi updateChecktt:", e.message);
    }
};
