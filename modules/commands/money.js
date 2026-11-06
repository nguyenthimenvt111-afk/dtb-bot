const fs = require('fs-extra');
const path = require('path');

let Canvas = null;
try {
  Canvas = require("@napi-rs/canvas");
} catch (_) {
  try {
    Canvas = require("canvas");
  } catch (_) {}
}

module.exports.config = {
  name: "money",
  version: "2.0.0",
  hasPermssion: 0,
  hasPermission: 0,
  credits: "dtb",
  description: "Kiểm tra số dư tài khoản/ví tiền của bạn hoặc người được tag/reply",
  commandCategory: "Tiện ích",
  usages: "money [@tag / reply]",
  cooldowns: 3
};

function formatNumber(num) {
  return Math.floor(Number(num) || 0).toLocaleString("vi-VN");
}

module.exports.run = async function ({ api, event, args, Currencies, Users }) {
  const { threadID, messageID, senderID, mentions } = event;

  let targetID = senderID;
  if (event.type === "message_reply") {
    targetID = event.messageReply.senderID;
  } else if (mentions && Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  }

  const userData = (await Users.getData(targetID)) || {};
  const name = userData.name || (await Users.getNameUser(targetID)) || "Người dùng";
  const userMoney = (await Currencies.getData(targetID)) || {};
  const money = userMoney.money || 0;
  const formatted = formatNumber(money);

  // Try Canvas Card
  if (Canvas && Canvas.createCanvas) {
    try {
      const width = 800;
      const height = 400;
      const canvas = Canvas.createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#0b0f19");
      bgGrad.addColorStop(0.5, "#151c2e");
      bgGrad.addColorStop(1, "#070a12");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Card frame
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      // Header glow
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 26px Arial, sans-serif";
      ctx.fillText("💳 THẺ TÀI KHOẢN DTB PAY", 50, 70);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "18px Arial, sans-serif";
      ctx.fillText("SYSTEM FINANCIAL NETWORK", 50, 100);

      // Chip icon simulation
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(50, 130, 60, 45);
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(50, 130, 60, 45);

      // User info
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "bold 20px Arial, sans-serif";
      ctx.fillText("CHỦ TÀI KHOẢN", 50, 225);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Arial, sans-serif";
      ctx.fillText(name.toUpperCase(), 50, 260);

      // UID
      ctx.fillStyle = "#64748b";
      ctx.font = "16px Arial, sans-serif";
      ctx.fillText(`UID: ${targetID}`, 50, 290);

      // Balance
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 20px Arial, sans-serif";
      ctx.fillText("SỐ DƯ HIỆN CÓ", 420, 225);

      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 38px Arial, sans-serif";
      ctx.fillText(`${formatted} $`, 420, 268);

      // Footer
      ctx.fillStyle = "#475569";
      ctx.font = "14px Arial, sans-serif";
      ctx.fillText("POWERED BY DTB BOT SYSTEM • VALID THRU 12/99", 50, 350);

      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const tempPath = path.join(cacheDir, `money_${targetID}_${Date.now()}.png`);
      fs.writeFileSync(tempPath, canvas.toBuffer("image/png"));

      return api.sendMessage(
        {
          body: `💳 [ VÍ TIỀN CÁ NHÂN ]\n👤 Chủ ví: ${name}\n💰 Số dư: ${formatted}$\n🆔 UID: ${targetID}`,
          attachment: fs.createReadStream(tempPath)
        },
        threadID,
        () => {
          try {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          } catch (_) {}
        },
        messageID
      );
    } catch (_) {}
  }

  // Fallback text
  return api.sendMessage(
    `╔═════════════════════════╗\n` +
    `   💳 VÍ TIỀN CÁ NHÂN 💳\n` +
    `╚═════════════════════════╝\n` +
    `👤 Chủ ví: ${name}\n` +
    `💰 Số dư : ${formatted} $\n` +
    `🆔 UID   : ${targetID}\n` +
    `─────────────────────────\n` +
    `💡 Dùng /pay để chuyển tiền hoặc /bank để gửi ngân hàng sinh lãi!`,
    threadID,
    messageID
  );
};
