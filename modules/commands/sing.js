const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Youtube = require("youtube-search-api");
const https = require("https");
const dns = require("dns");
const { createCanvas, loadImage } = require("canvas");

try {
  dns.setDefaultResultOrder("ipv4first");
} catch (_) {}

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

module.exports.config = {
  name: "sing",
  version: "4.3.0",
  hasPermission: 0,
  credits: "dtb",
  description: "Tìm và tải bài hát từ YouTube & SoundCloud",
  commandCategory: "Nhạc",
  usages: "[tên bài hát]",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const keyword = args.join(" ").trim();
  if (!keyword) return api.sendMessage("❌ Vui lòng nhập tên bài hát cần tìm.", event.threadID, event.messageID);

  try {
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);

    let items = [];
    try {
      const searchResults = await Youtube.GetListByKeyword(keyword, false, 5);
      items = (searchResults && searchResults.items) ? searchResults.items : [];
    } catch (ytErr) {
      console.error("YouTube search error, trying fallback:", ytErr.message);
    }

    // Fallback qua SoundCloud nếu YouTube không có kết quả
    if (!items || items.length === 0) {
      try {
        let scdl = require("soundcloud-downloader").default;
        const scSearch = await scdl.search({ query: keyword, limit: 5, resourceType: "tracks" });
        if (scSearch && scSearch.collection && scSearch.collection.length > 0) {
          items = scSearch.collection.map(t => ({
            id: t.id,
            title: t.title,
            channelTitle: t.user?.username || "SoundCloud",
            length: { simpleText: formatDurationMs(t.duration) },
            thumbnail: { url: t.artwork_url || t.user?.avatar_url },
            scUrl: t.permalink_url
          }));
        }
      } catch (scErr) {
        console.error("SoundCloud search fallback error:", scErr.message);
      }
    }

    if (!items || items.length === 0) {
      return api.sendMessage("❌ Không tìm thấy bài hát nào phù hợp với từ khóa.", event.threadID, event.messageID);
    }

    const imgPath = path.join(cacheDir, `search_${event.senderID}_${Date.now()}.png`);
    await renderSearchCanvas(items, imgPath);

    const stream = fs.createReadStream(imgPath);
    stream.on("close", () => {
      try { fs.unlinkSync(imgPath); } catch {}
    });

    api.sendMessage(
      { attachment: stream },
      event.threadID,
      (err, info) => {
        if (err) console.error(err);
        if (info) {
          global.client.handleReply.push({
            name: module.exports.config.name,
            messageID: info.messageID,
            author: event.senderID,
            results: items
          });
        }
      },
      event.messageID
    );
  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Đã có lỗi xảy ra khi tìm kiếm bài hát.", event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { author, results } = handleReply;
  if (event.senderID !== author) return;

  const choice = parseInt(String(event.body).trim(), 10);
  if (isNaN(choice) || choice < 1 || choice > results.length) {
    return api.sendMessage(`❌ Vui lòng chọn một số hợp lệ từ 1 đến ${results.length}.`, event.threadID, event.messageID);
  }

  const video = results[choice - 1];
  const videoUrl = video.scUrl ? video.scUrl : `https://www.youtube.com/watch?v=${video.id}`;
  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);

  try {
    // 1. Gửi ảnh thẻ nhạc (neon + cover + duration)
    const imgPath = path.join(cacheDir, `card_${video.id || Date.now()}_${Date.now()}.png`);
    try {
      await renderMusicCard(video, imgPath);
      const cardStream = fs.createReadStream(imgPath);
      cardStream.on("close", () => {
        try { fs.unlinkSync(imgPath); } catch {}
      });
      api.sendMessage(
        { attachment: cardStream },
        event.threadID,
        undefined,
        event.messageID
      );
    } catch (cardErr) {
      console.error("Lỗi vẽ card nhạc:", cardErr.message);
    }

    // 2. Tải file âm thanh qua SoundCloud
    let audioStream = null;
    let scdl;
    try {
      scdl = require("soundcloud-downloader").default;
    } catch (_) {}

    if (scdl) {
      try {
        if (video.scUrl) {
          audioStream = await scdl.download(video.scUrl);
        } else {
          const cleanTitle = (video.title || "")
            .replace(/\[.*?\]|\(.*?\)|official|audio|mv|video|lyrics|nhạc|bài hát/gi, "")
            .trim();
          let scSearch = await scdl.search({ query: cleanTitle || video.title, limit: 3, resourceType: "tracks" });
          if (!scSearch?.collection?.length && cleanTitle !== video.title) {
            scSearch = await scdl.search({ query: video.title, limit: 3, resourceType: "tracks" });
          }
          if (scSearch && scSearch.collection && scSearch.collection.length > 0) {
            audioStream = await scdl.download(scSearch.collection[0].permalink_url);
          }
        }
      } catch (scDownloadErr) {
        console.error("SoundCloud stream download error:", scDownloadErr.message);
      }
    }

    // Fallback: Thử ytdl nếu chưa có stream
    if (!audioStream && !video.scUrl) {
      try {
        const ytdl = require("@distube/ytdl-core");
        audioStream = ytdl(videoUrl, { filter: "audioonly", quality: "highestaudio", highWaterMark: 1 << 25 });
      } catch (_) {}
    }

    if (!audioStream) {
      return api.sendMessage("❌ Không thể tải được file âm thanh cho bài hát này.", event.threadID, event.messageID);
    }

    const filePath = path.join(cacheDir, `${video.id || Date.now()}_${Date.now()}.mp3`);
    const writer = fs.createWriteStream(filePath);
    audioStream.pipe(writer);

    writer.on("finish", () => {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > 26214400) {
          try { fs.unlinkSync(filePath); } catch {}
          return api.sendMessage("⚠️ File nhạc vượt quá giới hạn 25MB của Facebook Messenger.", event.threadID, event.messageID);
        }
        const audioReadStream = fs.createReadStream(filePath);
        audioReadStream.on("close", () => {
          try { fs.unlinkSync(filePath); } catch {}
        });
        api.sendMessage(
          {
            body: `🎵 ${video.title || "Bài hát"}\n⏱️ Thời lượng: ${video.length?.simpleText || "N/A"}\n👤 Trình bày: ${video.channelTitle || "N/A"}`,
            attachment: audioReadStream
          },
          event.threadID
        );
      } catch (sendErr) {
        console.error("Error sending music attachment:", sendErr);
        try { fs.unlinkSync(filePath); } catch {}
      }
    });

    writer.on("error", (err) => {
      console.error("Writer error:", err);
      try { fs.unlinkSync(filePath); } catch {}
      api.sendMessage("❌ Đã có lỗi xảy ra khi lưu file nhạc.", event.threadID);
    });

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Không thể xử lý yêu cầu phát nhạc.", event.threadID, event.messageID);
  }
};

