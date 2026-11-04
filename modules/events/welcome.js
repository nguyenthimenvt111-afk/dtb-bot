const moment = require("moment-timezone");

module.exports.config = {
  name: "welcomeEvent",
  eventType: ["log:subscribe"],
  version: "1.0.0",
  credits: "dtb",
  description: "Thông báo khi có người được thêm vào nhóm"
};

module.exports.run = async function ({ api, event, Threads, Users }) {
  try {
    const { threadID, logMessageData, author } = event;

    let data = global.data.threadData.get(String(threadID)) || (await Threads.getData(threadID)).data || {};

    // Nếu chưa bật welcome thì không gửi
    if (data.welcome !== true) return;

    // Danh sách người được thêm
    const addedParticipants = logMessageData.addedParticipants || [];
    if (!addedParticipants.length) return;

    // Nếu bot được thêm vào nhóm thì bỏ qua
    const botID = api.getCurrentUserID();
    const isBotAdded = addedParticipants.some(user => String(user.userFbId) === String(botID));
    if (isBotAdded) return;

    // Lấy tên người thêm
    let adderName = "Người dùng Facebook";
    try {
      adderName = global.data.userName.get(String(author)) || await Users.getNameUser(author);
    } catch (e) {}

    const threadInfo = global.data.threadInfo.get(String(threadID)) || await api.getThreadInfo(threadID);
    const threadName = threadInfo.threadName || "Nhóm chat";

    const time = moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY - HH:mm:ss");

    for (const user of addedParticipants) {
      const addedID = String(user.userFbId);
      let addedName = user.fullName || "Thành viên mới";

      try {
        addedName = global.data.userName.get(addedID) || await Users.getNameUser(addedID) || addedName;
      } catch (e) {}

      const msg =
`【 CẬP NHẬT NHÓM 】
━━━━━━━━━━━━━━━━━━
⏰ Lúc: ${time}
👤 Người thêm: ${adderName}
🔗 Link người thêm:
https://www.facebook.com/profile.php?id=${author}

👥 Người được thêm: ${addedName}
🔗 Link người được thêm:
https://www.facebook.com/profile.php?id=${addedID}

🏠 Nhóm: ${threadName}`;

      api.sendMessage(msg, threadID);
    }
  } catch (err) {
    console.log("Lỗi welcome event:", err);
  }
};