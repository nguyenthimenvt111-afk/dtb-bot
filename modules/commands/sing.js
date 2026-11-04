const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Youtube = require("youtube-search-api");
const https = require("https");
const { createCanvas, loadImage } = require("canvas");

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

module.exports.config = {
  name: "sing",
  version: "4.2.0",
  hasPermission: 0,
  credits: "dtb",
  description: "Tìm và tải bài hát từ YouTube",
  commandCategory: "Tiện ích",
  usages: "[tên bài hát]",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const keyword = args.join(" ");
  if (!keyword) return api.sendMessage("❌ Vui lòng nhập tên bài hát.", event.threadID, event.messageID);

  try {
    const searchResults = await Youtube.GetListByKeyword(keyword, false, 5);
    const items = (searchResults && searchResults.items) ? searchResults.items : [];
    if (items.length === 0) {
      return api.sendMessage("❌ Không tìm thấy bài hát nào phù hợp.", event.threadID, event.messageID);
    }

    const imgPath = path.join(__dirname, "cache", `search_${event.senderID}_${Date.now()}.png`);
    await renderSearchCanvas(items, imgPath);

    // Gửi chỉ ảnh (không body)
    api.sendMessage(
      { attachment: fs.createReadStream(imgPath) },
      event.threadID,
      (err, info) => {
        if (err) console.error(err);
        try { fs.unlinkSync(imgPath); } catch {}
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: event.senderID,
          results: items
        });
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
    return api.sendMessage("❌ Vui lòng chọn một số hợp lệ trong danh sách (1–5).", event.threadID, event.messageID);
  }

  const video = results[choice - 1];
  const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
  const apiUrl = `https://lunarkrystal.qzz.io/api/ytmp3?url=${encodeURIComponent(videoUrl)}`;

  try {
    const metadataRes = await fetchUntilReady(apiUrl);
    if (!metadataRes || !metadataRes.link) {
      return api.sendMessage("❌ Không thể tải bài hát này.", event.threadID, event.messageID);
    }

    // Ảnh thông tin nhạc (blur + neon + nút)
    const imgPath = path.join(__dirname, "cache", `${video.id}_${Date.now()}.png`);
    await renderMusicCard(video, imgPath);

    // Gửi chỉ ảnh (không body)
    api.sendMessage(
      { attachment: fs.createReadStream(imgPath) },
      event.threadID,
      () => { try { fs.unlinkSync(imgPath); } catch {} },
      event.messageID
    );

    // Tải mp3 và gửi riêng
    const filePath = path.join(__dirname, "cache", `${video.id}.mp3`);
    const writer = fs.createWriteStream(filePath);

    const download = await axios({
      method: "get",
      url: metadataRes.link,
      responseType: "stream",
      httpsAgent,
      timeout: 120000
    });

    download.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage(
        { attachment: fs.createReadStream(filePath) },
        event.threadID,
        () => { try { fs.unlinkSync(filePath); } catch {} }
      );
    });

    writer.on("error", () => {
      try { fs.unlinkSync(filePath); } catch {}
      api.sendMessage("❌ Lỗi khi tải nhạc.", event.threadID);
    });

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Không thể xử lý yêu cầu.", event.threadID, event.messageID);
  }
};

/* ===================== Helpers ===================== */

function normalizeUrl(u) {
  if (!u) return null;
  if (u.startsWith("//")) return "https:" + u;
  if (u.startsWith("http://")) return u.replace("http://", "https://");
  return u;
}

function getThumbUrl(obj) {
  // Thử lấy thumbnail tốt nhất từ nhiều nhánh
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
        // Ellipsis cho dòng cuối
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
  const cardH = 150;      // chiều cao mỗi card
  const gap = 16;         // khoảng cách giữa card
  const margin = 24;      // lề
  const width = 1200;     // rộng tổng
  const headerH = 0;      // không vẽ text header để đỡ rối
  const height = headerH + margin + count * (cardH + gap) + margin - gap;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Nền xanh đen
  ctx.fillStyle = "#081023";
  ctx.fillRect(0, 0, width, height);

  // Lặp tạo card
  for (let i = 0; i < count; i++) {
    const item = items[i];
    const y = headerH + margin + i * (cardH + gap);

    // Card sáng (chữ đen)
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

    // Viền neon
    ctx.save();
    drawRoundedRectPath(ctx, cardX, y, cardW, cardH, radius);
    ctx.strokeStyle = "#00eaff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Thumbnail (16:9)
    const thumbX = cardX + 18;
    const thumbY = y + 18;
    const thumbW = 240;
    const thumbH = 135 - 18; // ~117
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

    ctx.fillStyle = "#000"; // chữ đen
    ctx.font = "bold 22px Sans";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), idxCx, idxCy);
    ctx.textAlign = "start"; // reset

    // Vùng text
    const textX = idxCx + 28;
    const textW = cardX + cardW - textX - 18;
    const title = item.title || "No title";
    const channel = item.channelTitle || "Unknown";
    const duration = item?.length?.simpleText || "N/A";

    // Tiêu đề (đậm, bọc 2 dòng)
    ctx.fillStyle = "#000000";
    ctx.font = "bold 26px Sans";
    drawWrappedText(ctx, title, textX, y + 50, textW, 32, 2);

    // Kênh + thời lượng
    ctx.fillStyle = "#333";
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

