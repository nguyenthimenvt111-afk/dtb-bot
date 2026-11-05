module.exports.config = {
  name: "welcome",
  version: "1.1.0",
  credits: "dtb",
  hasPermssion: 1,
  hasPermission: 1,
  description: "Bật/tắt thông báo card Canvas khi có thành viên mới tham gia nhóm",
  commandCategory: "Nhóm",
  usages: "welcome on / welcome off",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args, Threads }) {
  const { threadID, messageID } = event;
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
▸ ${prefix}welcome off : Tắt gửi Card Canvas chào mừng thành viên mới`,
      threadID,
      messageID
    );
  }

  const input = args[0].toLowerCase();

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
▸ ${prefix}welcome off : Tắt thông báo welcome`,
    threadID,
    messageID
  );
};
