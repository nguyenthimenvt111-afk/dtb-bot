const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");

module.exports.config = {
    name: "altp",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Chương trình Ai Là Triệu Phú với giao diện đồ họa Canvas",
    commandCategory: "Trò Chơi",
    usages: "[play/stop/help]",
    cooldowns: 2
};

const prizeLadder = [
    0, 200, 400, 600, 1000, 2000,
    3000, 6000, 10000, 14000, 22000,
    30000, 40000, 80000, 150000, 250000
];

const milestoneSafe = level => {
    if (level >= 15) return prizeLadder[15];
    if (level >= 10) return prizeLadder[10];
    if (level >= 5) return prizeLadder[5];
    return 0;
};

const loadQuestions = () => {
    const qPath = path.join(__dirname, "cache", "altp_questions.json");
    if (!fs.existsSync(qPath)) return [];
    try { return fs.readJsonSync(qPath); } catch (_) { return []; }
};

function wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    let lines = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
        let word = words[i];
        let width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

function drawHexagon(ctx, x, y, width, height, corner) {
    ctx.beginPath();
    ctx.moveTo(x + corner, y);
    ctx.lineTo(x + width - corner, y);
    ctx.lineTo(x + width, y + height / 2);
    ctx.lineTo(x + width - corner, y + height);
    ctx.lineTo(x + corner, y + height);
    ctx.lineTo(x, y + height / 2);
    ctx.closePath();
}

async function drawALTPBoard(level, question, highlight = null) {
    const width = 1100, height = 650;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Studio Background
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 600);
    bgGrad.addColorStop(0, "#081b4b");
    bgGrad.addColorStop(0.6, "#030a24");
    bgGrad.addColorStop(1, "#01040f");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Outer glow frame
    ctx.strokeStyle = "rgba(0, 180, 255, 0.4)";
    ctx.lineWidth = 3;
    ctx.strokeRect(15, 15, width - 30, height - 30);

    // Title / Milestone banner
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 26px Arial";
    ctx.textAlign = "center";
    const milestoneText = level === 5 ? " - CỘT MỐC SỐ 1" : level === 10 ? " - CỘT MỐC SỐ 2" : level === 15 ? " - CÂU HỎI CUỐI CÙNG!" : "";
    ctx.fillText(`⭐ AI LÀ TRIỆU PHÚ - CÂU HỎI ${level}/15${milestoneText} ⭐`, width / 2, 55);

    ctx.fillStyle = "#00FFCC";
    ctx.font = "bold 22px Arial";
    ctx.fillText(`Mức thưởng câu này: ${prizeLadder[level].toLocaleString()}$`, width / 2, 90);

    // Question Box
    const qX = 80, qY = 120, qW = 940, qH = 140, corner = 25;
    ctx.fillStyle = "rgba(4, 21, 65, 0.9)";
    drawHexagon(ctx, qX, qY, qW, qH, corner);
    ctx.fill();
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Question Text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const qLines = wrapText(ctx, question.question, qW - 100);
    const lineHeight = 32;
    const startY = qY + qH / 2 - ((qLines.length - 1) * lineHeight) / 2;
    qLines.forEach((line, idx) => {
        ctx.fillText(line, width / 2, startY + idx * lineHeight);
    });

    // 4 Answer Boxes
    const options = [
        { key: "A", text: question.A, x: 80, y: 300, w: 450, h: 70 },
        { key: "B", text: question.B, x: 570, y: 300, w: 450, h: 70 },
        { key: "C", text: question.C, x: 80, y: 400, w: 450, h: 70 },
        { key: "D", text: question.D, x: 570, y: 400, w: 450, h: 70 }
    ];

    for (const opt of options) {
        let isCorrect = highlight && highlight === opt.key;
        let boxFill = isCorrect ? "rgba(0, 180, 50, 0.9)" : "rgba(4, 21, 65, 0.85)";
        let strokeColor = isCorrect ? "#00FF66" : "#E5A912";

        ctx.fillStyle = boxFill;
        drawHexagon(ctx, opt.x, opt.y, opt.w, opt.h, 18);
        ctx.fill();

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 22px Arial";
        ctx.fillText(`${opt.key}:`, opt.x + 30, opt.y + opt.h / 2);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "20px Arial";
        const maxOptW = opt.w - 90;
        let optText = opt.text;
        while (ctx.measureText(optText).width > maxOptW && optText.length > 0) {
            optText = optText.slice(0, -1);
        }
        ctx.fillText(optText, opt.x + 70, opt.y + opt.h / 2);
    }

    // Bottom Help info
    ctx.textAlign = "center";
    ctx.fillStyle = "#A0AEC0";
    ctx.font = "16px Arial";
    ctx.fillText("👉 Reply A, B, C hoặc D để chốt đáp án | Dùng '5050' để bỏ 2 phương án sai | 'stop' để dừng cuộc chơi", width / 2, 540);

    return canvas.toBuffer("image/png");
}

