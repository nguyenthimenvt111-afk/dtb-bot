const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");

module.exports.config = {
    name: "ttt",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Chơi cờ Caro Tic-Tac-Toe với AI Minimax trên Canvas",
    commandCategory: "Trò Chơi",
    usages: "[x/o/delete]",
    cooldowns: 2
};

function checkWin(board, player) {
    for (let i = 0; i < 3; i++) {
        if (board[i][0] === player && board[i][1] === player && board[i][2] === player) return true;
        if (board[0][i] === player && board[1][i] === player && board[2][i] === player) return true;
    }
    if (board[0][0] === player && board[1][1] === player && board[2][2] === player) return true;
    if (board[0][2] === player && board[1][1] === player && board[2][0] === player) return true;
    return false;
}

function isBoardFull(board) {
    return board.every(row => row.every(cell => cell !== 0));
}

function minimax(board, depth, isMaximizing) {
    if (checkWin(board, 1)) return 10 - depth; // AI wins
    if (checkWin(board, 2)) return depth - 10; // Player wins
    if (isBoardFull(board)) return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[r][c] === 0) {
                    board[r][c] = 1;
                    let score = minimax(board, depth + 1, false);
                    board[r][c] = 0;
                    bestScore = Math.max(score, bestScore);
                }
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[r][c] === 0) {
                    board[r][c] = 2;
                    let score = minimax(board, depth + 1, true);
                    board[r][c] = 0;
                    bestScore = Math.min(score, bestScore);
                }
            }
        }
        return bestScore;
    }
}

function findBestMove(board) {
    let bestScore = -Infinity;
    let move = null;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (board[r][c] === 0) {
                board[r][c] = 1;
                let score = minimax(board, 0, false);
                board[r][c] = 0;
                if (score > bestScore) {
                    bestScore = score;
                    move = { r, c };
                }
            }
        }
    }
    return move;
}

async function renderTTTBoard(board, playerIsX) {
    const size = 600;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");

    // Deep dark background
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, size, size);

    // Outer frame
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, size - 20, size - 20);

    // Grid lines
    ctx.strokeStyle = "#58a6ff";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";

    const cellSize = 180;
    const offset = 30;

    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(offset + cellSize, offset);
    ctx.lineTo(offset + cellSize, offset + cellSize * 3);
    ctx.moveTo(offset + cellSize * 2, offset);
    ctx.lineTo(offset + cellSize * 2, offset + cellSize * 3);

    // Horizontal lines
    ctx.moveTo(offset, offset + cellSize);
    ctx.lineTo(offset + cellSize * 3, offset + cellSize);
    ctx.moveTo(offset, offset + cellSize * 2);
    ctx.lineTo(offset + cellSize * 3, offset + cellSize * 2);
    ctx.stroke();

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            let cx = offset + c * cellSize + cellSize / 2;
            let cy = offset + r * cellSize + cellSize / 2;
            let val = board[r][c];

            if (val === 0) {
                // Number prompt in corner
                let num = r * 3 + c + 1;
                ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
                ctx.font = "bold 24px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(String(num), cx, cy);
            } else {
                let isX = (val === 2 && playerIsX) || (val === 1 && !playerIsX);
                if (isX) {
                    // Draw glowing Red X
                    ctx.strokeStyle = "#ff7b72";
                    ctx.lineWidth = 14;
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    ctx.moveTo(cx - 45, cy - 45);
                    ctx.lineTo(cx + 45, cy + 45);
                    ctx.moveTo(cx + 45, cy - 45);
                    ctx.lineTo(cx - 45, cy + 45);
                    ctx.stroke();
                } else {
                    // Draw glowing Cyan O
                    ctx.strokeStyle = "#79c0ff";
                    ctx.lineWidth = 14;
                    ctx.beginPath();
                    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }
    }

    return canvas.toBuffer("image/png");
}

