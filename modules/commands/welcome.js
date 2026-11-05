const fs = require("fs-extra");
const moment = require("moment-timezone");
const welcomeEvent = require("../events/welcome.js");

module.exports.config = {
  name: "welcome",
  version: "1.2.0",
  credits: "dtb",
  hasPermssion: 1,
  hasPermission: 1,
  description: "Bật/tắt thông báo card Canvas hoặc gửi card test mẫu khi có thành viên mới tham gia nhóm",
  commandCategory: "Nhóm",
  usages: "welcome on / off / 1",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args, Threads, Users }) {
  const { threadID, messageID, senderID } = event;
  const prefix = (global.data.threadData.get(String(threadID)) || {}).PREFIX || global.config.PREFIX;

  let threadData = (await Threads.getData(threadID)) || {};
  let data = threadData.data || {};

  if (!args[0]) {
    const status = data.welcome === false ? "ĐANG TẮT ❌" : "ĐANG BẬT ✅";
    return api.sendMessage(
`╔═════════════════════════╗
   📌 CẤU HÌNH THÔNG BÁO WELCOME
╚═════════════════════════╝
▸ Trạng thái hiện tại: ${status}
──────────────────────────
👉 Cú pháp điều khiển:
▸ ${prefix}welcome on : Bật gửi Card Canvas chào mừng thành viên mới
▸ ${prefix}welcome off : Tắt gửi Card Canvas chào mừng thành viên mới
▸ ${prefix}welcome 1 : Gửi thử nghiệm Card Canvas chào mừng mẫu`,
      threadID,
      messageID
    );
  }

  const input = args[0].toLowerCase();

  // Test mode: /welcome 1 or /welcome test
  if (input === "1" || input === "test") {
    let name = "Báo Dương";
    try {
      name = (global.data.userName && global.data.userName.get(String(senderID))) || await Users.getNameUser(senderID) || name;
    } catch (_) {}

    let threadInfo = (global.data.threadInfo && global.data.threadInfo.get(String(threadID))) || {};
    try {
      const fresh = await Promise.race([
        api.getThreadInfo(threadID),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500))
      ]);
      if (fresh && fresh.threadName) threadInfo = fresh;
    } catch (_) {}

    const threadName = threadInfo.threadName || "gay";
    const totalMembers = Array.isArray(threadInfo.participantIDs) ? threadInfo.participantIDs.length : 3;
    const timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

    let cardPath = null;
    try {
      cardPath = await welcomeEvent.renderWelcomeCard({
        uid: String(senderID),
        name,
        threadName,
        memberIndex: totalMembers,
        timeString: timeNow
      });
    } catch (err) {
      console.error("[welcome test] Lỗi render card:", err);
    }

    const testMsg = 
`╔═════════════════════════╗
   🎉 CHÀO MỪNG THÀNH VIÊN MỚI [TEST]
╚═════════════════════════╝
👤 Thành viên: ${name}
🏠 Nhóm: ${threadName}
👥 Vị trí: Thành viên thứ #${totalMembers}
⏰ Thời gian: ${timeNow}
Người thêm: Quản trị viên
──────────────────────────
Chúc bạn có những giây phút vui vẻ và ý nghĩa tại nhóm!
(Mẫu Card Canvas chào mừng thử nghiệm)`;

    const payload = { body: testMsg };
    if (cardPath && fs.existsSync(cardPath)) {
      try {
        payload.attachment = fs.createReadStream(cardPath);
      } catch (_) {}
    }

    return api.sendMessage(payload, threadID, (err) => {
      setTimeout(() => {
        try { if (cardPath && fs.existsSync(cardPath)) fs.unlinkSync(cardPath); } catch (_) {}
      }, 15000);
      if (err) {
        console.error("[welcome test] Lỗi gửi card test, gửi lại text:", err);
        return api.sendMessage(testMsg, threadID, messageID);
      }
    }, messageID);
  }

  if (input === "on") {
    data.welcome = true;
    await Threads.setData(threadID, { data });
    global.data.threadData.set(String(threadID), data);

    return api.sendMessage("✅ Đã BẬT thông báo card Canvas chào mừng thành viên mới!", threadID, messageID);
  }

  if (input === "off") {
    data.welcome = false;
    await Threads.setData(threadID, { data });
    global.data.threadData.set(String(threadID), data);

    return api.sendMessage("✅ Đã TẮT thông báo card Canvas chào mừng thành viên mới!", threadID, messageID);
  }

  return api.sendMessage(
`❎ Cú pháp không hợp lệ!
Dùng:
▸ ${prefix}welcome on : Bật thông báo welcome
▸ ${prefix}welcome off : Tắt thông báo welcome
▸ ${prefix}welcome 1 : Gửi thử nghiệm Card Canvas chào mừng mẫu`,
    threadID,
    messageID
  );
};