module.exports.run = async function({ api, event, args, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const questions = loadQuestions();

    if (questions.length === 0) {
        return api.sendMessage("➜ Dữ liệu câu hỏi Ai Là Triệu Phú đang cập nhật, vui lòng thử lại sau!", threadID, messageID);
    }

    if (!global.client.altp) global.client.altp = new Map();

    const action = args[0] ? args[0].toLowerCase() : "play";

    if (action === "stop") {
        if (!global.client.altp.has(senderID)) {
            return api.sendMessage("➜ Bạn hiện không có ván chơi nào đang diễn ra!", threadID, messageID);
        }
        const session = global.client.altp.get(senderID);
        const reward = session.level > 1 ? prizeLadder[session.level - 1] : 0;
        global.client.altp.delete(senderID);
        if (reward > 0) await Currencies.increaseMoney(senderID, reward);
        return api.sendMessage(`➜ Bạn đã dừng cuộc chơi tại câu số ${session.level}! Nhận tiền thưởng mang về: ${reward.toLocaleString()}$`, threadID, messageID);
    }

    if (action === "help") {
        return api.sendMessage(
`====『 AI LÀ TRIỆU PHÚ 』====
- Dùng: /altp -> Bắt đầu chơi
- Vượt qua 15 câu hỏi để nhận 250,000$
- Có 3 mốc an toàn: Câu 5 (2,000$), Câu 10 (22,000$), Câu 15 (250,000$)
- Trợ giúp trong khi chơi:
  + Gõ '5050': Loại bỏ 2 đáp án sai
  + Gõ 'stop': Dừng cuộc chơi bảo toàn tiền thưởng`, threadID, messageID);
    }

    // Start New Game
    const qLevel1 = questions.filter(q => q.level === 1);
    const chosenQ = qLevel1[Math.floor(Math.random() * qLevel1.length)] || questions[0];

    const session = {
        level: 1,
        question: chosenQ,
        used5050: false,
        author: senderID,
        threadID
    };
    global.client.altp.set(senderID, session);

    const imgBuf = await drawALTPBoard(1, chosenQ);
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    const tempPath = path.join(cacheDir, `altp_${senderID}_${Date.now()}.png`);
    fs.writeFileSync(tempPath, imgBuf);

    return api.sendMessage({
        body: `🎬 CHÀO MỪNG BẠN ĐẾN VỚI AI LÀ TRIỆU PHÚ!\n⭐ Câu hỏi số 1: Trị giá ${prizeLadder[1].toLocaleString()}$\n👉 Reply tin nhắn này chữ cái [A, B, C, D] để trả lời!`,
        attachment: fs.createReadStream(tempPath)
    }, threadID, (err, info) => {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        if (!err && global.client.handleReply) {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID
            });
        }
    }, messageID);
};