module.exports.run = async function({ api, event, args }) {
    const { threadID, senderID, messageID } = event;
    if (!global.client.ttt) global.client.ttt = new Map();

    const action = args[0] ? args[0].toLowerCase() : "x";
    if (action === "del" || action === "delete" || action === "stop") {
        global.client.ttt.delete(senderID);
        return api.sendMessage("➜ Đã hủy ván cờ Tic-Tac-Toe hiện tại!", threadID, messageID);
    }

    const playerIsX = action !== "o";
    const board = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];

    const session = {
        board,
        playerIsX,
        author: senderID
    };
    global.client.ttt.set(senderID, session);

    const imgBuf = await renderTTTBoard(board, playerIsX);
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    const tempPath = path.join(cacheDir, `ttt_${senderID}_${Date.now()}.png`);
    fs.writeFileSync(tempPath, imgBuf);

    return api.sendMessage({
        body: `🎮 BÀN CỜ TIC-TAC-TOE ĐÃ SẴN SÀNG!\n👉 Bạn là ${playerIsX ? "X (đỏ)" : "O (xanh)"}\n👉 Reply tin nhắn này số ô từ [1 - 9] để đi cờ!`,
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

module.exports.handleReply = async function({ api, event, handleReply }) {
    const { threadID, senderID, messageID, body } = event;
    if (String(senderID) !== String(handleReply.author)) return;

    if (!global.client.ttt || !global.client.ttt.has(senderID)) return;
    const session = global.client.ttt.get(senderID);
    const board = session.board;

    const num = parseInt(body.trim());
    if (isNaN(num) || num < 1 || num > 9) {
        return api.sendMessage("➜ Vui lòng reply số ô từ 1 đến 9!", threadID, messageID);
    }

    const r = Math.floor((num - 1) / 3);
    const c = (num - 1) % 3;

    if (board[r][c] !== 0) {
        return api.sendMessage("➜ Ô này đã được đánh từ trước, vui lòng chọn ô khác!", threadID, messageID);
    }

    // Player move (value = 2)
    board[r][c] = 2;

    if (checkWin(board, 2)) {
        global.client.ttt.delete(senderID);
        const imgBuf = await renderTTTBoard(board, session.playerIsX);
        const tempPath = path.join(__dirname, "cache", `ttt_${Date.now()}.png`);
        fs.writeFileSync(tempPath, imgBuf);
        return api.sendMessage({
            body: "🎉 CHÚC MỪNG! BẠN ĐÃ CHIẾN THẮNG BOT!",
            attachment: fs.createReadStream(tempPath)
        }, threadID, () => { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); }, messageID);
    }

    if (isBoardFull(board)) {
        global.client.ttt.delete(senderID);
        const imgBuf = await renderTTTBoard(board, session.playerIsX);
        const tempPath = path.join(__dirname, "cache", `ttt_${Date.now()}.png`);
        fs.writeFileSync(tempPath, imgBuf);
        return api.sendMessage({
            body: "🤝 TRẬN ĐẤU KẾT THÚC VỚI KẾT QUẢ HÒA!",
            attachment: fs.createReadStream(tempPath)
        }, threadID, () => { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); }, messageID);
    }

    // AI move (value = 1)
    const aiMove = findBestMove(board);
    if (aiMove) {
        board[aiMove.r][aiMove.c] = 1;
    }

    if (checkWin(board, 1)) {
        global.client.ttt.delete(senderID);
        const imgBuf = await renderTTTBoard(board, session.playerIsX);
        const tempPath = path.join(__dirname, "cache", `ttt_${Date.now()}.png`);
        fs.writeFileSync(tempPath, imgBuf);
        return api.sendMessage({
            body: "💀 BOT ĐÃ CHIẾN THẮNG! HÃY THỬ LẠI LẦN SAU NHÉ!",
            attachment: fs.createReadStream(tempPath)
        }, threadID, () => { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); }, messageID);
    }

    if (isBoardFull(board)) {
        global.client.ttt.delete(senderID);
        const imgBuf = await renderTTTBoard(board, session.playerIsX);
        const tempPath = path.join(__dirname, "cache", `ttt_${Date.now()}.png`);
        fs.writeFileSync(tempPath, imgBuf);
        return api.sendMessage({
            body: "🤝 TRẬN ĐẤU KẾT THÚC VỚI KẾT QUẢ HÒA!",
            attachment: fs.createReadStream(tempPath)
        }, threadID, () => { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); }, messageID);
    }

    const imgBuf = await renderTTTBoard(board, session.playerIsX);
    const tempPath = path.join(__dirname, "cache", `ttt_${Date.now()}.png`);
    fs.writeFileSync(tempPath, imgBuf);

    return api.sendMessage({
        body: "👉 Lượt của bạn! Reply số ô tiếp theo [1 - 9]:",
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
