const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");

module.exports.config = {
    name: "tungdongxu",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Tung đồng xu may rủi đồ họa Canvas",
    commandCategory: "Trò Chơi",
    usages: "[ngửa/xấp] [tiền cược]",
    cooldowns: 3
};

async function drawCoinResult(choice, result, isWin, bet, balance) {
    const width = 560, height = 340;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Casino table gradient background
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#0b2010");
    bg.addColorStop(0.5, "#144520");
    bg.addColorStop(1, "#07160a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Gold border
    ctx.strokeStyle = "#DAA520";
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Title
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 26px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🪙 TUNG ĐỒNG XU MAY RỦI 🪙", width / 2, 45);

    // Draw 3D Coin
    const coinX = width / 2;
    const coinY = 145;
    const coinRadius = 60;

    // Shadow
    ctx.beginPath();
    ctx.arc(coinX, coinY + 6, coinRadius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fill();

    // Outer Coin Rim
    const coinGrad = ctx.createRadialGradient(coinX - 15, coinY - 15, 5, coinX, coinY, coinRadius);
    coinGrad.addColorStop(0, "#FFF3A1");
    coinGrad.addColorStop(0.5, "#F7CA18");
    coinGrad.addColorStop(0.8, "#D48B06");
    coinGrad.addColorStop(1, "#965F04");
    ctx.beginPath();
    ctx.arc(coinX, coinY, coinRadius, 0, Math.PI * 2);
    ctx.fillStyle = coinGrad;
    ctx.fill();
    ctx.strokeStyle = "#FFE66D";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner Coin Circle
    ctx.beginPath();
    ctx.arc(coinX, coinY, coinRadius - 10, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(150, 95, 4, 0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Coin Symbol (Head / Tail)
    ctx.fillStyle = "#5A3902";
    ctx.font = "bold 34px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (result === "ngửa") {
        ctx.fillText("👑", coinX, coinY - 6);
        ctx.font = "bold 14px Arial";
        ctx.fillText("NGỬA", coinX, coinY + 22);
    } else {
        ctx.fillText("🦅", coinX, coinY - 6);
        ctx.font = "bold 14px Arial";
        ctx.fillText("XẤP", coinX, coinY + 22);
    }

    // Result outcome text
    ctx.textBaseline = "alphabetic";
    ctx.font = "bold 30px Arial";
    if (isWin) {
        ctx.fillStyle = "#00FF7F";
        ctx.fillText("🎉 THẮNG CƯỢC!", width / 2, 245);
    } else {
        ctx.fillStyle = "#FF4500";
        ctx.fillText("💸 THUA CƯỢC!", width / 2, 245);
    }

    // Details footer
    ctx.font = "18px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`Lựa chọn: ${choice.toUpperCase()} | Đồng xu: ${result.toUpperCase()}`, width / 2, 280);

    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 20px Arial";
    ctx.fillText(`Tiền cược: ${bet.toLocaleString()}$ | Số dư mới: ${balance.toLocaleString()}$`, width / 2, 312);

    return canvas.toBuffer("image/png");
}

module.exports.run = async function({ api, event, args, Currencies, Users }) {
    const { threadID, senderID, messageID } = event;

    if (!args[0] || !args[1]) {
        return api.sendMessage("➜ Dùng: /tungdongxu [ngửa/xấp] [tiền cược]", threadID, messageID);
    }

    let choice = args[0].toLowerCase();
    if (choice === "n") choice = "ngửa";
    if (choice === "x") choice = "xấp";

    if (!["ngửa", "xấp"].includes(choice)) {
        return api.sendMessage("➜ Bạn chỉ được chọn 'ngửa' hoặc 'xấp'!", threadID, messageID);
    }

    const bet = parseInt(args[1]);
    if (isNaN(bet) || bet <= 0) {
        return api.sendMessage("➜ Số tiền cược không hợp lệ!", threadID, messageID);
    }

    const userData = await Currencies.getData(senderID);
    const userMoney = userData.money || 0;
    if (userMoney < bet) {
        return api.sendMessage(`➜ Bạn không đủ tiền để cược! Số dư của bạn là ${userMoney.toLocaleString()}$`, threadID, messageID);
    }

    const result = Math.random() < 0.5 ? "ngửa" : "xấp";
    const isWin = choice === result;
    let balance = userMoney;

    if (isWin) {
        await Currencies.increaseMoney(senderID, bet);
        balance += bet;
    } else {
        await Currencies.decreaseMoney(senderID, bet);
        balance -= bet;
    }

    const imgBuf = await drawCoinResult(choice, result, isWin, bet, balance);
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    const tempPath = path.join(cacheDir, `coin_${senderID}_${Date.now()}.png`);
    fs.writeFileSync(tempPath, imgBuf);

    let uName = "Bạn";
    try { uName = await Users.getNameUser(senderID) || uName; } catch (_) {}

    return api.sendMessage({
        body: `🪙 ${uName} cược ${bet.toLocaleString()}$ vào '${choice.toUpperCase()}'.\n➜ Kết quả đồng xu ra: '${result.toUpperCase()}'! (${isWin ? "THẮNG" : "THUA"})\n💰 Số dư: ${balance.toLocaleString()}$`,
        attachment: fs.createReadStream(tempPath)
    }, threadID, () => {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }, messageID);
};
