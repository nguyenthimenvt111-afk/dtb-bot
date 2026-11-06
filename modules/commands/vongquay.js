const fs = require("fs-extra");
const path = require("path");

let Canvas = null;
try {
  Canvas = require("@napi-rs/canvas");
} catch (_) {
  try {
    Canvas = require("canvas");
  } catch (_) {}
}

const cacheDir = path.join(__dirname, "cache");
fs.ensureDirSync(cacheDir);

// 12 ô vòng quay may mắn
const SLICES = [
  { label: "JACKPOT x10", mult: 10, color: "#f59e0b", textColor: "#000", weight: 2, desc: "Trúng Hũ Siêu Khủng x10!" },
  { label: "MẤT TRẮNG", mult: 0, color: "#374151", textColor: "#fff", weight: 12, desc: "Thua sạch tiền cược!" },
  { label: "GẤP ĐÔI x2", mult: 2, color: "#3b82f6", textColor: "#fff", weight: 16, desc: "Nhận x2 tiền cược!" },
  { label: "HÒA VỐN x1", mult: 1, color: "#10b981", textColor: "#fff", weight: 20, desc: "Bảo toàn số vốn ban đầu." },
  { label: "HỐ TỬ THẦN", mult: -0.2, color: "#dc2626", textColor: "#fff", weight: 8, desc: "Mất cược & phạt thêm 20%!" },
  { label: "THẮNG LỚN x3", mult: 3, color: "#8b5cf6", textColor: "#fff", weight: 10, desc: "Nhận x3 tiền cược!" },
  { label: "AN ỦI x0.5", mult: 0.5, color: "#64748b", textColor: "#fff", weight: 12, desc: "Hoàn lại 50% tiền cược." },
  { label: "ĐẠI THẮNG x5", mult: 5, color: "#ec4899", textColor: "#fff", weight: 6, desc: "Đại thắng x5 tiền cược!" },
  { label: "GẤP ĐÔI x2", mult: 2, color: "#3b82f6", textColor: "#fff", weight: 16, desc: "Nhận x2 tiền cược!" },
  { label: "MẤT TRẮNG", mult: 0, color: "#1f2937", textColor: "#fff", weight: 12, desc: "Thua sạch tiền cược!" },
  { label: "THẮNG NHẸ x1.5", mult: 1.5, color: "#06b6d4", textColor: "#000", weight: 18, desc: "Nhận x1.5 tiền cược!" },
  { label: "HÒA VỐN x1", mult: 1, color: "#10b981", textColor: "#fff", weight: 18, desc: "Bảo toàn số vốn ban đầu." }
];

function spinWheel() {
  const totalWeight = SLICES.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < SLICES.length; i++) {
    if (rand < SLICES[i].weight) {
      return { index: i, slice: SLICES[i] };
    }
    rand -= SLICES[i].weight;
  }
  return { index: 0, slice: SLICES[0] };
}

