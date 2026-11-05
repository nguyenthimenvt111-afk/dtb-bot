const fs = require("fs-extra");
const path = require("path");
const dns = require("dns");

try {
  dns.setDefaultResultOrder("ipv4first");
} catch (_) {}

let scdl;
try {
  scdl = require("soundcloud-downloader").default;
} catch (e) {
  scdl = null;
}

module.exports.config = {
  name: "automusic",
  version: "1.2.0",
  hasPermission: 0,
  credits: "dtb",
  description: "Tự động phát hiện yêu cầu mở nhạc hoặc dùng lệnh automusic",
  commandCategory: "Nhạc",
  usages: "automusic <tên bài hát> hoặc nhắn 'bot ơi mở nhạc <tên bài>'",
  cooldowns: 5,
};

function formatDuration(ms) {
  if (!ms || isNaN(ms)) return "N/A";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

async function downloadAndSend(api, event, track) {
  if (!scdl) return api.sendMessage("❌ Thư viện âm nhạc chưa sẵn sàng.", event.threadID, event.messageID);

  try {
    const stream = await scdl.download(track.permalink_url);
    const safeName = (track.title || "audio").replace(/[/\\?%*:|"<>]/g, "-").slice(0, 40);
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    const filePath = path.join(cacheDir, `auto_${Date.now()}_${safeName}.mp3`);

    const writer = fs.createWriteStream(filePath);
    stream.pipe(writer);

    writer.on("finish", () => {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > 26214400) {
          try { fs.unlinkSync(filePath); } catch {}
          return api.sendMessage("⚠️ Bài hát vượt quá giới hạn 25MB của Facebook Messenger.", event.threadID);
        }

        api.sendMessage(
          {
            body: `🎧 Đang phát: ${track.title}\n👤 Nghệ sĩ: ${track.user?.username || "Không rõ"}\n⏱️ Thời lượng: ${formatDuration(track.duration)}`,
            attachment: fs.createReadStream(filePath),
          },
          event.threadID,
          () => {
            try { fs.unlinkSync(filePath); } catch {}
          }
        );
      } catch (sendErr) {
        console.error(sendErr);
        try { fs.unlinkSync(filePath); } catch {}
      }
    });

    writer.on("error", (err) => {
      console.error(err);
      try { fs.unlinkSync(filePath); } catch {}
      api.sendMessage("⚠️ Đã có lỗi xảy ra khi lưu file nhạc.", event.threadID);
    });

    stream.on("error", (err) => {
      console.error(err);
      try { fs.unlinkSync(filePath); } catch {}
      api.sendMessage("⚠️ Đã có lỗi khi stream âm thanh từ SoundCloud.", event.threadID);
    });

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Không thể tải bài hát này, vui lòng thử lại sau.", event.threadID, event.messageID);
  }
}

async function searchAndPlay(api, event, keyword) {
  if (!scdl) return api.sendMessage("❌ Thư viện SoundCloud chưa sẵn sàng.", event.threadID, event.messageID);

  try {
    const res = await scdl.search({ query: keyword, limit: 1, resourceType: "tracks" });
    if (!res || !res.collection || res.collection.length === 0) {
      return api.sendMessage(`❌ Không tìm thấy bài hát nào cho từ khóa "${keyword}".`, event.threadID, event.messageID);
    }
    const track = res.collection[0];
    api.sendMessage(`🎶 Đang tải bài hát "${track.title}"...`, event.threadID);
    await downloadAndSend(api, event, track);
  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Có lỗi xảy ra khi tìm bài hát.", event.threadID, event.messageID);
  }
}

module.exports.handleEvent = async ({ event, api }) => {
  const { threadID, body } = event;
  if (!body) return;

  const lower = body.toLowerCase().trim();
  const prefixes = [
    "hoàng ơi mở nhạc",
    "bot ơi mở nhạc",
    "mở nhạc bài",
    "phát nhạc bài",
    "bật nhạc bài"
  ];

  for (const p of prefixes) {
    if (lower.startsWith(p)) {
      const keyword = lower.slice(p.length).trim();
      if (!keyword) {
        return api.sendMessage("🎶 Bạn muốn nghe bài gì nè? Nhắn tên bài hát để bot mở nhé!", threadID, event.messageID);
      }
      await searchAndPlay(api, event, keyword);
      return;
    }
  }
};

module.exports.run = async ({ event, args, api }) => {
  const keyword = args.join(" ").trim();
  if (!keyword) {
    return api.sendMessage("❌ Vui lòng nhập tên bài hát cần phát. Ví dụ: automusic Nơi này có anh", event.threadID, event.messageID);
  }

  api.sendMessage(`🔎 Đang tìm kiếm "${keyword}"...`, event.threadID, event.messageID);
  await searchAndPlay(api, event, keyword);
};
