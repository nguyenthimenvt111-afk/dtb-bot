module.exports.config = {
  name: "upt",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "dtb",
  description: "Hiển thị thời gian bot đã hoạt động",
  commandCategory: "Hệ Thống",
  usages: "",
  cooldowns: 5,
};

module.exports.handleEvent = async ({ event, api, Threads }) => {
  const axios = require("axios");
  const time = process.uptime();

  const h = Math.floor(time / 3600);
  const m = Math.floor((time % 3600) / 60);
  const s = Math.floor(time % 60);

  const { threadID, messageID, body } = event;
  // verified

  const dataThread = await Threads.getData(threadID);
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = dataThread.data.PREFIX || threadSetting.PREFIX || global.config.PREFIX;

  const triggers = ["upt", "uptime"];
  if (!triggers.includes(body.toLowerCase())) return;

  const msg = `
╭───────────────╮
│ 🩵 𝐒𝐘𝐒𝐓𝐄𝐌 𝐒𝐓𝐀𝐓𝐔𝐒
│────────────────
│ ⏱ 𝙐𝙥𝙩𝙞𝙢𝙚: ${h} giờ ${m} phút ${s} giây
│ ⚙️ 𝙋𝙧𝙚𝙛𝙞𝙭: ${prefix}
╰───────────────╯
  `;

  try {
    const { data } = await axios.get("https://raw.githubusercontent.com");
    const imgStream = (await axios.get(data.data, { responseType: "stream" })).data;
    return api.sendMessage({ body: msg.trim(), attachment: imgStream }, threadID, messageID);
  } catch {
    return api.sendMessage(msg.trim(), threadID, messageID);
  }
};

module.exports.run = async ({ event, api }) => {
  const axios = require("axios");
  const time = process.uptime();

  const h = Math.floor(time / 3600);
  const m = Math.floor((time % 3600) / 60);
  const s = Math.floor(time % 60);

  const msg = `
╭───────────────╮
│ 🩵 𝐒𝐘𝐒𝐓𝐄𝐌 𝐒𝐓𝐀𝐓𝐔𝐒
│────────────────
│ ⏱ 𝙐𝙥𝙩𝙞𝙢𝙚: ${h} giờ ${m} phút ${s} giây
╰───────────────╯
  `;

  try {
    const { data } = await axios.get("https://vnhhoang.vnhoang06.repl.co/image/phongcanh");
    const imgStream = (await axios.get(data.data, { responseType: "stream" })).data;
    return api.sendMessage({ body: msg.trim(), attachment: imgStream }, event.threadID);
  } catch {
    return api.sendMessage(msg.trim(), event.threadID);
  }
};
