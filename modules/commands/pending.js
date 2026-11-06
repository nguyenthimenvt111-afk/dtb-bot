module.exports.config = {
  name: "pending",
  version: "2.0.0",
  credits: "dtb",
  hasPermssion: 2,
  hasPermission: 2,
  description: "Quản lý và phê duyệt tin nhắn / nhóm chat đang chờ duyệt",
  commandCategory: "Hệ Thống",
  usages: "pending [thread / user / all]",
  cooldowns: 3
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  if (String(event.senderID) !== String(handleReply.author)) return;
  const { body, threadID, messageID } = event;
  const text = body.trim().toLowerCase();

  // Từ chối: c 1 2 hoặc cancel all
  if (text.startsWith("c") || text.startsWith("cancel")) {
    const raw = text.replace(/^(cancel|c)\s*/i, "").trim();
    let indices = [];

    if (raw === "all") {
      indices = handleReply.pending.map((_, i) => i + 1);
    } else {
      indices = raw.split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0 && n <= handleReply.pending.length);
    }

    if (!indices.length) {
      return api.sendMessage("⚠️ Vui lòng nhập số thứ tự hợp lệ cần hủy (Ví dụ: c 1 hoặc cancel all)!", threadID, messageID);
    }

    for (const idx of indices) {
      const item = handleReply.pending[idx - 1];
      try {
        await api.deleteThread(item.threadID);
      } catch (_) {}
    }
    return api.sendMessage(`✅ Đã từ chối và xóa thành công ${indices.length} yêu cầu chờ duyệt!`, threadID, messageID);
  }

  // Duyệt: 1 2 hoặc all
  let indices = [];
  if (text === "all") {
    indices = handleReply.pending.map((_, i) => i + 1);
  } else {
    indices = text.split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0 && n <= handleReply.pending.length);
  }

  if (!indices.length) {
    return api.sendMessage("⚠️ Vui lòng nhập số thứ tự hợp lệ để duyệt (Ví dụ: 1 hoặc 1 2 hoặc all)!", threadID, messageID);
  }

  let count = 0;
  const botName = global.config.BOTNAME || "dtb";
  const prefix = global.config.PREFIX || "/";

  for (const idx of indices) {
    const item = handleReply.pending[idx - 1];
    try {
      await api.changeNickname(`[ ${prefix} ] • ${botName}`, item.threadID, api.getCurrentUserID());
    } catch (_) {}

    try {
      await api.sendMessage(
        `╔═════════════════════════╗\n` +
        `     🎉 PHÊ DUYỆT THÀNH CÔNG 🎉\n` +
        `╚═════════════════════════╝\n` +
        `✅ Nhóm của bạn đã được Admin phê duyệt kích hoạt bot!\n` +
        `📌 Dấu lệnh prefix hệ thống: ${prefix}\n` +
        `💡 Gõ "${prefix}menu" để khám phá danh sách lệnh và minigame.\n` +
        `─────────────────────────\n` +
        `⚡ Powered by DTB Bot System`,
        item.threadID
      );
      count++;
    } catch (_) {}
  }

  return api.sendMessage(`✅ Đã phê duyệt thành công ${count}/${indices.length} nhóm/người dùng vào hoạt động!`, threadID, messageID);
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const prefix = (global.data.threadData.get(String(threadID)) || {}).PREFIX || global.config.PREFIX || "/";

  if (!args[0]) {
    return api.sendMessage(
      `╔═════════════════════════╗\n` +
      `     📋 QUẢN LÝ CHỜ DUYỆT 📋\n` +
      `╚═════════════════════════╝\n` +
      `📌 Cú pháp sử dụng:\n` +
      `  • ${prefix}pending thread (hoặc t) : Xem danh sách nhóm chờ duyệt\n` +
      `  • ${prefix}pending user   (hoặc u) : Xem danh sách người dùng chờ duyệt\n` +
      `  • ${prefix}pending all    (hoặc a) : Xem toàn bộ hàng chờ\n` +
      `─────────────────────────\n` +
      `👉 Khi danh sách hiện ra:\n` +
      `  - Reply "[số]" hoặc "all" để DUYỆT\n` +
      `  - Reply "c [số]" hoặc "cancel all" để TỪ CHỐI`,
      threadID,
      messageID
    );
  }

  const sub = args[0].toLowerCase();
  let spam = [];
  let pending = [];

  try {
    spam = (await api.getThreadList(100, null, ["OTHER"])) || [];
    pending = (await api.getThreadList(100, null, ["PENDING"])) || [];
  } catch (e) {
    return api.sendMessage("❌ Không thể kết nối lấy danh sách hàng chờ từ Facebook!", threadID, messageID);
  }

  let list = [];
  let title = "";

  if (["thread", "t", "-t"].includes(sub)) {
    list = [...spam, ...pending].filter(g => g.isSubscribed && g.isGroup);
    title = "NHÓM CHỜ DUYỆT";
  } else if (["user", "u", "-u"].includes(sub)) {
    list = [...spam, ...pending].filter(g => !g.isGroup);
    title = "NGƯỜI DÙNG CHỜ DUYỆT";
  } else if (["all", "a", "-a"].includes(sub)) {
    list = [...spam, ...pending].filter(g => g.isSubscribed || !g.isGroup);
    title = "TẤT CẢ HÀNG CHỜ DUYỆT";
  } else {
    return api.sendMessage(`⚠️ Cú pháp không đúng! Dùng "${prefix}pending" để xem hướng dẫn.`, threadID, messageID);
  }

  if (list.length === 0) {
    return api.sendMessage(`✅ Hiện tại không có yêu cầu nào trong danh sách ${title.toLowerCase()}!`, threadID, messageID);
  }

  let msg =
`╔═════════════════════════╗
   📋 ${title} (${list.length})
╚═════════════════════════╝\n\n`;

  list.forEach((item, idx) => {
    msg += `  ${idx + 1}. ${item.name || "Không tên"}\n     ID: ${item.threadID}\n\n`;
  });

  msg +=
`─────────────────────────
👉 Reply:
  • "[số]" hoặc "all" để DUYỆT
  • "c [số]" hoặc "cancel all" để TỪ CHỐI`;

  return api.sendMessage(msg, threadID, (err, info) => {
    if (!err && info) {
      global.client.handleReply.push({
        name: "pending",
        messageID: info.messageID,
        author: event.senderID,
        pending: list
      });
    }
  }, messageID);
};
