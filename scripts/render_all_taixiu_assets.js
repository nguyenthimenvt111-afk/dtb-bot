const fs = require('fs-extra');
const path = require('path');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');

// Register font
const fontPath = path.resolve(__dirname, '../modules/commands/cache/fonts/BeVietnamPro-Bold.ttf');
if (fs.existsSync(fontPath)) {
    try {
        GlobalFonts.registerFromPath(fontPath, 'Be Vietnam Pro');
    } catch (_) {}
}
const fontFam = '"Be Vietnam Pro", "Segoe UI", Arial, sans-serif';

const { renderTaiXiuCard } = require('./render_taixiu_cards.js');

const artifactDir = 'C:/Users/Admin/.gemini/antigravity/brain/ac768565-bdf4-4686-beba-24907a26594d';
fs.ensureDirSync(artifactDir);

console.log("=== BẮT ĐẦU VẼ TOÀN BỘ TÀI NGUYÊN ĐỒ HỌA TÀI XỈU ĐẠI CHIẾN ===");

// 1. RENDER 5 CARD KẾT QUẢ CHUYÊN SÂU
const cardsToRender = [
    {
        name: "taixiu_tai_win.png",
        options: {
            dice: [5, 4, 3],
            betType: "TÀI",
            betAmount: "500.000.000",
            isWin: true,
            payout: "1.000.000.000",
            randomEvent: "🔥 SỰ KIỆN X2 THƯỞNG: NHÂN ĐÔI LÃI",
            streakHistory: ["XIU", "XIU", "TAI", "XIU", "XIU", "TAI", "TAI", "TAI"]
        }
    },
    {
        name: "taixiu_xiu_win.png",
        options: {
            dice: [1, 2, 4],
            betType: "XỈU",
            betAmount: "2.000.000.000",
            isWin: true,
            payout: "4.400.000.000",
            randomEvent: "🍀 SỰ KIỆN MAY MẮN: +20% TIỀN THƯỞNG",
            streakHistory: ["TAI", "TAI", "TAI", "XIU", "TAI", "XIU", "XIU", "XIU"]
        }
    },
    {
        name: "taixiu_loss.png",
        options: {
            dice: [4, 4, 5],
            betType: "CHẴN",
            betAmount: "3 Tỷ",
            isWin: false,
            payout: "0",
            randomEvent: null,
            streakHistory: ["TAI", "TAI", "XIU", "TAI", "XIU", "XIU", "TAI", "TAI", "XIU", "TAI"]
        }
    },
    {
        name: "taixiu_triple_jackpot.png",
        options: {
            dice: [6, 6, 6],
            betType: "BỘ BA / TỔNG 18",
            betAmount: "1 Tỷ",
            isWin: true,
            payout: "30 Tỷ",
            randomEvent: "💎 SỰ KIỆN JACKPOT: NỔ HŨ THƯỞNG ĐẠI GIA (X30)",
            streakHistory: ["XIU", "XIU", "TAI", "XIU", "TAI", "TAI", "XIU", "XIU", "TAI", "TAI", "TAI"]
        }
    },
    {
        name: "taixiu_pair_win.png",
        options: {
            dice: [2, 2, 5],
            betType: "ĐÔI",
            betAmount: "1.000.000.000",
            isWin: true,
            payout: "2.500.000.000",
            randomEvent: "🎲 SỰ KIỆN XÚC XẮC VÀNG: THƯỞNG CỐ ĐỊNH",
            streakHistory: ["TAI", "XIU", "TAI", "XIU", "TAI", "XIU"]
        }
    }
];

cardsToRender.forEach(c => {
    const cvs = renderTaiXiuCard(c.options);
    const savePath = path.join(artifactDir, c.name);
    fs.writeFileSync(savePath, cvs.toBuffer('image/png'));
    console.log(`[PASS] Đã vẽ xong card: ${c.name}`);
});

