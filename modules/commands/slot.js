const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");

module.exports.config = {
    name: "slot",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Máy quay hoa quả casino Canvas",
    commandCategory: "Trò Chơi",
    usages: "[số tiền cược]",
    cooldowns: 3
};

const slotIcons = ["🍇", "🍉", "🍊", "🍏", "7⃣", "🍓", "🍒", "🍌", "💎"];

async function drawSlotMachine(reels, isWin, multiplier, bet, balance) {
    const width = 640, height = 380;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Dark luxury background
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#190826");
    bg.addColorStop(0.5, "#2b093b");
    bg.addColorStop(1, "#0d0214");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Neon Frame
    ctx.strokeStyle = "#FF007F";
    ctx.lineWidth = 5;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    // Machine Title
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 28px Arial Black";
    ctx.textAlign = "center";
    ctx.fillText("🎰 VEGAS LUCKY SLOTS 🎰", width / 2, 50);

    // Reels Frame Box
    const boxX = 60, boxY = 85, boxW = 520, boxH = 150;
    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#00F0FF";
    ctx.lineWidth = 4;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // 3 Reels Slots
    const reelW = 150, reelH = 120;
    const startX = 75, startY = 100;
    const gap = 25;

    for (let i = 0; i < 3; i++) {
        let rx = startX + i * (reelW + gap);
        let ry = startY;

        // Reel glass background
        const reelGrad = ctx.createLinearGradient(rx, ry, rx, ry + reelH);
        reelGrad.addColorStop(0, "#2a2a40");
        reelGrad.addColorStop(0.5, "#ffffff");
        reelGrad.addColorStop(1, "#2a2a40");
        ctx.fillStyle = reelGrad;
        ctx.fillRect(rx, ry, reelW, reelH);

        ctx.strokeStyle = "#DAA520";
        ctx.lineWidth = 3;
        ctx.strokeRect(rx, ry, reelW, reelH);

        // Reel symbol
        ctx.font = "60px 'Segoe UI Emoji', Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(reels[i], rx + reelW / 2, ry + reelH / 2);
    }

    // Outcome Banner
    ctx.textBaseline = "alphabetic";
    ctx.font = "bold 32px Arial";
    if (multiplier >= 9) {
        ctx.fillStyle = "#FFD700";
        ctx.fillText("🌟 JACKPOT 9X! 🌟", width / 2, 280);
    } else if (multiplier >= 2) {
        ctx.fillStyle = "#00FF7F";
        ctx.fillText("🎉 BIG WIN 2X! 🎉", width / 2, 280);
    } else {
        ctx.fillStyle = "#FF4444";
        ctx.fillText("💸 CHÚC MAY MẮN LẦN SAU! 💸", width / 2, 280);
    }

    // Stats
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`Tiền cược: ${bet.toLocaleString()}$ | Số dư hiện tại: ${balance.toLocaleString()}$`, width / 2, 330);

    return canvas.toBuffer("image/png");
}

module.exports.run = async function({ api, event, args, Currencies, Users }) {
    const { threadID, senderID, messageID } = event;

    if (!args[0]) return api.sendMessage("➜ Dùng: /slot [số tiền cược]", threadID, messageID);

    const bet = parseInt(args[0]);
    if (isNaN(bet) || bet < 50) {
        return api.sendMessage("➜ Số tiền cược tối thiểu là 50$!", threadID, messageID);
    }

    const userData = await Currencies.getData(senderID);
    const userMoney = userData.money || 0;
    if (userMoney < bet) {
        return api.sendMessage(`➜ Bạn không đủ tiền! Số dư của bạn là ${userMoney.toLocaleString()}$`, threadID, messageID);
    }

    const reels = [
        slotIcons[Math.floor(Math.random() * slotIcons.length)],
        slotIcons[Math.floor(Math.random() * slotIcons.length)],
        slotIcons[Math.floor(Math.random() * slotIcons.length)]
    ];

    let multiplier = 0;
    if (reels[0] === reels[1] && reels[1] === reels[2]) {
        multiplier = 9; // Jackpot
    } else if (reels[0] === reels[1] || reels[0] === reels[2] || reels[1] === reels[2]) {
        multiplier = 2; // Pair
    }

    let isWin = multiplier > 0;
    let balance = userMoney;

    if (isWin) {
        const winAmount = bet * multiplier;
        await Currencies.increaseMoney(senderID, winAmount);
        balance += winAmount;
    } else {
        await Currencies.decreaseMoney(senderID, bet);
        balance -= bet;
    }

    const imgBuf = await drawSlotMachine(reels, isWin, multiplier, bet, balance);
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    const tempPath = path.join(cacheDir, `slot_${senderID}_${Date.now()}.png`);
    fs.writeFileSync(tempPath, imgBuf);

    let uName = "Bạn";
    try { uName = await Users.getNameUser(senderID) || uName; } catch (_) {}

    return api.sendMessage({
        body: `🎰 [SLOT MACHINE] ${uName}\n➜ Kết quả: [ ${reels.join(" | ")} ]\n➜ ${isWin ? `Thắng nhận: +${(bet * multiplier).toLocaleString()}$` : `Thua mất: -${bet.toLocaleString()}$`}\n💰 Số dư mới: ${balance.toLocaleString()}$`,
        attachment: fs.createReadStream(tempPath)
    }, threadID, () => {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }, messageID);
};