/* ===================== Helpers ===================== */

function formatDurationMs(ms) {
  if (!ms || isNaN(ms)) return "N/A";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function normalizeUrl(u) {
  if (!u) return null;
  if (u.startsWith("//")) return "https:" + u;
  if (u.startsWith("http://")) return u.replace("http://", "https://");
  return u;
}

function getThumbUrl(obj) {
  try {
    if (obj.thumbnail?.thumbnails?.length) {
      const arr = obj.thumbnail.thumbnails;
      const best = arr[arr.length - 1];
      return normalizeUrl(best.url || arr[0]?.url);
    }
  } catch {}
  try {
    if (obj.bestThumbnail?.url) return normalizeUrl(obj.bestThumbnail.url);
  } catch {}
  try {
    if (obj.thumbnails?.length) return normalizeUrl(obj.thumbnails[obj.thumbnails.length - 1].url);
  } catch {}
  try {
    if (obj.thumbnail?.url) return normalizeUrl(obj.thumbnail.url);
  } catch {}
  try {
    if (typeof obj.thumbnail === "string") return normalizeUrl(obj.thumbnail);
  } catch {}
  return null;
}

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = String(text || "").split(/\s+/);
  let line = "";
  let lines = [];
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + " " + words[i] : words[i];
    const m = ctx.measureText(test);
    if (m.width <= maxWidth) {
      line = test;
    } else {
      lines.push(line);
      line = words[i];
      if (lines.length === maxLines - 1) {
        let last = line;
        while (ctx.measureText(last + "…").width > maxWidth && last.length) {
          last = last.slice(0, -1);
        }
        lines.push(last + "…");
        break;
      }
    }
  }
  if (lines.length < maxLines && line) lines.push(line);

  lines.forEach((ln, idx) => {
    ctx.fillText(ln, x, y + idx * lineHeight);
  });
}