// 2. RENDER 6 MẶT XÚC XẮC 3D ISOMETRIC ĐỘ NÉT CAO (DICE FACES 1-6)
function drawSingle3DDie(value) {
    const size = 300;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    const cos30 = 0.866;
    const sin30 = 0.5;
    const S = 90;
    const H = S * 0.90;
    const fillet = S * 0.14;

    ctx.save();
    ctx.translate(size / 2, size / 2 - 10);

    // Floor shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = S * 0.5;
    ctx.shadowOffsetY = S * 0.25;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, H * 0.35, S * 1.1, S * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const pts = [
        [0, -S],
        [S * cos30, -S * sin30],
        [S * cos30, -S * sin30 + H],
        [0, H],
        [-S * cos30, -S * sin30 + H],
        [-S * cos30, -S * sin30]
    ];

    // Clip rounded hex
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % 6];
        const p0 = pts[(i + 5) % 6];

        const v1x = p0[0] - p1[0], v1y = p0[1] - p1[1];
        const v2x = p2[0] - p1[0], v2y = p2[1] - p1[1];
        const len1 = Math.hypot(v1x, v1y), len2 = Math.hypot(v2x, v2y);
        const startX = p1[0] + (v1x / len1) * fillet;
        const startY = p1[1] + (v1y / len1) * fillet;
        const endX = p1[0] + (v2x / len2) * fillet;
        const endY = p1[1] + (v2y / len2) * fillet;

        if (i === 0) ctx.moveTo(startX, startY);
        else ctx.lineTo(startX, startY);
        ctx.quadraticCurveTo(p1[0], p1[1], endX, endY);
    }
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = '#660014';
    ctx.fill();

    // Left face
    const leftGrad = ctx.createLinearGradient(pts[5][0], pts[5][1], pts[3][0], pts[3][1]);
    leftGrad.addColorStop(0, '#c7002e');
    leftGrad.addColorStop(0.5, '#990022');
    leftGrad.addColorStop(1, '#570010');
    ctx.fillStyle = leftGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(pts[5][0], pts[5][1]);
    ctx.lineTo(pts[4][0], pts[4][1]);
    ctx.lineTo(pts[3][0], pts[3][1]);
    ctx.closePath();
    ctx.fill();

    // Right face
    const rightGrad = ctx.createLinearGradient(0, 0, pts[2][0], pts[2][1]);
    rightGrad.addColorStop(0, '#940020');
    rightGrad.addColorStop(0.6, '#6b0015');
    rightGrad.addColorStop(1, '#3b0008');
    ctx.fillStyle = rightGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.lineTo(pts[3][0], pts[3][1]);
    ctx.closePath();
    ctx.fill();

    // Top face
    const topGrad = ctx.createLinearGradient(pts[5][0], pts[0][1], pts[1][0], 0);
    topGrad.addColorStop(0, '#ff476d');
    topGrad.addColorStop(0.35, '#e60039');
    topGrad.addColorStop(0.75, '#b30026');
    topGrad.addColorStop(1, '#8f001c');
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[5][0], pts[5][1]);
    ctx.closePath();
    ctx.fill();

    // Ridges
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(pts[5][0], pts[5][1]);
    ctx.moveTo(0, 0); ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.moveTo(0, 0); ctx.lineTo(pts[3][0], pts[3][1]);
    ctx.stroke();

    // Specular
    const gloss = ctx.createLinearGradient(pts[5][0], pts[0][1], 0, 0);
    gloss.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
    gloss.addColorStop(0.35, 'rgba(255, 255, 255, 0.12)');
    gloss.addColorStop(0.65, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[5][0], pts[5][1]);
    ctx.closePath();
    ctx.fill();

    // Pips
    function drawTopPip(u, v, isBigRed = false) {
        const px = (u - v) * (S * cos30 * 0.4);
        const py = -S * 0.5 + (u + v) * (S * sin30 * 0.4);

        ctx.save();
        ctx.translate(px, py);
        ctx.scale(1, 0.58);

        ctx.fillStyle = 'rgba(40, 0, 10, 0.7)';
        ctx.beginPath();
        ctx.arc(0, 1.8, S * 0.125, 0, Math.PI * 2);
        ctx.fill();

        const pipGrad = ctx.createRadialGradient(-S * 0.03, -S * 0.03, 0, 0, 0, S * 0.115);
        if (isBigRed) {
            pipGrad.addColorStop(0, '#ffffff');
            pipGrad.addColorStop(0.3, '#ffcc00');
            pipGrad.addColorStop(1, '#e60000');
        } else {
            pipGrad.addColorStop(0, '#ffffff');
            pipGrad.addColorStop(0.75, '#f8fafc');
            pipGrad.addColorStop(1, '#cbd5e1');
        }
        ctx.fillStyle = pipGrad;
        ctx.beginPath();
        ctx.arc(0, 0, S * 0.115, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.arc(-S * 0.035, -S * 0.035, S * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    if (value === 1) drawTopPip(0, 0, true);
    if (value === 2) { drawTopPip(-0.52, -0.52); drawTopPip(0.52, 0.52); }
    if (value === 3) { drawTopPip(-0.52, -0.52); drawTopPip(0, 0); drawTopPip(0.52, 0.52); }
    if (value === 4) { drawTopPip(-0.52, -0.52); drawTopPip(0.52, -0.52); drawTopPip(-0.52, 0.52); drawTopPip(0.52, 0.52); }
    if (value === 5) { drawTopPip(-0.52, -0.52); drawTopPip(0.52, -0.52); drawTopPip(0, 0); drawTopPip(-0.52, 0.52); drawTopPip(0.52, 0.52); }
    if (value === 6) {
        drawTopPip(-0.52, -0.52); drawTopPip(0.52, -0.52);
        drawTopPip(-0.52, 0); drawTopPip(0.52, 0);
        drawTopPip(-0.52, 0.52); drawTopPip(0.52, 0.52);
    }

    ctx.restore(); // clip
    ctx.restore(); // root

    return canvas;
}

for (let i = 1; i <= 6; i++) {
    const diceCanvas = drawSingle3DDie(i);
    const savePath = path.join(artifactDir, `dice_face_${i}.png`);
    fs.writeFileSync(savePath, diceCanvas.toBuffer('image/png'));
    console.log(`[PASS] Đã vẽ xong mặt xúc xắc 3D: dice_face_${i}.png`);
}

console.log("=== HOÀN TẤT VẼ TOÀN BỘ TÀI NGUYÊN ===");
