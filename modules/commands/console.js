module.exports.config = {
  name: "console",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "dtb",
  description: "Hiển thị thông tin tin nhắn chi tiết trên console (tên, ID, nội dung, nhóm/inbox)",
  commandCategory: "Hệ Thống",
  usages: "console",
  cooldowns: 0
};

module.exports.handleEvent = async function ({ api, Users, event }) {
  try {
    const { messageID, threadID, senderID, body, isGroup } = event;
    if (!body && (!event.attachments || event.attachments.length === 0)) return;
    if (senderID == api.getCurrentUserID()) return;

    const chalk = require('chalk');
    const moment = require("moment-timezone");
    const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

    let nameUser = "Người dùng Facebook";
    try {
      if (global.data.userName.has(senderID)) {
        nameUser = global.data.userName.get(senderID);
      } else {
        const uInfo = await Users.getNameUser(senderID);
        if (uInfo && uInfo !== "Người dùng facebook") {
          nameUser = uInfo;
        } else {
          const info = await api.getUserInfo(senderID);
          if (info && info[senderID] && info[senderID].name) {
            nameUser = info[senderID].name;
            global.data.userName.set(senderID, nameUser);
          }
        }
      }
    } catch (e) {
      nameUser = "Người dùng Facebook";
    }

    let threadName = "Tin nhắn riêng (Inbox 1-1)";
    if (threadID != senderID) {
      try {
        const tInfo = global.data.threadInfo.get(threadID);
        if (tInfo && tInfo.threadName) {
          threadName = tInfo.threadName;
        } else {
          const info = await api.getThreadInfo(threadID);
          if (info && info.threadName) {
            threadName = info.threadName;
            global.data.threadInfo.set(threadID, info);
          } else {
            threadName = "Nhóm (" + threadID + ")";
          }
        }
      } catch (e) {
        threadName = "Nhóm ID: " + threadID;
      }
    }

    const content = body ? body : (event.attachments && event.attachments.length > 0 ? `[Đính kèm ${event.attachments.length} tệp: ${event.attachments.map(a => a.type || 'file').join(', ')}]` : "[Tin nhắn không có văn bản]");

    console.log(
      chalk.cyan("┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓") + "\n" +
      chalk.greenBright(`  [ TÊN NGƯỜI GỬI ] : `) + chalk.whiteBright.bold(nameUser) + "\n" +
      chalk.yellowBright(`  [ ID NGƯỜI GỬI  ] : `) + chalk.yellow(senderID) + "\n" +
      chalk.magentaBright(`  [ NƠI GỬI       ] : `) + chalk.white(threadName) + (threadID != senderID ? chalk.gray(` (ID: ${threadID})`) : "") + "\n" +
      chalk.blueBright(`  [ THỜI GIAN     ] : `) + chalk.gray(time) + "\n" +
      chalk.redBright(`  [ NỘI DUNG      ] : `) + chalk.whiteBright.bold(content) + "\n" +
      chalk.cyan("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛")
    );
  } catch (err) {
    // Không làm gián đoạn bot nếu lỗi hiển thị console
  }
};

module.exports.run = async function () {};
