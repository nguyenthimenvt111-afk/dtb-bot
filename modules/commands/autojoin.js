// file: autojoin.js
// mod by genfor + chỉnh cho Mirai bot
module.exports.config = {
  name: "autojoin",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "dtb",
  description: "Tự động join box khi ai đó nhắn 'join <link>' (Mirai bot) — mọi người đều có thể dùng",
};

module.exports.run = async ({ api, event, args }) => {
  try {
    if (!event || !event.body) return;

    const text = event.body.trim();
    const m = text.match(/^join\s+(.+)$/i);
    if (!m) return;

    const link = m[1].trim();
    if (!link) {
      return api.sendMessage("Không tìm thấy link trong tin nhắn. Format: join <link>", event.threadID);
    }

    await api.sendMessage(`Đang cố join bằng link: ${link}`, event.threadID);

    const joinId = extractJoinId(link);
    if (!joinId) {
      return api.sendMessage("Không thể xác định ID nhóm từ link này.", event.threadID);
    }

    // Mirai API: joinGroupByCode
    if (typeof api.joinGroupByCode === "function") {
      try {
        const res = await api.joinGroupByCode(joinId);
        return api.sendMessage(`Join thành công nhóm: ${res?.threadID || joinId}`, event.threadID);
      } catch (err) {
        return api.sendMessage(`Lỗi khi join nhóm: ${err.message}`, event.threadID);
      }
    } else {
      return api.sendMessage(
        "API Mirai hiện tại không có hàm joinGroupByCode. Kiểm tra lại api hoặc phiên bản Mirai.",
        event.threadID
      );
    }
  } catch (err) {
    console.error("autojoin error:", err);
    try { api.sendMessage("Lỗi khi cố join: " + err.message, event.threadID); } catch(e){ }
  }
};

function extractJoinId(link) {
  try {
    // m.me/join/<code>
    let m = link.match(/m\.me\/join\/([A-Za-z0-9-_]+)/i);
    if (m) return m[1];
    // facebook.com/groups/<id>
    m = link.match(/facebook\.com\/groups\/([0-9]+)/i);
    if (m) return m[1];
    // WhatsApp (chat.whatsapp.com/<code>)
    m = link.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/i);
    if (m) return m[1];
    // fallback: lấy đoạn cuối url
    const url = new URL(link);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
    return null;
  } catch (e) {
    return null;
  }
}
