const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");

module.exports.config = {
  name: "joinNoti",
  eventType: ["log:subscribe"],
  version: "2.0.1",
  credits: "nvh",
  description: "Gửi card chào mừng khi thành viên mới vào nhóm",
  dependencies: {}
};

const backgrounds = [
  "https://files.catbox.moe/248rbg.jpg",
  "https://files.catbox.moe/nnzniv.jpg",
  "https://files.catbox.moe/owmiz3.jpg",
  "https://files.catbox.moe/by4sla.jpg",
  "https://files.catbox.moe/8iubt6.jpg",
  "https://files.catbox.moe/1kv9e0.jpg",
  "https://files.catbox.moe/zs8cfv.jpg",
  "https://files.catbox.moe/gofxea.jpg"
];

function fillTextRainbowLetters(ctx, text, x, y, fontSize = 50, fontWeight = "bold", fontFamily = "Sans") {
  const colors = ["#FF4500", "#FFA500", "#32CD32", "#00CED1", "#1E90FF", "#8A2BE2", "#FF69B4"];
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

  let currX = x;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    ctx.fillStyle = colors[i % colors.length];
    ctx.shadowColor = colors[i % colors.length];
    ctx.shadowBlur = 15;
    ctx.fillText(char, currX, y);
    currX += ctx.measureText(char).width;
  }
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

async function createWelcomeCard({ name, threadName, memberCount, avatarBuffer }) {
  const canvas = createCanvas(1280, 600);
  const ctx = canvas.getContext("2d");

  // Background
  const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  const bg = await loadImage(bgUrl);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  // Khung nền
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  drawRoundedRect(ctx, 40, 80, 1200, 380, 35);

  // Avatar
  const avatar = await loadImage(`data:image/png;base64,${avatarBuffer.toString("base64")}`);
  const avatarX = 100, avatarY = 170, avatarSize = 180;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
  ctx.closePath();
  ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();

  // Text
  const welcomeText = "WELCOME ";
  const textX = 320, textY = 230;

  ctx.font = "bold 40px Sans";
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "#FFFFFF";
  ctx.shadowBlur = 12;
  ctx.fillText(welcomeText, textX, textY);

  fillTextRainbowLetters(ctx, name, textX + ctx.measureText(welcomeText).width, textY, 40);

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.font = "bold 29px Sans";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(`Là thành viên thứ ${memberCount} của nhóm ${threadName}`, textX, textY + 60);

  ctx.font = "28px Sans";
  ctx.fillText("Chúc bạn có những giây phút vui vẻ và ý nghĩa!", textX, textY + 110);

  const cardPath = path.join(__dirname, `./cache/join_${Date.now()}.png`);
  const out = fs.createWriteStream(cardPath);
  canvas.createPNGStream().pipe(out);

  return new Promise((resolve) => out.on("finish", () => resolve(cardPath)));
}

module.exports.run = async function ({ api, event }) {
  try {
    const statusFile = path.join(__dirname, "../../utils/joinstatus.json");
    if (!fs.existsSync(statusFile)) fs.writeFileSync(statusFile, JSON.stringify({}, null, 2));

    let data = JSON.parse(fs.readFileSync(statusFile, "utf8"));
    const { threadID } = event;

    if (!data[threadID]) {
      data[threadID] = { status: true };
      fs.writeFileSync(statusFile, JSON.stringify(data, null, 2));
    }

    if (!data[threadID].status) return;

    if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
      return api.sendMessage("✅ Bot đã vào nhóm! Gõ menu để xem lệnh.", threadID);
    }

    const { threadName, participantIDs } = await api.getThreadInfo(threadID);

    for (const p of event.logMessageData.addedParticipants) {
      try {
        const avatarUrl = `https://graph.facebook.com/${p.userFbId}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const response = await axios.get(avatarUrl, { responseType: "arraybuffer" });
        const avatarBuffer = Buffer.from(response.data, "binary");

        const cardPath = await createWelcomeCard({
          name: p.fullName,
          threadName,
          memberCount: participantIDs.length,
          avatarBuffer
        });

        await api.sendMessage({ attachment: fs.createReadStream(cardPath) }, threadID, () => {
          try { fs.unlinkSync(cardPath); } catch {}
        });
      } catch (err) {
        console.error("Lỗi khi tạo card:", err);
      }
    }
  } catch (error) {
    console.error("Lỗi joinNoti:", error);
  }
};