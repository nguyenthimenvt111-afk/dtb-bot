const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
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
  name: "scl",
  version: "1.1.0",
  hasPermission: 0,
  credits: "dtb",
  description: "Tìm kiếm và tải nhạc từ SoundCloud",
  commandCategory: "Nhạc",
  usages: "[tên bài hát]",
  cooldowns: 5,
};

const searchResults = {};

function formatDuration(ms) {
  if (!ms || isNaN(ms)) return "N/A";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

async function searchTracks(keyword, limit = 5) {
  if (!scdl) return [];
  const searchResult = await scdl.search({
    query: keyword,
    limit: limit,
    resourceType: "tracks"
  });

  if (!searchResult || !searchResult.collection || searchResult.collection.length === 0) {
    return [];
  }

  return searchResult.collection.map((track) => ({
    id: track.id,
    title: track.title,
    artist: track.user ? track.user.username : "Không rõ",
    duration: formatDuration(track.duration),
    url: track.permalink_url,
    artwork: track.artwork_url || track.user?.avatar_url,
    playCount: track.playback_count || 0,
    likeCount: track.likes_count || 0
  }));
}

async function downloadTrack(url) {
  if (!scdl) throw new Error("Thư viện soundcloud-downloader chưa được nạp");
  const track = await scdl.getInfo(url);
  const stream = await scdl.download(url);

  const safeName = (track.title || "audio").replace(/[/\\?%*:|"<>]/g, "-").slice(0, 40);
  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);
  const filePath = path.join(cacheDir, `${Date.now()}_${safeName}.mp3`);

  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    stream.pipe(writeStream);
    writeStream.on("finish", () => resolve({ ...track, filePath }));
    writeStream.on("error", (err) => {
      try { fs.unlinkSync(filePath); } catch {}
      reject(err);
    });
    stream.on("error", (err) => {
      try { fs.unlinkSync(filePath); } catch {}
      reject(err);
    });
  });
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const keyword = args.join(" ").trim();

  if (!keyword) {
    return api.sendMessage("❌ Vui lòng nhập tên bài hát cần tìm trên SoundCloud.", threadID, messageID);
  }

  try {
    const tracks = await searchTracks(keyword, 5);
    if (tracks.length === 0) {
      return api.sendMessage("❌ Không tìm thấy bài hát nào trên SoundCloud.", threadID, messageID);
    }

    let msg = "🎧 KẾT QUẢ TÌM KIẾM SOUNDCLOUD:\n────────────────────\n";
    tracks.forEach((track, index) => {
      msg += `${index + 1}. ${track.title}\n   👤 Ca sĩ: ${track.artist} | ⏱️ ${track.duration}\n\n`;
    });
    msg += "👉 Phản hồi (reply) tin nhắn này kèm số thứ tự (1-5) để tải bài hát.";

    searchResults[senderID] = tracks;

    return api.sendMessage(
      msg,
      threadID,
      (error, info) => {
        if (error) return console.error(error);
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "result"
        });
      },
      messageID
    );
  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Đã xảy ra lỗi khi tìm kiếm bài hát trên SoundCloud.", threadID, messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  if (handleReply.author != senderID) return;

  const choice = parseInt(String(body).trim(), 10);
  const userResults = searchResults[senderID];
  if (!userResults || isNaN(choice) || choice <= 0 || choice > userResults.length) {
    return api.sendMessage(`❌ Lựa chọn không hợp lệ. Vui lòng chọn số từ 1 đến ${userResults ? userResults.length : 5}.`, threadID, messageID);
  }

  const selectedTrack = userResults[choice - 1];
  try { api.unsendMessage(handleReply.messageID); } catch {}

  api.sendMessage(`⏳ Đang tải bài hát "${selectedTrack.title}"...`, threadID, messageID);

  try {
    const downloadResult = await downloadTrack(selectedTrack.url);
    const stats = fs.statSync(downloadResult.filePath);

    if (stats.size > 26214400) {
      try { fs.unlinkSync(downloadResult.filePath); } catch {}
      delete searchResults[senderID];
      return api.sendMessage("⚠️ Bài hát vượt quá giới hạn 25MB của Facebook Messenger.", threadID, messageID);
    }

    const trackInfo = [
      `🎵 Bài hát: ${downloadResult.title}`,
      `🎤 Nghệ sĩ: ${downloadResult.user?.username || selectedTrack.artist}`,
      `⏱️ Thời lượng: ${formatDuration(downloadResult.duration)}`,
      `👁️ Lượt nghe: ${(downloadResult.playback_count || 0).toLocaleString()}`,
      `❤️ Lượt thích: ${(downloadResult.likes_count || 0).toLocaleString()}`,
      `\n✨ Phát bởi dtb Bot System`
    ].join("\n");

    await api.sendMessage(
      {
        body: trackInfo,
        attachment: fs.createReadStream(downloadResult.filePath)
      },
      threadID,
      () => {
        try { fs.unlinkSync(downloadResult.filePath); } catch {}
      },
      messageID
    );
  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Đã xảy ra lỗi khi tải bài hát từ SoundCloud.", threadID, messageID);
  }

  delete searchResults[senderID];
};
