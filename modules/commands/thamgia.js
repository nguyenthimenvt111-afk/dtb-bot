module.exports.config = {
  name: "thamgia",
  version: "1.0.0", 
  hasPermssion: 3,
  credits: "dtb",
  description: "Thêm bạn vào nhóm mà bot đang ở",
  commandCategory: "Hệ Thống", 
  usages: "thamgia", 
  cooldowns: 0,
  dependencies: {}
};

module.exports.handleReply = async ({ event, api, handleReply }) => {
  var { threadID, messageID, body, senderID } = event;
  var { threadList, author } = handleReply;

  if (handleReply.author != senderID) 
    return api.sendMessage("⚠️ Bạn không có quyền thao tác lệnh này!", threadID, messageID);

  if (!body || !parseInt(body)) 
    return api.sendMessage('❌ Lựa chọn của bạn phải là một con số.', threadID, messageID);

  if (!threadList[parseInt(body) - 1]) 
    return api.sendMessage("❌ Lựa chọn của bạn không nằm trong danh sách.", threadID, messageID);

  try {
    var threadInfo = threadList[parseInt(body) - 1];
    var { participantIDs } = threadInfo;

    if (participantIDs.includes(senderID)) 
      return api.sendMessage('✅ Bạn đã có mặt trong nhóm này.', threadID, messageID);

    // 🌟 Gửi cảnh báo trước khi thêm
    api.sendMessage(
      "👑 Admin bot chuẩn bị giáng lâm, các hạ chú ý!\n━━━━━━━━━━━━━━",
      threadInfo.threadID,
      () => {
        // Sau khi gửi cảnh báo thì add user
        api.addUserToGroup(senderID, threadInfo.threadID, (e) => {
          if (e) api.sendMessage(`❌ Đã xảy ra lỗi: ${e.errorDescription}`, threadID, messageID);
          else api.sendMessage(
            `✅ Bot đã thêm bạn vào nhóm ${threadInfo.name}!\n👉 Kiểm tra ở mục spam hoặc tin nhắn chờ nếu không thấy box nhé.`,
            threadID,
            messageID
          );
        });
      }
    );
  }
  catch (error) {
    return api.sendMessage(`❌ Chưa thể thực thi: ${error}`, threadID, messageID);
  }
};

module.exports.run = async function({ api, event }) {
  const permission = ["61588287399958"]; // UID admin
  if (!permission.includes(event.senderID)) 
    return api.sendMessage("⚠️ Bạn không có quyền dùng lệnh này.", event.threadID, event.messageID);	

  const { threadID, messageID, senderID } = event;
  const commandName = this.config.name;
  var msg = "", index = 1;

  try {
    var spam = await api.getThreadList(50, null, ["INBOX"]) || [];
  } catch (e) { 
    return api.sendMessage(`❌ Không thể lấy danh sách nhóm\nVui lòng thử lại sau`, threadID, messageID); 
  }

  const list = [...spam].filter(group => group.isSubscribed && group.isGroup);

  for (const single of list) 
    msg += `${index++}. ${single.name}\n`;

  var tpk = `⬇️==== [ 𝗧𝗛𝗔𝗠 𝗚𝗜𝗔 ] ====⬇️
━━━━━━━━━━━━━━━
📌 Hiện tại có ${list.length} nhóm bot đang hoạt động\n\n`;

  if (list.length != 0) 
    return api.sendMessage(
      tpk + msg + `\n👉 Reply tin nhắn này kèm số để chọn nhóm muốn tham gia.\n🌸 Tổng nhóm lưu vào hệ thống: ${global.data.allThreadID.length}`,
      threadID,
      (error, info) => {
        global.client.handleReply.push({
          name: commandName,
          messageID: info.messageID,
          author: senderID,
          threadList: list
        });
      },
      messageID
    );
  else 
    return api.sendMessage(`[ Lỗi ] Không có nhóm nào khả dụng.`, threadID, messageID);
};
