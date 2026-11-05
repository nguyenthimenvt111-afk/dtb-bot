const fs = require("fs-extra");
const moment = require("moment-timezone");
const leaveEvent = require("../events/leaveNoti.js");

module.exports.config = {
  name: "leave",
  version: "1.2.0",
  credits: "dtb",
  hasPermssion: 1,
  hasPermission: 1,
  description: "Bật/tắt thông báo card Canvas hoặc gửi card test mẫu khi có thành viên rời nhóm hoặc bị kick",
  commandCategory: "Nhóm",
  usages: "leave on / off / 1",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args, Threads, Users }) {
  const { threadID, messageID, senderID } = event;
  const prefix = (global.data.threadData.get(String(threadID)) || {}).PREFIX || global.config.PREFIX;

  let threadData = (await Threads.getData(threadID)) || {};
  let data = threadData.data || {};

  if (!args[0]) {
    const status = data.leaveNoti === false ? "ĐANG TẮT ❌" : "ĐANG BẬT ✅";
    return api.sendMessage(
`╔═════════════════════════╗
   📌 CẤU HÌNH THÔNG BÁO OUT
╚═════════════════════════╝
▸ Trạng thái hiện tại: ${status}
──────────────────────────
👉 Cú pháp điều khiển:
▸ ${prefix}leave on : Bật gửi Card Canvas khi có người rời nhóm/bị kick
▸ ${prefix}leave off : Tắt gửi Card Canvas khi có người rời nhóm/bị kick
▸ ${prefix}leave 1 : Gửi thử nghiệm Card Canvas out/kick mẫu`,
      threadID,
      messageID
    );
  }

  const input = args[0].toLowerCase();

  // Test mode: /leave 1 or /leave test
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
    const currentMembers = (threadInfo.participantIDs && threadInfo.participantIDs.length) || 2;
    const timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

    let cardPath = null;
    try {
      cardPath = await leaveEvent.renderLeaveCard({
        uid: String(senderID),
        name,
        threadName,
        currentMembers,
        isSelfLeave: false,
        timeString: timeNow
      });
    } catch (err) {
      console.error("[leave test] Lỗi render card:", err);
    }

    const testMsg = 
`╔═════════════════════════╗
   🚫 THÀNH VIÊN BỊ KICK [TEST]
╚═════════════════════════╝
👤 Thành viên: ${name}
🏠 Nhóm: ${threadName}
📌 Tình trạng: Đã bị Quản trị viên xóa khỏi nhóm.
📉 Thành viên còn lại: ${currentMembers}
⏰ Thời gian: ${timeNow}
──────────────────────────
(Mẫu Card Canvas out/kick thử nghiệm)`;

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
        console.error("[leave test] Lỗi gửi card test, gửi lại text:", err);
        return api.sendMessage(testMsg, threadID, messageID);
      }
    }, messageID);
  }

  if (input === "on") {
    data.leaveNoti = true;
    await Threads.setData(threadID, { data });
    global.data.threadData.set(String(threadID), data);

    return api.sendMessage("✅ Đã BẬT thông báo card Canvas khi có thành viên rời nhóm / bị kick!", threadID, messageID);
  }

  if (input === "off") {
    data.leaveNoti = false;
    await Threads.setData(threadID, { data });
    global.data.threadData.set(String(threadID), data);

    return api.sendMessage("✅ Đã TẮT thông báo card Canvas khi có thành viên rời nhóm / bị kick!", threadID, messageID);
  }

  return api.sendMessage(
`❎ Cú pháp không hợp lệ!
Dùng:
▸ ${prefix}leave on : Bật thông báo out
▸ ${prefix}leave off : Tắt thông báo out
▸ ${prefix}leave 1 : Gửi thử nghiệm Card Canvas out/kick mẫu`,
    threadID,
    messageID
  );
};
