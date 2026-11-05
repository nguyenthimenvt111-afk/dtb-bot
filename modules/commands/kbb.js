const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");

module.exports.config = {
    name: "kbb",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Kéo búa bao (Oẳn tù tì) đồ họa Canvas",
    commandCategory: "Trò Chơi",
    usages: "[kéo/búa/bao] [số tiền cược]",
    cooldowns: 2
};

const itemEmojis = { "kéo": "✌️", "búa": "👊", "bao": "✋" };

async function drawKBBMatch(userChoice, botChoice, outcome, bet, balance) {
    const width = 620, height = 350;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Arena background gradient
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#10162f");
    bg.addColorStop(0.5, "#20183b");
    bg.addColorStop(1, "#0f1026");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Frame
    ctx.strokeStyle = "#00D2FF";
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Title
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 26px Arial";
    ctx.textAlign = "center";
    ctx.fillText("⚔️ OẰN TÙ TÌ ĐỐI KHÁNG ⚔️", width / 2, 45);

    // Player Box (Left)
    const pX = 50, pY = 80, boxW = 200, boxH = 170;
    ctx.fillStyle = "rgba(0, 150, 255, 0.15)";
    ctx.fillRect(pX, pY, boxW, boxH);
    ctx.strokeStyle = "#3A86FF";
    ctx.lineWidth = 3;
    ctx.strokeRect(pX, pY, boxW, boxH);

    ctx.fillStyle = "#3A86FF";
    ctx.font = "bold 20px Arial";
    ctx.fillText("BẠN", pX + boxW / 2, pY + 30);
    ctx.font = "60px 'Segoe UI Emoji', Arial";
    ctx.fillText(itemEmojis[userChoice] || "❓", pX + boxW / 2, pY + 105);
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(userChoice.toUpperCase(), pX + boxW / 2, pY + 150);

    // VS Center Badge
    ctx.fillStyle = "#FF007F";
    ctx.font = "bold 38px Arial Black";
    ctx.fillText("VS", width / 2, pY + 95);

    // Bot Box (Right)
    const bX = 370;
    ctx.fillStyle = "rgba(255, 0, 100, 0.15)";
    ctx.fillRect(bX, pY, boxW, boxH);
    ctx.strokeStyle = "#FF006E";
    ctx.lineWidth = 3;
    ctx.strokeRect(bX, pY, boxW, boxH);

    ctx.fillStyle = "#FF006E";
    ctx.font = "bold 20px Arial";
    ctx.fillText("BOT", bX + boxW / 2, pY + 30);
    ctx.font = "60px 'Segoe UI Emoji', Arial";
    ctx.fillText(itemEmojis[botChoice] || "❓", bX + boxW / 2, pY + 105);
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(botChoice.toUpperCase(), bX + boxW / 2, pY + 150);

    // Outcome text
    ctx.font = "bold 28px Arial";
    if (outcome === "thắng") {
        ctx.fillStyle = "#00FF7F";
        ctx.fillText("🏆 BẠN THẮNG CƯỢC! 🏆", width / 2, 290);
    } else if (outcome === "thua") {
        ctx.fillStyle = "#FF4500";
        ctx.fillText("💀 BẠN ĐÃ THUA! 💀", width / 2, 290);
    } else {
        ctx.fillStyle = "#FFD700";
        ctx.fillText("🤝 HAI BÊN HÒA NHAU! 🤝", width / 2, 290);
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "#E0E0E0";
    ctx.fillText(`Tiền cược: ${bet.toLocaleString()}$ | Số dư hiện tại: ${balance.toLocaleString()}$`, width / 2, 325);

    return canvas.toBuffer("image/png");
}

module.exports.run = async function({ api, event, args, Currencies, Users }) {
    const { threadID, messageID, senderID } = event;
    const validChoices = ["kéo", "búa", "bao"];

    if (!args[0]) return api.sendMessage("➜ Dùng: /kbb [kéo/búa/bao] [số tiền cược]", threadID, messageID);

    let userChoice = args[0].toLowerCase();
    if (userChoice === "keo") userChoice = "kéo";
    if (userChoice === "bua") userChoice = "búa";

    if (!validChoices.includes(userChoice)) {
        return api.sendMessage("➜ Lựa chọn không hợp lệ! Chỉ được chọn: kéo, búa hoặc bao.", threadID, messageID);
    }

    const bet = parseInt(args[1]);
    if (isNaN(bet) || bet < 50) {
        return api.sendMessage("➜ Mức cược tối thiểu là 50$!", threadID, messageID);
    }

    const userData = await Currencies.getData(senderID);
    const userMoney = userData.money || 0;
    if (userMoney < bet) {
        return api.sendMessage(`➜ Bạn không đủ tiền để cược! Số dư hiện tại: ${userMoney.toLocaleString()}$`, threadID, messageID);
    }

    const botChoice = validChoices[Math.floor(Math.random() * validChoices.length)];
    let outcome = "hòa";

    if (userChoice === botChoice) {
        outcome = "hòa";
    } else if (
        (userChoice === "búa" && botChoice === "kéo") ||
        (userChoice === "bao" && botChoice === "búa") ||
        (userChoice === "kéo" && botChoice === "bao")
    ) {
        outcome = "thắng";
    } else {
        outcome = "thua";
    }

    let balance = userMoney;
    if (outcome === "thắng") {
        await Currencies.increaseMoney(senderID, bet);
        balance += bet;
    } else if (outcome === "thua") {
        await Currencies.decreaseMoney(senderID, bet);
        balance -= bet;
    }

    const imgBuf = await drawKBBMatch(userChoice, botChoice, outcome, bet, balance);
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    const tempPath = path.join(cacheDir, `kbb_${senderID}_${Date.now()}.png`);
    fs.writeFileSync(tempPath, imgBuf);

    let uName = "Bạn";
    try { uName = await Users.getNameUser(senderID) || uName; } catch (_) {}

    return api.sendMessage({
        body: `⚔️ [KÉO BÚA BAO] ${uName}\n➜ Bạn ra: ${userChoice.toUpperCase()} ${itemEmojis[userChoice]} | Bot ra: ${botChoice.toUpperCase()} ${itemEmojis[botChoice]}\n➜ Kết quả: ${outcome.toUpperCase()}\n💰 Số dư: ${balance.toLocaleString()}$`,
        attachment: fs.createReadStream(tempPath)
    }, threadID, () => {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }, messageID);
};
