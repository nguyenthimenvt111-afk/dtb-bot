module.exports.config = {
  name: "duyettv",
  version: "2.1.0",
  hasPermssion: 1,
  hasPermission: 1,
  credits: "dtb",
  description: "Xem và phê duyệt hoặc từ chối thành viên trong hàng chờ duyệt của nhóm chat",
  commandCategory: "Quản Lí Box",
  usages: "duyettv",
  cooldowns: 2
};

module.exports.run = async function ({ api, event, Users }) {
  try {
    const { threadID, messageID } = event;
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = Array.isArray(threadInfo.adminIDs) ? threadInfo.adminIDs.map(e => String(e.id)) : [];

    if (!adminIDs.includes(String(api.getCurrentUserID()))) {
      return api.sendMessage("⚠️ Bot cần quyền Quản trị viên nhóm để quản lý danh sách phê duyệt thành viên!", threadID, messageID);
    }

    const queue = Array.isArray(threadInfo.approvalQueue) ? threadInfo.approvalQueue : [];
    if (queue.length === 0) {
      return api.sendMessage("✅ Hiện tại không có yêu cầu tham gia nào trong danh sách chờ duyệt của nhóm.", threadID, messageID);
    }

    let msg =
`╔═════════════════════════╗
   👥 DANH SÁCH CHỜ DUYỆT (${queue.length})
╚═════════════════════════╝\n\n`;

    for (let i = 0; i < queue.length; i++) {
      let uName = "Người dùng Facebook";
      try {
        uName = (await Users.getNameUser(queue[i].requesterID)) || uName;
      } catch (_) {}
      msg += `  ${i + 1}. ${uName}\n     UID: ${queue[i].requesterID}\n\n`;
    }

    msg +=
`─────────────────────────
👉 Reply:
  • "[số]" hoặc "all" để DUYỆT vào nhóm
  • "deny [số]" hoặc "deny all" để TỪ CHỐI`;

    return api.sendMessage(msg, threadID, (err, info) => {
      if (!err && info) {
        global.client.handleReply.push({
          name: "duyettv",
          messageID: info.messageID,
          author: event.senderID,
          queue
        });
      }
    }, messageID);
  } catch (e) {
    console.error("Lỗi duyệt tv:", e);
    return api.sendMessage("❌ Không thể lấy danh sách phê duyệt thành viên từ nhóm!", event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, senderID, messageID, body } = event;
  if (String(senderID) !== String(handleReply.author)) return;

  const input = body.trim().toLowerCase();
  const queue = handleReply.queue || [];

  if (queue.length === 0) {
    return api.sendMessage("⚠️ Danh sách chờ duyệt hiện đã trống!", threadID, messageID);
  }

  // 1. TỪ CHỐI (DENY)
  if (input.startsWith("deny") || input.startsWith("tuchoi") || input.startsWith("hủy")) {
    const raw = input.replace(/^(deny|tuchoi|hủy)\s*/i, "").trim();
    let targets = [];

    if (raw === "all") {
      targets = queue;
    } else {
      const idxs = raw.split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0 && n <= queue.length);
      targets = idxs.map(i => queue[i - 1]);
    }

    if (!targets.length) {
      return api.sendMessage("⚠️ Vui lòng nhập số thứ tự hợp lệ cần từ chối (Ví dụ: deny 1 hoặc deny all)!", threadID, messageID);
    }

    let deniedCount = 0;
    for (const member of targets) {
      try {
        await api.handleMessageRequest(member.requesterID, false);
        deniedCount++;
      } catch (_) {}
    }
    return api.sendMessage(`✅ Đã từ chối thành công ${deniedCount}/${targets.length} yêu cầu tham gia!`, threadID, messageID);
  }

  // 2. PHÊ DUYỆT (APPROVE)
  let targets = [];
  if (input === "all") {
    targets = queue;
  } else {
    const idxs = input.split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0 && n <= queue.length);
    targets = idxs.map(i => queue[i - 1]);
  }

  if (!targets.length) {
    return api.sendMessage("⚠️ Vui lòng nhập số thứ tự hợp lệ để duyệt (Ví dụ: 1 hoặc 1 2 hoặc all)!", threadID, messageID);
  }

  let approvedCount = 0;
  for (const member of targets) {
    try {
      await api.addUserToGroup(member.requesterID, threadID);
      approvedCount++;
    } catch (_) {}
  }

  return api.sendMessage(`🎉 Đã duyệt thành công ${approvedCount}/${targets.length} thành viên vào nhóm!`, threadID, messageID);
};
