const moment = require("moment-timezone");
const os = require("os");

module.exports.config = {
  name: "upt",
  version: "3.1.0",
  hasPermssion: 0,
  hasPermission: 0,
  credits: "dtb",
  description: "Hiển thị thời gian bot đã hoạt động và trạng thái hệ thống",
  commandCategory: "Hệ Thống",
  usages: "",
  cooldowns: 5,
};

function formatUptime(uptime) {
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);
  return `${h} giờ ${m} phút ${s} giây`;
}

module.exports.handleEvent = async ({ event, api, Threads }) => {
  const { threadID, messageID, body } = event;
  if (!body || typeof body !== "string") return;

  const triggers = ["upt", "uptime", "bot ơi uptime"];
  if (!triggers.includes(body.trim().toLowerCase())) return;

  const uptime = process.uptime();
  const uptimeStr = formatUptime(uptime);
  const threadSetting = (global.data.threadData.get(String(threadID)) || {}).PREFIX || global.config.PREFIX;
  const timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss - DD/MM/YYYY");

  const msg = 
`╭───────────────╮
│ 🩵 𝐒𝐘𝐒𝐓𝐄𝐌 𝐔𝐏𝐓𝐈𝐌𝐄
│────────────────
│ ⏱ 𝙐𝙥𝙩𝙞𝙢𝙚: ${uptimeStr}
│ ⚙️ 𝙋𝙧𝙚𝙛𝙞𝙭: ${threadSetting}
│ ⏰ 𝙏𝙝𝙤̛̀𝙞 𝙜𝙞𝙖𝙣: ${timeNow}
│ ✨ 𝙃𝙚̣̂ 𝙩𝙝𝙤̂́𝙣𝙜: dtb Bot System
╰───────────────╯`;

  return api.sendMessage(msg.trim(), threadID, messageID);
};

module.exports.run = async ({ event, api, Threads }) => {
  const timeStart = Date.now();
  const uptime = process.uptime();
  const uptimeStr = formatUptime(uptime);
  const { threadID, messageID } = event;

  const threadSetting = (global.data.threadData.get(String(threadID)) || {}).PREFIX || global.config.PREFIX;
  const timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss - DD/MM/YYYY");
  const ramUsed = ((os.totalmem() - os.freemem()) / (1024 * 1024 * 1024)).toFixed(1);
  const ramTotal = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1);
  const ping = Date.now() - timeStart;

  const msg = 
`╭───────────────╮
│ 🩵 𝐒𝐘𝐒𝐓𝐄𝐌 𝐒𝐓𝐀𝐓𝐔𝐒
│────────────────
│ ⏱ 𝙐𝙥𝙩𝙞𝙢𝙚: ${uptimeStr}
│ ⚙️ 𝙋𝙧𝙚𝙛𝙞𝙭: ${threadSetting}
│ 💾 𝙍𝘼𝙈: ${ramUsed}GB / ${ramTotal}GB
│ 📶 𝙋𝙞𝙣𝙜: ${ping}ms
│ 👥 𝙏𝙤̂̉𝙣𝙜 𝙣𝙝𝙤́𝙢: ${(global.data.allThreadID || []).length}
│ 👤 𝙏𝙤̂̉𝙣𝙜 𝙪𝙨𝙚𝙧: ${(global.data.allUserID || []).length}
│ ⏰ 𝙏𝙝𝙤̛̀𝙞 𝙜𝙞𝙖𝙣: ${timeNow}
│ ✨ 𝙋𝙝𝙖́𝙩 𝙩𝙧𝙞𝙚̂̉𝙣 𝙗𝙤̛̉𝙞: dtb
╰───────────────╯`;

  return api.sendMessage(msg.trim(), threadID, messageID);
};
