const fs = require('fs-extra');
const path = require('path');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');

// Register fonts if available
const fontPath = path.resolve(__dirname, '../modules/commands/cache/fonts/BeVietnamPro-Bold.ttf');
if (fs.existsSync(fontPath)) {
    try {
        GlobalFonts.registerFromPath(fontPath, 'Be Vietnam Pro');
    } catch (_) {}
}

const fontFam = '"Be Vietnam Pro", "Segoe UI", Arial, sans-serif';

function drawRoundedRect(ctx, x, y, w, h, r, fill = true, stroke = false) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

/**
 * Draws an authentic 3D Rounded Isometric Casino Die
 */
function draw3DIsometricDie(ctx, x, y, size, topVal, rotDeg = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotDeg * Math.PI) / 180);

    const cos30 = 0.866;
    const sin30 = 0.5;
    const S = size;
    const H = S * 0.90; // height of cube
    const fillet = S * 0.14; // corner fillet radius

    // 1. Shadow beneath the die
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = S * 0.45;
    ctx.shadowOffsetX = S * 0.08;
    ctx.shadowOffsetY = S * 0.22;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.ellipse(0, H * 0.35, S * 1.05, S * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Vertices of the isometric hexagon:
    const pts = [
        [0, -S],
        [S * cos30, -S * sin30],
        [S * cos30, -S * sin30 + H],
        [0, H],
        [-S * cos30, -S * sin30 + H],
        [-S * cos30, -S * sin30]
    ];

    // Clip to rounded silhouette
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

    // Base body dark ruby
    ctx.fillStyle = '#660014';
    ctx.fill();

    // --- LEFT FACE ---
    ctx.save();
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
    ctx.restore();

    // --- RIGHT FACE ---
    ctx.save();
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
    ctx.restore();

    // --- TOP FACE ---
    ctx.save();
    const topGrad = ctx.createLinearGradient(pts[5][0], pts[0][1], pts[1][0], 0);
    topGrad.addColorStop(0, '#ff476d'); // specular highlight
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
    ctx.restore();

    // Subtle ridges between faces
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(pts[5][0], pts[5][1]);
    ctx.moveTo(0, 0); ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.moveTo(0, 0); ctx.lineTo(pts[3][0], pts[3][1]);
    ctx.stroke();
    ctx.restore();

    // Surface specular gloss reflection
    ctx.save();
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
    ctx.restore();

    // Draw Top Face Pips
    function drawTopPip(u, v, isBigRed = false) {
        const px = (u - v) * (S * cos30 * 0.4);
        const py = -S * 0.5 + (u + v) * (S * sin30 * 0.4);

        ctx.save();
        ctx.translate(px, py);
        ctx.scale(1, 0.58);

        // Cavity shadow
        ctx.fillStyle = 'rgba(40, 0, 10, 0.7)';
        ctx.beginPath();
        ctx.arc(0, 1.8, S * 0.125, 0, Math.PI * 2);
        ctx.fill();

        // White/Gold pip
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

        // Specular pip highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.arc(-S * 0.035, -S * 0.035, S * 0.035, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    if (topVal === 1) drawTopPip(0, 0, true);
    if (topVal === 2) { drawTopPip(-0.52, -0.52); drawTopPip(0.52, 0.52); }
    if (topVal === 3) { drawTopPip(-0.52, -0.52); drawTopPip(0, 0); drawTopPip(0.52, 0.52); }
    if (topVal === 4) { drawTopPip(-0.52, -0.52); drawTopPip(0.52, -0.52); drawTopPip(-0.52, 0.52); drawTopPip(0.52, 0.52); }
    if (topVal === 5) { drawTopPip(-0.52, -0.52); drawTopPip(0.52, -0.52); drawTopPip(0, 0); drawTopPip(-0.52, 0.52); drawTopPip(0.52, 0.52); }
    if (topVal === 6) {
        drawTopPip(-0.52, -0.52); drawTopPip(0.52, -0.52);
        drawTopPip(-0.52, 0); drawTopPip(0.52, 0);
        drawTopPip(-0.52, 0.52); drawTopPip(0.52, 0.52);
    }

    // Side face subtle dots for 3D realism
    function drawSidePip(x, y, r, isLeft = true) {
        ctx.save();
        ctx.translate(x, y);
        if (isLeft) ctx.transform(1, -sin30, 0, 1, 0, 0);
        else ctx.transform(1, sin30, 0, 1, 0, 0);

        ctx.fillStyle = 'rgba(30, 0, 5, 0.7)';
        ctx.beginPath();
        ctx.arc(0, 1, r * 1.05, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isLeft ? '#cbd5e1' : '#94a3b8';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawSidePip(-S * 0.38, H * 0.42, S * 0.08, true);
    drawSidePip(S * 0.38, H * 0.42, S * 0.08, false);

    ctx.restore(); // clip
    ctx.restore(); // transform
}

/**
 * Main Card Renderer for TÀI XỈU ĐẠI CHIẾN
 */
function renderTaiXiuCard({
    dice = [4, 4, 5],
    betType = "CHẴN",
    betAmount = "3 TỶ",
    isWin = false,
    payout = "0",
    randomEvent = null,
    streakHistory = ["TAI", "TAI", "XIU", "TAI", "XIU", "XIU", "TAI", "TAI", "XIU", "TAI"]
}) {
    const width = 1200;
    const height = 760;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const total = dice.reduce((a, b) => a + b, 0);
    const isTriple = dice[0] === dice[1] && dice[1] === dice[2];
    const isPair = (dice[0] === dice[1] || dice[1] === dice[2] || dice[0] === dice[2]) && !isTriple;
    const isTai = total >= 11;
    const isChan = total % 2 === 0;

    const taiXiuStr = isTai ? "TÀI" : "XỈU";
    const chanLeStr = isChan ? "CHẴN" : "LẺ";
    const subResultStr = `${taiXiuStr} • ${chanLeStr}${isTriple ? " • BỘ BA" : isPair ? " • ĐÔI" : ""}`;

    // ==========================================
    // 1. RICH CASINO VELVET BACKGROUND
    // ==========================================
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, width * 0.7);
    bgGrad.addColorStop(0, '#2e0a1b'); // center velvet garnet
    bgGrad.addColorStop(0.5, '#1a050f');
    bgGrad.addColorStop(1, '#0d0208'); // deep obsidian
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle luxury geometric diamonds pattern
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 193, 7, 0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y <= height; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    ctx.restore();

    // ==========================================
    // 2. LUXURY GOLD METALLIC DUAL BORDER
    // ==========================================
    const pad = 24;
    const cardW = width - pad * 2;
    const cardH = height - pad * 2;
    const cardR = 26;

    // Outer border gradient
    const goldGrad = ctx.createLinearGradient(pad, pad, cardW, cardH);
    goldGrad.addColorStop(0, '#ffe57f');
    goldGrad.addColorStop(0.2, '#ffc107');
    goldGrad.addColorStop(0.45, '#ff8f00');
    goldGrad.addColorStop(0.7, '#ffe082');
    goldGrad.addColorStop(0.85, '#ffb300');
    goldGrad.addColorStop(1, '#8d6e63');

    ctx.save();
    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = 'rgba(255, 193, 7, 0.35)';
    ctx.shadowBlur = 16;
    drawRoundedRect(ctx, pad, pad, cardW, cardH, cardR, false, true);
    ctx.restore();

    // Inner thin accent border
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.lineWidth = 1.2;
    drawRoundedRect(ctx, pad + 7, pad + 7, cardW - 14, cardH - 14, cardR - 4, false, true);
    ctx.restore();

    // Corner decorative metal brackets
    function drawCornerBracket(x, y, dx, dy) {
        ctx.save();
        ctx.strokeStyle = '#ffe082';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x, y + dy * 28);
        ctx.lineTo(x, y);
        ctx.lineTo(x + dx * 28, y);
        ctx.stroke();
        ctx.restore();
    }
    drawCornerBracket(pad - 4, pad - 4, 1, 1);
    drawCornerBracket(pad + cardW + 4, pad - 4, -1, 1);
    drawCornerBracket(pad - 4, pad + cardH + 4, 1, -1);
    drawCornerBracket(pad + cardW + 4, pad + cardH + 4, -1, -1);

    // ==========================================
    // 3. TOP HEADER ROW (PILL BADGES)
    // ==========================================
    const topY = 48;

    // Left Pill: Title & Game Mode
    const leftPillW = 320;
    const leftPillH = 46;
    const leftPillX = 54;

    ctx.save();
    const pillBg1 = ctx.createLinearGradient(leftPillX, topY, leftPillX, topY + leftPillH);
    pillBg1.addColorStop(0, 'rgba(40, 15, 25, 0.9)');
    pillBg1.addColorStop(1, 'rgba(20, 6, 12, 0.95)');
    ctx.fillStyle = pillBg1;
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.65)';
    ctx.lineWidth = 1.6;
    drawRoundedRect(ctx, leftPillX, topY, leftPillW, leftPillH, 23, true, true);

    // Gold studs on left pill
    ctx.fillStyle = '#ffc107';
    ctx.shadowColor = '#ffc107';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(leftPillX + 22, topY + leftPillH / 2, 4.5, 0, Math.PI * 2);
    ctx.arc(leftPillX + leftPillW - 22, topY + leftPillH / 2, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `bold 19px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe57f';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
    ctx.shadowBlur = 10;
    ctx.fillText("🎲 TÀI XỈU ĐẠI CHIẾN", leftPillX + leftPillW / 2, topY + leftPillH / 2);
    ctx.restore();

    // Right Pill: Bet Amount (TIỀN CƯỢC)
    const rightPillW = 420;
    const rightPillH = 46;
    const rightPillX = width - 54 - rightPillW;

    ctx.save();
    const pillBg2 = ctx.createLinearGradient(rightPillX, topY, rightPillX, topY + rightPillH);
    pillBg2.addColorStop(0, 'rgba(40, 15, 25, 0.9)');
    pillBg2.addColorStop(1, 'rgba(20, 6, 12, 0.95)');
    ctx.fillStyle = pillBg2;
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.65)';
    ctx.lineWidth = 1.6;
    drawRoundedRect(ctx, rightPillX, topY, rightPillW, rightPillH, 23, true, true);

    // Center divider inside right pill
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.beginPath();
    ctx.moveTo(rightPillX + 160, topY + 8);
    ctx.lineTo(rightPillX + 160, topY + rightPillH - 8);
    ctx.stroke();

    // Icon & Label
    ctx.font = `bold 14px ${fontFam}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText("💰 TIỀN CƯỢC", rightPillX + 24, topY + rightPillH / 2);

    // Value
    ctx.font = `bold 22px ${fontFam}`;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = 'rgba(251, 191, 36, 0.6)';
    ctx.shadowBlur = 10;
    ctx.fillText(`${betAmount}`, rightPillX + rightPillW - 24, topY + rightPillH / 2);
    ctx.restore();

    // ==========================================
    // 4. MAIN MIDDLE STAGE: DISH & SCORE BOX
    // ==========================================
    const stageY = 120;

    // LEFT: THE LUXURY DICE DISH (DĨA ĐỔ XÚC XẮC)
    const dishCenterX = 350;
    const dishCenterY = stageY + 165;
    const dishRadius = 160;

    // Dish Outer Glow
    ctx.save();
    const dishGlow = ctx.createRadialGradient(dishCenterX, dishCenterY, dishRadius * 0.7, dishCenterX, dishCenterY, dishRadius * 1.35);
    dishGlow.addColorStop(0, 'rgba(255, 59, 97, 0.18)');
    dishGlow.addColorStop(0.6, 'rgba(255, 193, 7, 0.08)');
    dishGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = dishGlow;
    ctx.beginPath();
    ctx.arc(dishCenterX, dishCenterY, dishRadius * 1.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Dish Metallic Beveled Rim (Multi-layered gold concentric rings)
    ctx.save();
    const rimGrad = ctx.createLinearGradient(dishCenterX - dishRadius, dishCenterY - dishRadius, dishCenterX + dishRadius, dishCenterY + dishRadius);
    rimGrad.addColorStop(0, '#ffd54f');
    rimGrad.addColorStop(0.25, '#ff8f00');
    rimGrad.addColorStop(0.5, '#fff9c4');
    rimGrad.addColorStop(0.75, '#b78103');
    rimGrad.addColorStop(1, '#ffb300');
    ctx.strokeStyle = rimGrad;
    ctx.lineWidth = 9;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(dishCenterX, dishCenterY, dishRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Dish Interior Dark Felt
    ctx.save();
    const feltGrad = ctx.createRadialGradient(dishCenterX, dishCenterY, 0, dishCenterX, dishCenterY, dishRadius);
    feltGrad.addColorStop(0, '#1f0914');
    feltGrad.addColorStop(0.75, '#12040b');
    feltGrad.addColorStop(1, '#080105');
    ctx.fillStyle = feltGrad;
    ctx.beginPath();
    ctx.arc(dishCenterX, dishCenterY, dishRadius - 4, 0, Math.PI * 2);
    ctx.fill();

    // Inner Dish Cavity Inset Shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.88)';
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.restore();

    // DRAW THE 3 CASINO ISOMETRIC DICE IN REALISTIC 3D PERSPECTIVE
    const dieSize = 48; // Isometric radius
    // Die 1: Top Center
    draw3DIsometricDie(ctx, dishCenterX, dishCenterY - 48, dieSize, dice[0], -8);
    // Die 2: Bottom Left
    draw3DIsometricDie(ctx, dishCenterX - 55, dishCenterY + 46, dieSize, dice[1], 15);
    // Die 3: Bottom Right
    draw3DIsometricDie(ctx, dishCenterX + 55, dishCenterY + 46, dieSize, dice[2], -12);

    // RIGHT: TOTAL SCORE SCREEN BOX (BẢNG TỔNG ĐIỂM)
    const scoreBoxX = 660;
    const scoreBoxY = stageY + 12;
    const scoreBoxW = 486;
    const scoreBoxH = 305;
    const scoreBoxR = 24;

    ctx.save();
    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 12;
    // Dark glass background
    const scoreBg = ctx.createLinearGradient(scoreBoxX, scoreBoxY, scoreBoxX, scoreBoxY + scoreBoxH);
    scoreBg.addColorStop(0, 'rgba(40, 15, 27, 0.90)');
    scoreBg.addColorStop(0.5, 'rgba(25, 8, 16, 0.93)');
    scoreBg.addColorStop(1, 'rgba(15, 4, 9, 0.96)');
    ctx.fillStyle = scoreBg;
    drawRoundedRect(ctx, scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, scoreBoxR, true, false);
    ctx.restore();

    // Metallic Gold Border
    ctx.save();
    const scoreBorder = ctx.createLinearGradient(scoreBoxX, scoreBoxY, scoreBoxX + scoreBoxW, scoreBoxY + scoreBoxH);
    scoreBorder.addColorStop(0, '#ffd54f');
    scoreBorder.addColorStop(0.5, 'rgba(255, 193, 7, 0.35)');
    scoreBorder.addColorStop(1, '#ff8f00');
    ctx.strokeStyle = scoreBorder;
    ctx.lineWidth = 2.4;
    drawRoundedRect(ctx, scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, scoreBoxR, false, true);

    // Subtle inner grid line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, scoreBoxX + 6, scoreBoxY + 6, scoreBoxW - 12, scoreBoxH - 12, scoreBoxR - 4, false, true);
    ctx.restore();

    // Giant Glowing 3D Total Number (e.g. "13")
    ctx.save();
    ctx.font = `900 136px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const numY = scoreBoxY + 115;
    const numX = scoreBoxX + scoreBoxW / 2;

    // Glowing shadow
    ctx.shadowColor = isTai ? 'rgba(251, 191, 36, 0.85)' : 'rgba(56, 189, 248, 0.85)';
    ctx.shadowBlur = 35;

    // Number metallic gradient
    const numGrad = ctx.createLinearGradient(numX, numY - 65, numX, numY + 65);
    numGrad.addColorStop(0, '#ffffff');
    numGrad.addColorStop(0.2, '#fff9c4');
    numGrad.addColorStop(0.65, '#f59e0b');
    numGrad.addColorStop(1, '#b45309');

    ctx.fillStyle = numGrad;
    ctx.fillText(String(total), numX, numY);

    // Crisp outline for 3D metallic feel
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffe57f';
    ctx.strokeText(String(total), numX, numY);
    ctx.restore();

    // Lower Sub-Result Pill inside Score Box (TỔNG ĐIỂM • TÀI • LẺ)
    const subPillW = 380;
    const subPillH = 48;
    const subPillX = scoreBoxX + (scoreBoxW - subPillW) / 2;
    const subPillY = scoreBoxY + scoreBoxH - 68;

    ctx.save();
    const subPillBg = ctx.createLinearGradient(subPillX, subPillY, subPillX, subPillY + subPillH);
    subPillBg.addColorStop(0, 'rgba(20, 6, 12, 0.95)');
    subPillBg.addColorStop(1, 'rgba(38, 14, 25, 0.95)');
    ctx.fillStyle = subPillBg;
    ctx.strokeStyle = isTai ? 'rgba(251, 191, 36, 0.75)' : 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 1.6;
    drawRoundedRect(ctx, subPillX, subPillY, subPillW, subPillH, 24, true, true);

    ctx.font = `bold 19px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = isTai ? 'rgba(251, 191, 36, 0.65)' : 'rgba(56, 189, 248, 0.65)';
    ctx.shadowBlur = 10;
    ctx.fillText(`TỔNG ${total}  ✦  ${subResultStr}`, subPillX + subPillW / 2, subPillY + subPillH / 2);
    ctx.restore();

    // ==========================================
    // 5. BOTTOM SECTION: RESULT BOX & STATS
    // ==========================================
    const btmY = 460;
    const btmH = 195;

    // LEFT: PAYOUT / OUTCOME BOX
    const outBoxX = 54;
    const outBoxW = 480;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    const outBg = ctx.createLinearGradient(outBoxX, btmY, outBoxX, btmY + btmH);
    outBg.addColorStop(0, 'rgba(34, 11, 22, 0.90)');
    outBg.addColorStop(1, 'rgba(16, 5, 10, 0.94)');
    ctx.fillStyle = outBg;
    drawRoundedRect(ctx, outBoxX, btmY, outBoxW, btmH, 20, true, false);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = isWin ? 'rgba(52, 211, 153, 0.55)' : 'rgba(244, 63, 94, 0.55)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, outBoxX, btmY, outBoxW, btmH, 20, false, true);
    ctx.restore();

    // Badge Pill inside Outcome Box: THẮNG CƯỢC / THUA CƯỢC
    const badgeW = 220;
    const badgeH = 38;
    const badgeX = outBoxX + (outBoxW - badgeW) / 2;
    const badgeY = btmY + 22;

    ctx.save();
    const badgeBg = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeH);
    if (isWin) {
        badgeBg.addColorStop(0, 'rgba(16, 185, 129, 0.32)');
        badgeBg.addColorStop(1, 'rgba(6, 95, 70, 0.50)');
        ctx.strokeStyle = '#10b981';
    } else {
        badgeBg.addColorStop(0, 'rgba(239, 68, 68, 0.32)');
        badgeBg.addColorStop(1, 'rgba(153, 27, 27, 0.50)');
        ctx.strokeStyle = '#ef4444';
    }
    ctx.fillStyle = badgeBg;
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 19, true, true);

    // Glowing status gem
    ctx.beginPath();
    ctx.arc(badgeX + 24, badgeY + badgeH / 2, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = isWin ? '#34d399' : '#f87171';
    ctx.shadowColor = isWin ? '#10b981' : '#ef4444';
    ctx.shadowBlur = 12;
    ctx.fill();

    // Badge text
    ctx.font = `bold 16px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isWin ? '#6ee7b7' : '#fca5a5';
    ctx.fillText(isWin ? "THẮNG CƯỢC" : "THUA CƯỢC", badgeX + badgeW / 2 + 10, badgeY + badgeH / 2);
    ctx.restore();

    // Big Payout Text: e.g. "+ 6 TỶ" or "- 3 TỶ"
    ctx.save();
    ctx.font = `900 52px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const payY = btmY + 104;
    const payX = outBoxX + outBoxW / 2;

    if (isWin) {
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = 'rgba(16, 185, 129, 0.85)';
        ctx.shadowBlur = 24;
        ctx.fillText(`+ ${payout}`, payX, payY);
    } else {
        ctx.fillStyle = '#ff4365';
        ctx.shadowColor = 'rgba(255, 67, 101, 0.85)';
        ctx.shadowBlur = 24;
        ctx.fillText(`- ${betAmount}`, payX, payY);
    }
    ctx.restore();

    // Event or Hint subtext at bottom of Outcome Box
    ctx.save();
    ctx.font = `600 14px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (randomEvent) {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
        ctx.fillText(randomEvent, payX, btmY + 158);
    } else {
        ctx.fillStyle = '#94a3b8';
        const hint = isWin ? "⚡ Nhận thưởng thành công vào ví tài khoản!" : "⚡ Gợi ý: Có thể cược gấp đôi ở ván tiếp theo!";
        ctx.fillText(hint, payX, btmY + 158);
    }
    ctx.restore();

    // RIGHT: DETAILED BET INFORMATION TABLE
    const infoBoxX = 560;
    const infoBoxW = width - 54 - infoBoxX;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    const infoBg = ctx.createLinearGradient(infoBoxX, btmY, infoBoxX, btmY + btmH);
    infoBg.addColorStop(0, 'rgba(34, 11, 22, 0.90)');
    infoBg.addColorStop(1, 'rgba(16, 5, 10, 0.94)');
    ctx.fillStyle = infoBg;
    drawRoundedRect(ctx, infoBoxX, btmY, infoBoxW, btmH, 20, true, false);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
    ctx.lineWidth = 1.8;
    drawRoundedRect(ctx, infoBoxX, btmY, infoBoxW, btmH, 20, false, true);
    ctx.restore();

    // 3 Detailed Rows inside Info Box
    const rows = [
        {
            label: "BẠN ĐẶT",
            val: betType.toUpperCase(),
            valColor: '#ffffff',
            bullet: '#ef4444'
        },
        {
            label: "PHIÊN RA",
            val: `${total} (${subResultStr})`,
            valColor: '#fbbf24',
            bullet: '#e2e8f0'
        },
        {
            label: "TIỀN NHẬN",
            val: isWin ? `+ ${payout}` : "0",
            valColor: isWin ? '#34d399' : '#94a3b8',
            bullet: '#fbbf24'
        }
    ];

    const rowStartY = btmY + 44;
    const rowStep = 50;

    rows.forEach((r, idx) => {
        const ry = rowStartY + idx * rowStep;

        // Bullet Jewel
        ctx.save();
        ctx.beginPath();
        ctx.arc(infoBoxX + 38, ry, 6, 0, Math.PI * 2);
        ctx.fillStyle = r.bullet;
        ctx.shadowColor = r.bullet;
        ctx.shadowBlur = 8;
        ctx.fill();

        // Label
        ctx.font = `bold 16px ${fontFam}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#cbd5e1';
        ctx.shadowBlur = 0;
        ctx.fillText(r.label, infoBoxX + 58, ry);

        // Value
        ctx.font = `bold 22px ${fontFam}`;
        ctx.textAlign = 'right';
        ctx.fillStyle = r.valColor;
        ctx.shadowColor = r.valColor;
        ctx.shadowBlur = 10;
        ctx.fillText(r.val, infoBoxX + infoBoxW - 38, ry);
        ctx.restore();
    });

    // ==========================================
    // 6. BOTTOM HISTORY ROAD (CẦU LỊCH SỬ)
    // ==========================================
    const roadY = height - 76;
    const roadW = cardW - 32;
    const roadX = pad + 16;
    const roadH = 40;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 4, 9, 0.85)';
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.lineWidth = 1.2;
    drawRoundedRect(ctx, roadX, roadY, roadW, roadH, 20, true, true);

    // Label
    ctx.font = `bold 13px ${fontFam}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe57f';
    ctx.fillText("LỊCH SỬ CẦU:", roadX + 22, roadY + roadH / 2);

    // Beads legend
    ctx.font = `bold 13px ${fontFam}`;
    ctx.fillStyle = '#fbbf24';
    ctx.fillText("◆ TÀI", roadX + 130, roadY + roadH / 2);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText("◇ XỈU", roadX + 195, roadY + roadH / 2);

    // Streak items
    const streakStartX = roadX + 280;
    const beadGap = 34;

    streakHistory.slice(-14).forEach((item, idx) => {
        const bx = streakStartX + idx * beadGap;
        const by = roadY + roadH / 2;
        const isBeadTai = item === "TAI" || item === "TÀI";

        ctx.save();
        if (isBeadTai) {
            // Filled Gold Diamond
            ctx.fillStyle = '#f59e0b';
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(bx, by - 8);
            ctx.lineTo(bx + 8, by);
            ctx.lineTo(bx, by + 8);
            ctx.lineTo(bx - 8, by);
            ctx.closePath();
            ctx.fill();
        } else {
            // Hollow Cyan Diamond
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.2;
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(bx, by - 8);
            ctx.lineTo(bx + 8, by);
            ctx.lineTo(bx, by + 8);
            ctx.lineTo(bx - 8, by);
            ctx.closePath();
            ctx.stroke();
        }
        ctx.restore();
    });

    // Latest pulse indicator on the last bead
    const lastX = streakStartX + (Math.min(streakHistory.length, 14) - 1) * beadGap;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(lastX, roadY + roadH / 2, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    return canvas;
}

module.exports = { renderTaiXiuCard };

// Run standalone test if executed directly
if (require.main === module) {
    const artifactDir = 'C:/Users/Admin/.gemini/antigravity/brain/ac768565-bdf4-4686-beba-24907a26594d';
    
    // Sample 1: THUA CƯỢC (Exact match with user's screenshot: 4-4-5 = 13, bet Chẵn 3 Tỷ, result Lẻ)
    const cardLoss = renderTaiXiuCard({
        dice: [4, 4, 5],
        betType: "CHẴN",
        betAmount: "3 Tỷ",
        isWin: false,
        payout: "0",
        randomEvent: null,
        streakHistory: ["TAI", "TAI", "XIU", "TAI", "XIU", "XIU", "TAI", "TAI", "XIU", "TAI"]
    });
    const pathLoss = path.join(artifactDir, 'taixiu_sample_loss.png');
    fs.writeFileSync(pathLoss, cardLoss.toBuffer('image/png'));
    console.log('[OK] Rendered Loss Card:', pathLoss);

    // Sample 2: THẮNG CƯỢC (TÀI 15: 5-5-5 BỘ BA với sự kiện MAY MẮN +20% & Thưởng x10)
    const cardWin = renderTaiXiuCard({
        dice: [5, 5, 5],
        betType: "BỘ BA",
        betAmount: "1 Tỷ",
        isWin: true,
        payout: "12 Tỷ",
        randomEvent: "🍀 SỰ KIỆN MAY MẮN: +20% TIỀN THƯỞNG",
        streakHistory: ["XIU", "TAI", "XIU", "XIU", "TAI", "TAI", "XIU", "TAI", "TAI", "TAI"]
    });
    const pathWin = path.join(artifactDir, 'taixiu_sample_win.png');
    fs.writeFileSync(pathWin, cardWin.toBuffer('image/png'));
    console.log('[OK] Rendered Win Card:', pathWin);

    // Sample 3: JACKPOT ĐẶC BIỆT (TỔNG 18: 6-6-6 BỘ BA x30 THƯỞNG + SỰ KIỆN HŨ JACKPOT)
    const cardJackpot = renderTaiXiuCard({
        dice: [6, 6, 6],
        betType: "BỘ BA / TỔNG 18",
        betAmount: "1 Tỷ",
        isWin: true,
        payout: "30 Tỷ",
        randomEvent: "💎 SỰ KIỆN JACKPOT: NỔ HŨ THƯỞNG ĐẠI BẢO (X30)",
        streakHistory: ["XIU", "XIU", "TAI", "XIU", "TAI", "TAI", "XIU", "XIU", "TAI", "TAI", "TAI"]
    });
    const pathJackpot = path.join(artifactDir, 'taixiu_sample_jackpot.png');
    fs.writeFileSync(pathJackpot, cardJackpot.toBuffer('image/png'));
    console.log('[OK] Rendered Jackpot Card:', pathJackpot);
}