async function safeLoadImage(url) {
  if (!url) throw new Error("no url");
  return await loadImage(url);
}

/* =============== Canvas: Kết quả tìm kiếm =============== */
async function renderSearchCanvas(items, outPath) {
  const count = items.length;
  const cardH = 150;
  const gap = 16;
  const margin = 24;
  const width = 1200;
  const headerH = 0;
  const height = headerH + margin + count * (cardH + gap) + margin - gap;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Nền xanh đen cao cấp
  ctx.fillStyle = "#081023";
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < count; i++) {
    const item = items[i];
    const y = headerH + margin + i * (cardH + gap);

    const cardX = margin;
    const cardW = width - margin * 2;
    const radius = 18;

    // Glow nhẹ cho viền
    ctx.save();
    ctx.shadowColor = "rgba(0,255,255,0.6)";
    ctx.shadowBlur = 12;
    drawRoundedRectPath(ctx, cardX, y, cardW, cardH, radius);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fill();
    ctx.restore();

    // Viền neon cyan
    ctx.save();
    drawRoundedRectPath(ctx, cardX, y, cardW, cardH, radius);
    ctx.strokeStyle = "#00eaff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Thumbnail
    const thumbX = cardX + 18;
    const thumbY = y + 18;
    const thumbW = 240;
    const thumbH = 135 - 18;
    try {
      const turl = getThumbUrl(item);
      if (turl) {
        const img = await safeLoadImage(turl);
        drawRoundedRectPath(ctx, thumbX, thumbY, thumbW, thumbH, 12);
        ctx.save();
        ctx.clip();
        ctx.drawImage(img, thumbX, thumbY, thumbW, thumbH);
        ctx.restore();
      }
    } catch {}

    // Số thứ tự trong nút tròn viền neon
    const idxCx = thumbX + thumbW + 24;
    const idxCy = y + cardH / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(idxCx, idxCy, 20, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#00eaff";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(0,234,255,0.8)";
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#000";
    ctx.font = "bold 22px Sans";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), idxCx, idxCy);
    ctx.textAlign = "start";

    // Text thông tin bài hát
    const textX = idxCx + 28;
    const textW = cardX + cardW - textX - 18;
    const title = item.title || "No title";
    const channel = item.channelTitle || "Unknown";
    const duration = item?.length?.simpleText || "N/A";

    ctx.fillStyle = "#000000";
    ctx.font = "bold 26px Sans";
    drawWrappedText(ctx, title, textX, y + 50, textW, 32, 2);

    ctx.fillStyle = "#333333";
    ctx.font = "20px Sans";
    const meta = `${channel}  •  ${duration}`;
    drawWrappedText(ctx, meta, textX, y + 50 + 32 * 2 + 6, textW, 26, 1);
  }

  await new Promise((resolve) => {
    const out = fs.createWriteStream(outPath);
    canvas.createPNGStream().pipe(out);
    out.on("finish", resolve);
  });
}

