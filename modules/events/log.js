module.exports.config = {
    name: "log",
    eventType: ["log:unsubscribe", "log:subscribe", "log:thread-name"],
    version: "1.1.0",
    credits: "dtb",
    description: "Ghi lại thông báo các hoạt động quan trọng của bot tới Admin Bot",
    envConfig: {
        enable: true
    }
};

module.exports.run = async function ({ api, event, Users, Threads }) {
    const logger = require("../../utils/log");
    try {
        if (global.configModule && global.configModule[this.config.name] && global.configModule[this.config.name].enable === false) {
            return;
        }

        const botID = String(api.getCurrentUserID());
        const moment = require("moment-timezone");
        const time = moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss");

        let nameThread = "Nhóm chat";
        try {
            const threadInfo = await api.getThreadInfo(event.threadID);
            nameThread = threadInfo.threadName || nameThread;
        } catch (_) {
            const cached = global.data.threadInfo ? global.data.threadInfo.get(String(event.threadID)) : null;
            if (cached && cached.threadName) nameThread = cached.threadName;
        }

        let nameUser = "Người dùng Facebook";
        try {
            nameUser = (global.data.userName && global.data.userName.get(String(event.author))) || await Users.getNameUser(event.author) || nameUser;
        } catch (_) {}

        let task = "";
        switch (event.logMessageType) {
            case "log:thread-name": {
                const newName = (event.logMessageData && event.logMessageData.name) || "Tên không tồn tại";
                task = `Người dùng đổi tên nhóm thành: "${newName}"`;
                try { await Threads.setData(event.threadID, { name: newName }); } catch (_) {}
                break;
            }
            case "log:subscribe": {
                if (event.logMessageData && Array.isArray(event.logMessageData.addedParticipants)) {
                    if (event.logMessageData.addedParticipants.some(i => String(i.userFbId) === botID)) {
                        task = "Người dùng đã thêm bot vào một nhóm mới";
                    }
                }
                break;
            }
            case "log:unsubscribe": {
                if (event.logMessageData && String(event.logMessageData.leftParticipantFbId) === botID) {
                    if (String(event.senderID) === botID) return;
                    try {
                        const threadData = (await Threads.getData(event.threadID)) || {};
                        const data = threadData.data || {};
                        data.banned = true;
                        data.reason = "Kick bot tự do, không xin phép";
                        data.dateAdded = time;
                        await Threads.setData(event.threadID, { data });
                        if (global.data.threadBanned) {
                            global.data.threadBanned.set(String(event.threadID), { reason: data.reason, dateAdded: data.dateAdded });
                        }
                    } catch (_) {}
                    task = "Người dùng đã kick bot ra khỏi nhóm";
                }
                break;
            }
            default:
                break;
        }

        if (task.length === 0) return;

        const formReport = 
`╔═════════════════════════╗
   📋 THÔNG BÁO HOẠT ĐỘNG
╚═════════════════════════╝
🏠 Nhóm: ${nameThread}
🆔 Thread ID: ${event.threadID}
⚙️ Hành động: ${task}
👤 Người thực hiện: ${nameUser} (UID: ${event.author})
⏰ Thời gian: ${time}`;

        const adminTarget = (global.config.ADMINBOT && global.config.ADMINBOT[0]) ? String(global.config.ADMINBOT[0]) : null;
        if (adminTarget) {
            return api.sendMessage(formReport, adminTarget, (error) => {
                if (error) logger(formReport, "Logging Event");
            });
        }
    } catch (err) {
        console.error("Lỗi log event:", err.message);
    }
};
