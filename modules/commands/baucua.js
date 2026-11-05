const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports.config = {
    name: "baucua",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Game bầu cua tôm cá đồ họa Canvas chất lượng cao",
    commandCategory: "Trò Chơi",
    usages: "[bầu/cua/cá/gà/tôm/nai] [số tiền cược]",
    cooldowns: 2
};

const items = ["bầu", "cua", "cá", "gà", "tôm", "nai"];
const itemMap = {
    "bau": "bầu", "bầu": "bầu",
    "cua": "cua",
    "ca": "cá", "cá": "cá",
    "ga": "gà", "gà": "gà",
    "tom": "tôm", "tôm": "tôm",
    "nai": "nai"
};

async function drawBaucuaPlate(dice, isWin, matchCount, bet, balance) {
    const width = 650, height = 380;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Luxury Wood Mat Background
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#2c1808");
    bg.addColorStop(0.5, "#4a280e");
    bg.addColorStop(1, "#1f0f04");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Decorative Gold border
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 5;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    // Header
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🎲 BẦU CUA TÔM CÁ DÂN GIAN 🎲", width / 2, 50);

    // 3 Result Dice
    const diceSize = 130;
    const startX = 65;
    const gap = 55;
    const diceY = 90;

    const baucuaDir = path.join(__dirname, "game", "baucua");

    for (let i = 0; i < 3; i++) {
        let dx = startX + i * (diceSize + gap);
        let dy = diceY;

        // Shadow & plate
        ctx.beginPath();
        ctx.arc(dx + diceSize / 2, dy + diceSize / 2, diceSize / 2 + 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fill();

        const imgFile = path.join(baucuaDir, `${dice[i]}.jpg`);
        if (fs.existsSync(imgFile)) {
            try {
                const img = await loadImage(imgFile);
                ctx.save();
                ctx.beginPath();
                ctx.arc(dx + diceSize / 2, dy + diceSize / 2, diceSize / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(img, dx, dy, diceSize, diceSize);
                ctx.restore();
            } catch (_) {
                ctx.fillStyle = "#EAEAEA";
                ctx.beginPath();
                ctx.arc(dx + diceSize / 2, dy + diceSize / 2, diceSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.arc(dx + diceSize / 2, dy + diceSize / 2, diceSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Gold Ring around dice
        ctx.beginPath();
        ctx.arc(dx + diceSize / 2, dy + diceSize / 2, diceSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 4;
        ctx.stroke();

        // Label below dice
        ctx.font = "bold 20px Arial";
        ctx.fillStyle = "#FFF3A1";
        ctx.fillText(dice[i].toUpperCase(), dx + diceSize / 2, dy + diceSize + 28);
    }

    // Outcome
    ctx.font = "bold 26px Arial";
    if (isWin) {
        ctx.fillStyle = "#00FF7F";
        ctx.fillText(`🎉 TRÚNG ${matchCount} CON! +${(bet * matchCount).toLocaleString()}$ 🎉`, width / 2, 305);
    } else {
        ctx.fillStyle = "#FF4500";
        ctx.fillText(`💸 THUA CƯỢC! -${bet.toLocaleString()}$ 💸`, width / 2, 305);
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "#E0E0E0";
    ctx.fillText(`Số dư hiện tại: ${balance.toLocaleString()}$`, width / 2, 342);

    return canvas.toBuffer("image/png");
}

module.exports.run = async function({ api, event, args, Currencies, Users }) {
    const { threadID, senderID, messageID } = event;

    if (!args[0]) {
        return api.sendMessage("➜ Dùng: /baucua [bầu/cua/cá/gà/tôm/nai] [tiền cược]", threadID, messageID);
    }

    const inputChoice = args[0].toLowerCase();
    const chosen = itemMap[inputChoice];
    if (!chosen) {
        return api.sendMessage("➜ Cửa cược không hợp lệ! Hãy chọn: bầu, cua, cá, gà, tôm hoặc nai.", threadID, messageID);
    }

    const bet = parseInt(args[1]);
    if (isNaN(bet) || bet < 50) {
        return api.sendMessage("➜ Số tiền cược tối thiểu là 50$!", threadID, messageID);
    }

    const userData = await Currencies.getData(senderID);
    const userMoney = userData.money || 0;
    if (userMoney < bet) {
        return api.sendMessage(`➜ Bạn không đủ tiền! Số dư của bạn là ${userMoney.toLocaleString()}$`, threadID, messageID);
    }

    const dice = [
        items[Math.floor(Math.random() * items.length)],
        items[Math.floor(Math.random() * items.length)],
        items[Math.floor(Math.random() * items.length)]
    ];

    const matchCount = dice.filter(d => d === chosen).length;
    const isWin = matchCount > 0;
    let balance = userMoney;

    if (isWin) {
        const winAmount = bet * matchCount;
        await Currencies.increaseMoney(senderID, winAmount);
        balance += winAmount;
    } else {
        await Currencies.decreaseMoney(senderID, bet);
        balance -= bet;
    }

    const imgBuf = await drawBaucuaPlate(dice, isWin, matchCount, bet, balance);
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    const tempPath = path.join(cacheDir, `baucua_${senderID}_${Date.now()}.png`);
    fs.writeFileSync(tempPath, imgBuf);

    let uName = "Bạn";
    try { uName = await Users.getNameUser(senderID) || uName; } catch (_) {}

    return api.sendMessage({
        body: `🎲 [BẦU CUA] ${uName} cược ${bet.toLocaleString()}$ vào '${chosen.toUpperCase()}'\n👉 Kết quả lắc ra: [ ${dice.join(" - ")} ]\n➜ ${isWin ? `TRÚNG ${matchCount} con! Nhận: +${(bet * matchCount).toLocaleString()}$` : `Không trúng con nào! Thua: -${bet.toLocaleString()}$`}\n💰 Số dư: ${balance.toLocaleString()}$`,
        attachment: fs.createReadStream(tempPath)
    }, threadID, () => {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }, messageID);
};