/* =============== Canvas: Thẻ phát nhạc (blur + neon) =============== */
async function renderMusicCard(video, outPath) {
  const W = 1100, H = 560;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#070d1f";
  ctx.fillRect(0, 0, W, H);

  const bgUrl = getThumbUrl(video);
  if (bgUrl) {
    try {
      const bg = await safeLoadImage(bgUrl);
      const scale = Math.max(W / bg.width, H / bg.height);
      const bw = bg.width * scale;
      const bh = bg.height * scale;
      const bx = (W - bw) / 2;
      const by = (H - bh) / 2;

      ctx.save();
      try {
        ctx.filter = "blur(20px)";
      } catch (_) {}
      ctx.globalAlpha = 0.85;
      ctx.drawImage(bg, bx, by, bw, bh);
      ctx.restore();
    } catch {}
  }

  // Dark overlay
  ctx.fillStyle = "rgba(8, 16, 35, 0.72)";
  ctx.fillRect(0, 0, W, H);

  // Content card bo góc + viền neon
  const cx = 36, cy = 36, cw = W - 72, ch = H - 72, r = 26;
  ctx.save();
  drawRoundedRectPath(ctx, cx, cy, cw, ch, r);
  ctx.fillStyle = "rgba(10, 18, 40, 0.88)";
  ctx.fill();
  ctx.shadowColor = "rgba(0, 234, 255, 0.8)";
  ctx.shadowBlur = 18;
  ctx.strokeStyle = "#00eaff";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Bìa bài hát
  const coverX = cx + 32;
  const coverY = cy + 32;
  const coverW = 360;
  const coverH = 360 * 9 / 16 + 40;
  if (bgUrl) {
    try {
      const cover = await safeLoadImage(bgUrl);
      const targetH = 360;
      const targetW = targetH * (16 / 9);
      const drawW = Math.min(targetW, coverW);
      const drawH = Math.min(targetH, coverH);
      drawRoundedRectPath(ctx, coverX, coverY, drawW, drawH, 18);
      ctx.save();
      ctx.clip();
      ctx.drawImage(cover, coverX, coverY, drawW, drawH);
      ctx.restore();
    } catch {}
  }

  // Text thông tin
  const textX = coverX + 380;
  const textMaxW = cx + cw - textX - 32;

  ctx.fillStyle = "#eaffff";
  ctx.font = "bold 34px Sans";
  drawWrappedText(ctx, video.title || "Untitled", textX, cy + 84, textMaxW, 40, 2);

  ctx.fillStyle = "#b7c7d9";
  ctx.font = "22px Sans";
  const duration = video?.length?.simpleText || "N/A";
  const channel = video.channelTitle || "Unknown";
  drawWrappedText(ctx, `Kênh: ${channel}`, textX, cy + 84 + 40 * 2 + 10, textMaxW, 28, 1);
  drawWrappedText(ctx, `Thời lượng: ${duration}`, textX, cy + 84 + 40 * 2 + 10 + 30, textMaxW, 28, 1);

  // Thanh tiến trình phát
  const barX = textX;
  const barY = cy + ch - 110;
  const barW = Math.min(560, textMaxW);
  const barH = 10;

  drawRoundedRectPath(ctx, barX, barY, barW, barH, barH / 2);
  ctx.fillStyle = "#1b2a48";
  ctx.fill();

  const progress = Math.floor(barW * 0.35);
  drawRoundedRectPath(ctx, barX, barY, progress, barH, barH / 2);
  ctx.fillStyle = "#00eaff";
  ctx.shadowColor = "rgba(0,234,255,0.7)";
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#8fa6c6";
  ctx.font = "18px Sans";
  ctx.fillText("0:00", barX, barY + 26);
  ctx.textAlign = "right";
  ctx.fillText(duration, barX + barW, barY + 26);
  ctx.textAlign = "start";

  // Nút điều khiển neon
  const centerY = barY + 60;
  const gapBtn = 90;
  drawNeonButton(ctx, barX + 40, centerY, "⏮");
  drawNeonButton(ctx, barX + 40 + gapBtn, centerY, "▶");
  drawNeonButton(ctx, barX + 40 + gapBtn * 2, centerY, "⏭");

  // Credit dtb
  ctx.fillStyle = "#6fbfd6";
  ctx.font = "16px Sans";
  ctx.fillText("Cre: dtb", cx + cw - 110, cy + ch - 18);

  await new Promise((resolve) => {
    const out = fs.createWriteStream(outPath);
    canvas.createPNGStream().pipe(out);
    out.on("finish", resolve);
  });
}

function drawNeonButton(ctx, x, y, label) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 28, 0, Math.PI * 2);
  ctx.fillStyle = "#0a152d";
  ctx.fill();
  ctx.strokeStyle = "#00eaff";
  ctx.lineWidth = 3;
  ctx.shadowColor = "rgba(0,234,255,0.9)";
  ctx.shadowBlur = 14;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#00eaff";
  ctx.font = "22px Sans";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 1);
  ctx.restore();
}