// Vẽ Bánh Xe May Mắn Casino
async function renderWheelCard(userName, winningIndex, winningSlice, bet, diffMoney, balance) {
  if (!Canvas || !Canvas.createCanvas) return null;
  const width = 850;
  const height = 500;
  const cvs = Canvas.createCanvas(width, height);
  const ctx = cvs.getContext("2d");

  // Nền Casino Cyber Dark
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#090d16");
  bg.addColorStop(0.5, "#15102a");
  bg.addColorStop(1, "#0a0718");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Viền Neon Vàng Gold
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 3;
  ctx.strokeRect(15, 15, width - 30, height - 30);

  // 1. Vẽ Bánh Xe Vòng Quay (Bên trái: cx = 250, cy = 250, r = 180)
  const cx = 250, cy = 250, radius = 180;
  const totalSlices = SLICES.length;
  const anglePerSlice = (2 * Math.PI) / totalSlices;

  // Tính góc quay sao cho ô trúng thưởng dừng ở đỉnh (góc -PI/2)
  const targetAngle = -Math.PI / 2 - (winningIndex + 0.5) * anglePerSlice;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(targetAngle);

  for (let i = 0; i < totalSlices; i++) {
    const startAngle = i * anglePerSlice;
    const endAngle = startAngle + anglePerSlice;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = SLICES[i].color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nhãn chữ trên từng nan quạt
    ctx.save();
    ctx.rotate(startAngle + anglePerSlice / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = SLICES[i].textColor;
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(SLICES[i].label, radius - 15, 5);
    ctx.restore();
  }
  ctx.restore();

  // Tâm Bánh Xe (Center Hub)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0, Math.PI * 2);
  const hubGrad = ctx.createLinearGradient(cx - 38, cy - 38, cx + 38, cy + 38);
  hubGrad.addColorStop(0, "#f59e0b");
  hubGrad.addColorStop(1, "#b45309");
  ctx.fillStyle = hubGrad;
  ctx.shadowColor = "#f59e0b";
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SPIN", cx, cy);
  ctx.restore();

  // Kim chỉ giải thưởng (Pointer ở đỉnh bánh xe)
  ctx.save();
  ctx.fillStyle = "#ef4444";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy - radius - 8);
  ctx.lineTo(cx + 14, cy - radius - 8);
  ctx.lineTo(cx, cy - radius + 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 2. Bảng Kết Quả (Bên phải: x: 470, y: 50, w: 340, h: 400)
  const panelX = 470, panelY = 50, panelW = 345, panelH = 400;
  ctx.fillStyle = "rgba(20, 24, 45, 0.85)";
  ctx.strokeStyle = winningSlice.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);
  ctx.fillRect(panelX, panelY, panelW, panelH);

  // Tiêu đề bảng
  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🎡 VÒNG QUAY MAY MẮN 🎡", panelX + panelW / 2, panelY + 45);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "16px sans-serif";
  ctx.fillText(`Người chơi: ${userName}`, panelX + panelW / 2, panelY + 85);

  // Ô kết quả trúng
  ctx.fillStyle = winningSlice.color;
  ctx.font = "bold 26px sans-serif";
  ctx.shadowColor = winningSlice.color;
  ctx.shadowBlur = 12;
  ctx.fillText(winningSlice.label, panelX + panelW / 2, panelY + 150);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px sans-serif";
  ctx.fillText(winningSlice.desc, panelX + panelW / 2, panelY + 185);

  // Thống kê cược & Thưởng
  const isWin = diffMoney > 0;
  const isDraw = diffMoney === 0;

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "16px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`💵 Cược: ${bet.toLocaleString()}$`, panelX + 35, panelY + 240);

  ctx.fillStyle = isWin ? "#22c55e" : isDraw ? "#38bdf8" : "#ef4444";
  ctx.font = "bold 18px sans-serif";
  const diffSign = diffMoney > 0 ? "+" : "";
  ctx.fillText(`🎁 Biến động: ${diffSign}${diffMoney.toLocaleString()}$`, panelX + 35, panelY + 280);

  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(`💰 Số dư: ${balance.toLocaleString()}$`, panelX + 35, panelY + 325);

  ctx.fillStyle = "#64748b";
  ctx.font = "italic 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("⚡ POWERED BY DTB BOT SYSTEM ⚡", panelX + panelW / 2, panelY + panelH - 22);

  const cardPath = path.join(cacheDir, `wheel_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`);
  fs.writeFileSync(cardPath, cvs.toBuffer("image/png"));
  return cardPath;
}