module.exports.handleReply = async function({ api, event, handleReply, Currencies }) {
    const { threadID, senderID, messageID, body } = event;
    if (String(senderID) !== String(handleReply.author)) return;

    if (!global.client.altp || !global.client.altp.has(senderID)) return;
    const session = global.client.altp.get(senderID);
    const questions = loadQuestions();
    const answer = body.trim().toUpperCase();

    // 50:50 Lifeline
    if (answer === "5050" || answer === "50:50") {
        if (session.used5050) {
            return api.sendMessage("⚠️ Bạn đã sử dụng quyền trợ giúp 50:50 trong ván chơi này rồi!", threadID, messageID);
        }
        session.used5050 = true;
        const correct = session.question.answer;
        const wrongs = ["A", "B", "C", "D"].filter(x => x !== correct);
        const removed = wrongs.sort(() => 0.5 - Math.random()).slice(0, 2);
        return api.sendMessage(`💡 [TRỢ GIÚP 50:50] Hai phương án sai đã bị loại bỏ là: ${removed.join(" và ")}`, threadID, messageID);
    }

    if (answer === "STOP") {
        const reward = session.level > 1 ? prizeLadder[session.level - 1] : 0;
        global.client.altp.delete(senderID);
        if (reward > 0) await Currencies.increaseMoney(senderID, reward);
        return api.sendMessage(`➜ Bạn đã dừng cuộc chơi! Nhận tiền thưởng mang về: ${reward.toLocaleString()}$`, threadID, messageID);
    }

    if (!["A", "B", "C", "D"].includes(answer)) {
        return api.sendMessage("➜ Vui lòng chỉ chọn đáp án [A, B, C, D] hoặc gõ '5050'!", threadID, messageID);
    }

    const currentQ = session.question;
    if (answer === currentQ.answer) {
        // Correct Answer
        const currentReward = prizeLadder[session.level];
        if (session.level === 15) {
            global.client.altp.delete(senderID);
            await Currencies.increaseMoney(senderID, currentReward);
            return api.sendMessage(`🏆 XUẤT SẮC! BẠN ĐÃ TRỞ THÀNH TRIỆU PHÚ VÀ GIÀNH GIẢI THƯỞNG CAO NHẤT: ${currentReward.toLocaleString()}$!\n${currentQ.explain || ""}`, threadID, messageID);
        }

        session.level++;
        const nextPool = questions.filter(q => q.level === session.level);
        session.question = nextPool[Math.floor(Math.random() * nextPool.length)] || questions[Math.floor(Math.random() * questions.length)];

        const imgBuf = await drawALTPBoard(session.level, session.question, currentQ.answer);
        const cacheDir = path.join(__dirname, "cache");
        fs.ensureDirSync(cacheDir);
        const tempPath = path.join(cacheDir, `altp_${senderID}_${Date.now()}.png`);
        fs.writeFileSync(tempPath, imgBuf);

        return api.sendMessage({
            body: `🎉 CHÍNH XÁC! Bạn đã vượt qua câu số ${session.level - 1} (${currentReward.toLocaleString()}$).\n💡 ${currentQ.explain || ""}\n\n⭐ Câu hỏi tiếp theo số ${session.level}: Trị giá ${prizeLadder[session.level].toLocaleString()}$`,
            attachment: fs.createReadStream(tempPath)
        }, threadID, (err, info) => {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            if (!err && global.client.handleReply) {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: senderID
                });
            }
        }, messageID);
    } else {
        // Wrong Answer
        const safeReward = milestoneSafe(session.level);
        global.client.altp.delete(senderID);
        if (safeReward > 0) await Currencies.increaseMoney(senderID, safeReward);

        return api.sendMessage(
`❌ RẤT TIẾC, ĐÁP ÁN ĐÚNG LÀ: ${currentQ.answer}!
💡 Giải thích: ${currentQ.explain || "Không có"}
💰 Bạn ra về với mức thưởng an toàn: ${safeReward.toLocaleString()}$`, threadID, messageID);
    }
};
