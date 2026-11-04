const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");

module.exports.config = {
  name: "taixiu",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "dtb",
  description: "Chơi tài xỉu canvas đẹp chuẩn casino",
  commandCategory: "Game",
  usages: "[tài/xỉu] [số tiền]",
  cooldowns: 5
};

// =================== VẼ XÚC XẮC ===================
function drawDie(ctx, x, y, size, value) {
  // khối xúc xắc
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 4;
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 16);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  const r = 7;
  const cx = x + size / 2;
  const cy = y + size / 2;
  const offset = size / 4;

  ctx.fillStyle = "#000";
  function dot(dx, dy) {
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (value === 1) dot(0, 0);
  if (value === 2) { dot(-offset, -offset); dot(offset, offset); }
  if (value === 3) { dot(-offset, -offset); dot(0, 0); dot(offset, offset); }
  if (value === 4) { dot(-offset, -offset); dot(offset, -offset); dot(-offset, offset); dot(offset, offset); }
  if (value === 5) { dot(-offset, -offset); dot(offset, -offset); dot(0, 0); dot(-offset, offset); dot(offset, offset); }
  if (value === 6) { dot(-offset, -offset); dot(offset, -offset); dot(-offset, 0); dot(offset, 0); dot(-offset, offset); dot(offset, offset); }
}

// =================== VẼ KẾT QUẢ ===================
async function drawResult(dice, total, result, outcome, balance) {
  const width = 550, height = 360;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // nền casino
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#3a1c71");
  gradient.addColorStop(0.5, "#d76d77");
  gradient.addColorStop(1, "#ffaf7b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // viền vàng
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // tiêu đề
  ctx.fillStyle = "#FFD700";
  ctx.font = "28px Arial Black";
  ctx.textAlign = "center";
  ctx.fillText("🎲 TÀI XỈU", width / 2, 45);

  // xúc xắc
  const size = 90;
  dice.forEach((d, i) => {
    drawDie(ctx, 80 + i * 140, 80, size, d);
  });

  // kết quả (to)
  ctx.font = "bold 72px Arial Black";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#000";
  ctx.strokeText(result.toUpperCase(), width / 2, 260);
  ctx.fillStyle = result === "tài" ? "#111" : "#fff";
  ctx.fillText(result.toUpperCase(), width / 2, 260);

  // tổng điểm
  ctx.fillStyle = "#FFD700";
  ctx.font = "26px Arial";
  ctx.fillText(`Tổng điểm: ${total}`, width / 2, 300);

  // outcome
  ctx.fillStyle = outcome === "thắng" ? "#00FF7F" : "#FF4444";
  ctx.font = "bold 28px Arial";
  ctx.fillText(outcome.toUpperCase(), width / 2, 335);

  // số dư
  ctx.fillStyle = "#00E5FF";
  ctx.font = "24px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`💰 Số dư: ${balance}$`, 30, height - 20);

  return canvas.toBuffer();
}

// =================== MAIN ===================
module.exports.run = async ({ api, event, args, Currencies, Users }) => {
  const { threadID, messageID, senderID } = event;

  if (args.length < 2) {
    return api.sendMessage("❌ Dùng: taixiu [tài/xỉu] [số tiền]", threadID, messageID);
  }

  const choice = args[0].toLowerCase();
  const bet = parseInt(args[1]);
  if (!["tài","xỉu"].includes(choice))
    return api.sendMessage("❌ Chỉ được chọn 'tài' hoặc 'xỉu'.", threadID, messageID);
  if (isNaN(bet) || bet <= 0)
    return api.sendMessage("❌ Số tiền cược không hợp lệ.", threadID, messageID);

  // tiền
  const userData = await Currencies.getData(senderID);
  const userMoney = userData.money;
  const userName = await Users.getNameUser(senderID);
  if (userMoney < bet)
    return api.sendMessage("💸 Bạn không đủ tiền để cược!", threadID, messageID);

  // xúc xắc
  const dice = [
    1 + Math.floor(Math.random() * 6),
    1 + Math.floor(Math.random() * 6),
    1 + Math.floor(Math.random() * 6)
  ];
  const total = dice.reduce((a,b)=>a+b,0);
  const result = total <= 10 ? "xỉu" : "tài";

  let outcome = "thua";
  let balance = userMoney;
  if (choice === result) {
    await Currencies.increaseMoney(senderID, bet);
    balance += bet;
    outcome = "thắng";
  } else {
    await Currencies.decreaseMoney(senderID, bet);
    balance -= bet;
  }

  // vẽ ảnh
  const img = await drawResult(dice, total, result, outcome, balance);
  const filePath = path.join(__dirname, "cache", `taixiu_${senderID}_${Date.now()}.png`);
  fs.writeFileSync(filePath, img);

  return api.sendMessage(
    {
      body: `🎲 ${userName} cược ${bet}$ vào ${choice.toUpperCase()}\n👉 Xúc xắc: ${dice.join(" - ")} (Tổng ${total} → ${result.toUpperCase()})\n📌 Kết quả: ${outcome.toUpperCase()}\n💰 Số dư hiện tại: ${balance}$`,
      attachment: fs.createReadStream(filePath)
    },
    threadID,
    () => fs.unlinkSync(filePath),
    messageID
  );
};
