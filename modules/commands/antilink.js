module.exports.config = {
  name: "antilink",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "dtb",
  description: "Canh bao gui link, qua 3 lan se kick",
  commandCategory: "Nhom",
  usages: "antilink on/off/status/reset",
  cooldowns: 3
};

const WARNING_LIMIT = 3;

function hasLink(text = "") {
  const linkRegex = /((https?:\/\/|ftp:\/\/|www\.)\S+)|(([a-zA-Z0-9-]+\.)+(com|net|org|vn|me|io|gg|xyz|ly|tv|co|us|info|biz|app|dev|link|cc|to|ai)\b)/i;
  return linkRegex.test(text);
}

async function isThreadAdmin(api, threadID, userID) {
  try {
    const info = await api.getThreadInfo(threadID);
    return (info.adminIDs || []).some(item => String(item.id) === String(userID));
  } catch (_) {
    return false;
  }
}

module.exports.run = async function ({ api, event, args, Threads }) {
  const threadID = String(event.threadID);
  const action = (args[0] || "").toLowerCase();

  let data = (await Threads.getData(threadID)).data || {};
  if (typeof data.antilink !== "boolean") data.antilink = false;
  if (typeof data.antilinkWarnings !== "object" || data.antilinkWarnings === null) data.antilinkWarnings = {};

  if (action === "on") data.antilink = true;
  else if (action === "off") data.antilink = false;
  else if (action === "status") {
    return api.sendMessage(
      `[ ANTILINK ]\nTrang thai: ${data.antilink ? "BAT" : "TAT"}\nGioi han kick: tren ${WARNING_LIMIT} lan vi pham`,
      threadID,
      event.messageID
    );
  } else if (action === "reset") {
    data.antilinkWarnings = {};
    await Threads.setData(threadID, { data });
    global.data.threadData.set(threadID, data);
    return api.sendMessage("[ ANTILINK ] Da reset toan bo so lan canh cao.", threadID, event.messageID);
  } else {
    data.antilink = !data.antilink;
  }

  await Threads.setData(threadID, { data });
  global.data.threadData.set(threadID, data);

  return api.sendMessage(
    `[ ANTILINK ] Da ${data.antilink ? "BAT" : "TAT"} che do chong gui link.`,
    threadID,
    event.messageID
  );
};

module.exports.handleEvent = async function ({ api, event, Threads }) {
  try {
    if (!event.isGroup) return;
    if (event.type !== "message" && event.type !== "message_reply") return;
    if (!event.body) return;

    const threadID = String(event.threadID);
    const senderID = String(event.senderID);
    const botID = String(api.getCurrentUserID());

    const data = (await Threads.getData(threadID)).data || {};
    if (!data.antilink) return;
    if (!hasLink(event.body)) return;

    const adminBot = (global.config.ADMINBOT || []).map(String);
    const ndh = (global.config.NDH || []).map(String);
    if (adminBot.includes(senderID) || ndh.includes(senderID) || senderID === botID) return;

    const senderIsThreadAdmin = await isThreadAdmin(api, threadID, senderID);
    if (senderIsThreadAdmin) return;

    if (typeof data.antilinkWarnings !== "object" || data.antilinkWarnings === null) data.antilinkWarnings = {};

    const currentWarnings = Number(data.antilinkWarnings[senderID] || 0) + 1;
    data.antilinkWarnings[senderID] = currentWarnings;

    await Threads.setData(threadID, { data });
    global.data.threadData.set(threadID, data);

    if (currentWarnings > WARNING_LIMIT) {
      const botIsThreadAdmin = await isThreadAdmin(api, threadID, botID);
      if (!botIsThreadAdmin) {
        return api.sendMessage(
          `[ ANTILINK ] @${senderID} da vi pham ${currentWarnings} lan (> ${WARNING_LIMIT}) nhung bot khong co quyen QTV de kick.`,
          threadID
        );
      }

      return api.removeUserFromGroup(senderID, threadID, (err) => {
        if (err) {
          return api.sendMessage(
            `[ ANTILINK ] Khong the kick thanh vien vi loi he thong.`,
            threadID
          );
        }
        return api.sendMessage(
          `[ ANTILINK ] Thanh vien ${senderID} da vi pham qua ${WARNING_LIMIT} lan gui link va da bi kick.`,
          threadID
        );
      });
    }

    const remain = WARNING_LIMIT - currentWarnings + 1;
    return api.sendMessage(
      `[ ANTILINK ] Canh cao ${senderID}: khong duoc gui link trong nhom!\nVi pham: ${currentWarnings}/${WARNING_LIMIT + 1} (qua ${WARNING_LIMIT} lan se kick).\nCon ${remain} lan truoc khi bi kick.`,
      threadID
    );
  } catch (_) {}
};