/* =============== Canvas: Thẻ nhạc phát (blur + neon) =============== */
async function renderMusicCard(video, outPath) {
  const W = 1100, H = 560;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // --- BG: dùng thumbnail làm nền + blur + phủ tối ---
  ctx.fillStyle = "#070d1f";
  ctx.fillRect(0, 0, W, H);

  const bgUrl = getThumbUrl(video);
  if (bgUrl) {
    try {
      const bg = await safeLoadImage(bgUrl);
      // phủ đầy nền
      const scale = Math.max(W / bg.width, H / bg.height);
      const bw = bg.width * scale;
      const bh = bg.height * scale;
      const bx = (W - bw) / 2;
      const by = (H - bh) / 2;

      // Blur nếu hỗ trợ, fallback nếu không
      try {
        ctx.save();
        ctx.filter = "blur(20px)";
        ctx.globalAlpha = 0.9;
        ctx.drawImage(bg, bx, by, bw, bh);
        ctx.restore();
      } catch {
        // fallback: không blur, chỉ vẽ rồi phủ lớp tối
        ctx.drawImage(bg, bx, by, bw, bh);
      }
    } catch {}
  }

  // Lớp tối để nổi nội dung
  ctx.fillStyle = "rgba(8, 16, 35, 0.70)";
  ctx.fillRect(0, 0, W, H);

  // --- Content card bo góc + viền neon ---
  const cx = 36, cy = 36, cw = W - 72, ch = H - 72, r = 26;
  ctx.save();
  drawRoundedRectPath(ctx, cx, cy, cw, ch, r);
  ctx.fillStyle = "rgba(10, 18, 40, 0.85)";
  ctx.fill();
  ctx.shadowColor = "rgba(0, 234, 255, 0.8)";
  ctx.shadowBlur = 18;
  ctx.strokeStyle = "#00eaff";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // --- Bìa nhạc (bo góc) ---
  const thumbUrl = getThumbUrl(video);
  const coverX = cx + 32;
  const coverY = cy + 32;
  const coverW = 360;
  const coverH = 360 * 9 / 16 + 40; // hơi cao để cân đối, vẫn trong khung
  try {
    if (thumbUrl) {
      const cover = await safeLoadImage(thumbUrl);
      const targetH = 360; // hiển thị 360px cao thực
      const targetW = targetH * (16 / 9);
      const drawW = Math.min(targetW, coverW);
      const drawH = Math.min(targetH, coverH);
      drawRoundedRectPath(ctx, coverX, coverY, drawW, drawH, 18);
      ctx.save();
      ctx.clip();
      ctx.drawImage(cover, coverX, coverY, drawW, drawH);
      ctx.restore();
    }
  } catch {}

  // --- Text thông tin ---
  const textX = coverX + 380;
  const textMaxW = cx + cw - textX - 32;

  // Title
  ctx.fillStyle = "#eaffff";
  ctx.font = "bold 34px Sans";
  drawWrappedText(ctx, video.title || "Untitled", textX, cy + 84, textMaxW, 40, 2);

  // Channel + duration
  ctx.fillStyle = "#b7c7d9";
  ctx.font = "22px Sans";
  const duration = video?.length?.simpleText || "N/A";
  const channel = video.channelTitle || "Unknown";
  drawWrappedText(ctx, `Kênh: ${channel}`, textX, cy + 84 + 40 * 2 + 10, textMaxW, 28, 1);
  drawWrappedText(ctx, `Thời lượng: ${duration}`, textX, cy + 84 + 40 * 2 + 10 + 30, textMaxW, 28, 1);

  // --- Thanh progress ---
  const barX = textX;
  const barY = cy + ch - 110;
  const barW = Math.min(560, textMaxW);
  const barH = 10;

  // Track
  drawRoundedRectPath(ctx, barX, barY, barW, barH, barH / 2);
  ctx.fillStyle = "#1b2a48";
  ctx.fill();

  // Progress giả định 30%
  const progress = Math.floor(barW * 0.3);
  drawRoundedRectPath(ctx, barX, barY, progress, barH, barH / 2);
  ctx.fillStyle = "#00eaff";
  ctx.shadowColor = "rgba(0,234,255,0.7)";
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Time text
  ctx.fillStyle = "#8fa6c6";
  ctx.font = "18px Sans";
  ctx.fillText("0:00", barX, barY + 26);
  ctx.textAlign = "right";
  ctx.fillText(duration, barX + barW, barY + 26);
  ctx.textAlign = "start";

  // --- Nút điều khiển neon ---
  const centerY = barY + 60;
  const gap = 90;
  drawNeonButton(ctx, barX + 40, centerY, "⏮");
  drawNeonButton(ctx, barX + 40 + gap, centerY, "▶");
  drawNeonButton(ctx, barX + 40 + gap * 2, centerY, "⏭");

  // Credit nhỏ
  ctx.fillStyle = "#6fbfd6";
  ctx.font = "16px Sans";
  ctx.fillText("Cre: genfor", cx + cw - 110, cy + ch - 18);

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

/* =============== Retry API =============== */
async function fetchUntilReady(apiUrl, tries = 5, delay = 2000) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await axios.get(apiUrl, { httpsAgent, timeout: 15000 });
      if (res?.data?.link) return res.data;
    } catch {}
    await new Promise(r => setTimeout(r, delay));
  }
  return null;
}
