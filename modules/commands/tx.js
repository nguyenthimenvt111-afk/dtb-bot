const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

const historyFile = path.join(__dirname, "cache/taixiu_history.json");
const transFile = path.join(__dirname, "cache/taixiu_transactions.json");

module.exports.config = {
  name: "tx",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "dtb",
  description: "Chơi tài xỉu + lịch sử cầu/giao dịch/số dư",
  commandCategory: "Game",
  usages: "[tài/xỉu] [số tiền] | history | log | top",
  cooldowns: 5
};

function loadJSON(file, defaultVal) {
  try { return fs.readJsonSync(file); }
  catch { return defaultVal; }
}

function saveJSON(file, data) {
  fs.writeJsonSync(file, data, { spaces: 2 });
}

// =================== VẼ CANVAS ===================
async function drawHistory(history, transactions, balances) {
  const width = 1200, height = 700;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // nền
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#FFD700";
  ctx.font = "28px Arial";
  ctx.fillText("🎲 LỊCH SỬ CẦU", 30, 40);

  // vẽ 20 kết quả gần nhất
  let last20 = history.slice(-20);
  let r = 20, gap = 15;
  last20.forEach((res, i) => {
    let x = 40 + i * (r * 2 + gap);
    let y = 80;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = res === "tài" ? "#27ae60" : "#e74c3c"; // xanh/đỏ
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "18px Arial";
    ctx.fillText(res === "tài" ? "T" : "X", x - 7, y + 6);
  });

  // lịch sử giao dịch
  ctx.fillStyle = "#FFD700";
  ctx.font = "28px Arial";
  ctx.fillText("📑 LỊCH SỬ GIAO DỊCH", 30, 160);

  ctx.font = "16px Arial";
  let startY = 200;
  transactions.slice(-10).reverse().forEach((t, i) => {
    let y = startY + i * 28;
    ctx.fillStyle = "#ccc";
    ctx.fillText(`[${t.time}] ${t.user}`, 40, y);
    ctx.fillStyle = "#fff";
    ctx.fillText(`Cược ${t.choice} ${t.bet}$`, 300, y);
    ctx.fillStyle = t.outcome === "thắng" ? "#27ae60" : "#e74c3c";
    ctx.fillText(t.outcome.toUpperCase(), 500, y);
    ctx.fillStyle = "#fff";
    ctx.fillText(`Số dư: ${t.balance}$`, 650, y);
  });

  // top số dư
  ctx.fillStyle = "#FFD700";
  ctx.font = "28px Arial";
  ctx.fillText("🏆 TOP NGƯỜI CHƠI", 30, 540);

  ctx.font = "18px Arial";
  balances.slice(0, 5).forEach((b, i) => {
    let y = 580 + i * 26;
    ctx.fillStyle = "#fff";
    ctx.fillText(`${i+1}. ${b.user}`, 40, y);
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`${b.balance}$`, 300, y);
  });

  return canvas.toBuffer();
}

// =================== MAIN ===================
module.exports.run = async ({ api, event, args, Currencies, Users }) => {
  const { threadID, messageID, senderID } = event;

  // load dữ liệu
  let history = loadJSON(historyFile, []);
  let transactions = loadJSON(transFile, []);

  // ============ LỆNH PHỤ ============
  if (["history","log","top"].includes(args[0])) {
    // gom số dư từ lịch sử
    let latest = {};
    for (let t of transactions) latest[t.userID] = t;
    let balances = Object.values(latest).sort((a,b)=>b.balance - a.balance);

    let img = await drawHistory(history, transactions, balances);
    let filePath = path.join(__dirname, "cache/taixiu_canvas.png");
    fs.writeFileSync(filePath, img);
    return api.sendMessage({
      body: "📊 Thống kê tài xỉu",
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), messageID);
  }

  // ============ CƯỢC ============
  if (args.length < 2) {
    return api.sendMessage("❌ Dùng: taixiu [tài/xỉu] [số tiền]", threadID, messageID);
  }

  const choice = args[0].toLowerCase();
  const bet = parseInt(args[1]);
  if (!["tài","xỉu"].includes(choice)) return api.sendMessage("❌ Chỉ được chọn 'tài' hoặc 'xỉu'.", threadID, messageID);
  if (isNaN(bet) || bet <= 0) return api.sendMessage("❌ Số tiền cược không hợp lệ.", threadID, messageID);

  // kiểm tra tiền
  const userData = await Currencies.getData(senderID);
  const userMoney = userData.money;
  const userName = await Users.getNameUser(senderID);
  if (userMoney < bet) return api.sendMessage("💸 Bạn không đủ tiền để cược!", threadID, messageID);

  // roll xúc xắc
  const dice = [1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)];
  const total = dice.reduce((a,b)=>a+b,0);
  const result = total <= 10 ? "xỉu" : "tài";

  let outcome = "thua";
  let msg = `🎲 Kết quả: ${dice.join(" - ")} (tổng ${total} → ${result.toUpperCase()})\n`;
  if (choice === result) {
    await Currencies.increaseMoney(senderID, bet);
    outcome = "thắng";
    msg += `✅ Bạn đã thắng +${bet}$`;
  } else {
    await Currencies.decreaseMoney(senderID, bet);
    outcome = "thua";
    msg += `❌ Bạn đã thua -${bet}$`;
  }

  // cập nhật lịch sử cầu
  history.push(result);
  if (history.length > 100) history.shift();
  saveJSON(historyFile, history);

  // cập nhật giao dịch
  const balanceNow = (await Currencies.getData(senderID)).money;
  transactions.push({
    time: new Date().toLocaleTimeString(),
    user: userName,
    userID: senderID,
    choice,
    bet,
    result,
    outcome,
    balance: balanceNow
  });
  if (transactions.length > 200) transactions.shift();
  saveJSON(transFile, transactions);

  return api.sendMessage(msg, threadID, messageID);
};
