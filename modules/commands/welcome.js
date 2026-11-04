module.exports.config = {
  name: "welcome",
  version: "1.0.0",
  credits: "dtb",
  hasPermssion: 1,
  description: "Bật/tắt thông báo chào mừng thành viên mới",
  commandCategory: "Nhóm",
  usages: "welcome on / welcome off",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args, Threads }) {
  const { threadID, messageID } = event;

  let data = (await Threads.getData(threadID)).data || {};

  if (!args[0]) {
    const status = data.welcome === true ? "đang bật" : "đang tắt";
    return api.sendMessage(
      `📌 Welcome hiện ${status}\n\nDùng:\n/welcome on\n/welcome off`,
      threadID,
      messageID
    );
  }

  const input = args[0].toLowerCase();

  if (input === "on") {
    data.welcome = true;
    await Threads.setData(threadID, { data });
    global.data.threadData.set(String(threadID), data);

    return api.sendMessage("✅ Đã bật welcome cho nhóm này.", threadID, messageID);
  }

  if (input === "off") {
    data.welcome = false;
    await Threads.setData(threadID, { data });
    global.data.threadData.set(String(threadID), data);

    return api.sendMessage("✅ Đã tắt welcome cho nhóm này.", threadID, messageID);
  }

  return api.sendMessage(
    "❎ Sai cú pháp.\nDùng:\n/welcome on\n/welcome off",
    threadID,
    messageID
  );
};