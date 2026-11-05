const moment = require("moment-timezone");

module.exports.config = {
  name: "restart",
  version: "2.1.0",
  hasPermssion: 3,
  credits: "dtb",
  description: "Khởi động lại hệ thống bot",
  commandCategory: "Hệ Thống",
  usages: "restart [số giây đếm ngược]",
  cooldowns: 5
};

module.exports.run = async function({ api, args, Users, event }) {
  const { threadID, messageID, senderID } = event;
  const adminBot = (global.config.ADMINBOT || []).map(String);

  if (!adminBot.includes(String(senderID))) {
    return api.sendMessage("➜ Chỉ Admin Bot mới có quyền thực hiện khởi động lại hệ thống!", threadID, messageID);
  }

  let name = "Admin";
  try { name = await Users.getNameUser(senderID) || name; } catch (_) {}

  const timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

  if (args.length === 0) {
    return api.sendMessage(`➜ Đã nhận lệnh khởi động lại bot từ Admin ${name} (${timeNow}).\n➜ Tiến hành khởi động lại ngay...`, threadID, () => {
      process.exit(1);
    });
  }

  const delaySeconds = parseInt(args[0], 10);
  if (isNaN(delaySeconds) || delaySeconds <= 0) {
    return api.sendMessage("➜ Số giây đếm ngược không hợp lệ! Vui lòng nhập số giây (ví dụ: restart 5).", threadID, messageID);
  }

  api.sendMessage(`➜ Bot sẽ khởi động lại sau ${delaySeconds} giây...\n[⏰] Thời gian nhận lệnh: ${timeNow}`, threadID, messageID);

  setTimeout(() => {
    api.sendMessage("➜ Đang tiến hành khởi động lại bot...", threadID, () => {
      process.exit(1);
    });
  }, delaySeconds * 1000);
};