module.exports.config = {
  name: "vongquay",
  version: "1.0.0",
  credits: "dtb",
  hasPermssion: 0,
  hasPermission: 0,
  description: "Vòng quay may mắn casino: quay trúng Jackpot x10, x5, x3 tiền cược kèm hình ảnh bánh xe neon",
  commandCategory: "Trò Chơi",
  usages: "vongquay [số tiền cược]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args, Currencies, Users }) {
  const { threadID, messageID, senderID } = event;
  const prefix = (global.data.threadData.get(String(threadID)) || {}).PREFIX || global.config.PREFIX;

  if (!args[0]) {
    return api.sendMessage(
`╔═════════════════════════╗
   🎡 VÒNG QUAY MAY MẮN 🎡
╚═════════════════════════╝
👉 Thử vận may trúng Jackpot gấp 10 lần tiền cược!
──────────────────────────
📌 Bảng tỷ lệ giải thưởng:
🌟 JACKPOT : Gấp 10 lần cược (x10)
💎 ĐẠI THẮNG : Gấp 5 lần cược (x5)
🥇 THẮNG LỚN : Gấp 3 lần cược (x3)
🥈 GẤP ĐÔI : Gấp 2 lần cược (x2)
🥉 THẮNG NHẸ : Gấp 1.5 lần cược (x1.5)
🛡️ HÒA VỐN : Hoàn 100% tiền cược (x1)
💸 AN ỦI : Hoàn 50% tiền cược (x0.5)
💣 MẤT TRẮNG : Thua sạch tiền cược (x0)
☠️ HỐ TỬ THẦN : Mất cược + phạt 20%
──────────────────────────
👉 Cú pháp: "${prefix}vongquay [số tiền cược]"
Ví dụ: "${prefix}vongquay 5000"`,
      threadID,
      messageID
    );
  }

  const bet = parseInt(args[0]);
  if (isNaN(bet) || bet < 100) {
    return api.sendMessage("❌ Mức cược tối thiểu là 100$ và phải là số nguyên dương!", threadID, messageID);
  }

  const userMoney = (await Currencies.getData(senderID)).money || 0;
  if (userMoney < bet) {
    return api.sendMessage(`💸 Bạn không đủ tiền! Số dư của bạn hiện có ${userMoney.toLocaleString()}$, thiếu ${(bet - userMoney).toLocaleString()}$ để cược!`, threadID, messageID);
  }

  // Quay số ngẫu nhiên
  const spinResult = spinWheel();
  const { index, slice } = spinResult;

  let diffMoney = 0;
  if (slice.mult > 1) {
    diffMoney = Math.round(bet * (slice.mult - 1));
    await Currencies.increaseMoney(senderID, diffMoney);
  } else if (slice.mult === 1) {
    diffMoney = 0;
  } else if (slice.mult >= 0) {
    diffMoney = -Math.round(bet * (1 - slice.mult));
    await Currencies.decreaseMoney(senderID, Math.abs(diffMoney));
  } else {
    // Hố tử thần: mất cược + 20%
    diffMoney = -Math.round(bet * 1.2);
    await Currencies.decreaseMoney(senderID, Math.abs(diffMoney));
  }

  const balance = (await Currencies.getData(senderID)).money;
  const userName = await Users.getNameUser(senderID) || "Người chơi";

  let cardPath = null;
  try {
    cardPath = await renderWheelCard(userName, index, slice, bet, diffMoney, balance);
  } catch (e) {
    console.error("[vongquay] Lỗi vẽ card:", e);
  }

  const diffSign = diffMoney > 0 ? "+" : "";
  const resultMsg = 
`🎡 [ KẾT QUẢ VÒNG QUAY MAY MẮN ]
👤 Người chơi: ${userName}
💵 Tiền cược: ${bet.toLocaleString()}$
──────────────────────────
🎯 Bánh xe dừng tại ô: 【 ${slice.label} 】
✨ Hiệu ứng: ${slice.desc}
💰 Biến động tài sản: ${diffSign}${diffMoney.toLocaleString()}$
💵 Số dư tài khoản mới: ${balance.toLocaleString()}$
Chúc bạn may mắn hơn ở những vòng quay tiếp theo! 🌟`;

  const payload = { body: resultMsg };
  if (cardPath && fs.existsSync(cardPath)) {
    payload.attachment = fs.createReadStream(cardPath);
  }

  return api.sendMessage(payload, threadID, (err) => {
    setTimeout(() => {
      try { if (cardPath && fs.existsSync(cardPath)) fs.unlinkSync(cardPath); } catch (_) {}
    }, 15000);
  }, messageID);
};
