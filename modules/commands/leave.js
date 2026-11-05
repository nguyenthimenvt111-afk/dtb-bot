module.exports.config = {
  name: "leave",
  version: "1.0.0",
  credits: "dtb",
  hasPermssion: 1,
  hasPermission: 1,
  description: "Bật/tắt thông báo card Canvas khi có thành viên rời nhóm hoặc bị kick",
  commandCategory: "Nhóm",
  usages: "leave on / leave off",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args, Threads }) {
  const { threadID, messageID } = event;
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
▸ ${prefix}leave off : Tắt gửi Card Canvas khi có người rời nhóm/bị kick`,
      threadID,
      messageID
    );
  }

  const input = args[0].toLowerCase();

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
▸ ${prefix}leave off : Tắt thông báo out`,
    threadID,
    messageID
  );
};
