const fs = require('fs-extra');
const path = require('path');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');

// Register high quality fonts
try {
    const fontBeVietnam = path.resolve(__dirname, '../modules/commands/cache/fonts/BeVietnamPro-Bold.ttf');
    if (fs.existsSync(fontBeVietnam)) {
        GlobalFonts.registerFromPath(fontBeVietnam, 'Be Vietnam Pro');
    }
    const fontPlay = path.resolve(__dirname, '../modules/commands/cache/Play-Bold.ttf');
    if (fs.existsSync(fontPlay)) {
        GlobalFonts.registerFromPath(fontPlay, 'Play');
    }
} catch (_) {}

const fontFam = '"Be Vietnam Pro", "Play", "Segoe UI", sans-serif';
const fontNumber = '"Play", "Be Vietnam Pro", sans-serif';

/**
 * Draws an Haute Horlogerie / Bespoke 3D Casino Die with realistic specular highlights
 */
function drawBespokeDie(ctx, x, y, size, topVal, rotDeg = 0, floatShadowDist = 20) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotDeg * Math.PI) / 180);

    const cos30 = 0.866;
    const sin30 = 0.5;
    const S = size;
    const H = S * 0.92;
    const fillet = S * 0.16;

    // 1. Dynamic levitation shadow on ground plane
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = S * 0.6;
    ctx.shadowOffsetY = floatShadowDist;
    ctx.fillStyle = 'rgba(2, 4, 8, 0.7)';
    ctx.beginPath();
    ctx.ellipse(0, H * 0.4 + floatShadowDist, S * 1.15, S * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Vertices of the isometric cube
    const pts = [
        [0, -S],
        [S * cos30, -S * sin30],
        [S * cos30, -S * sin30 + H],
        [0, H],
        [-S * cos30, -S * sin30 + H],
        [-S * cos30, -S * sin30]
    ];

    // 3. Rounded silhouette clip
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

    // Dark crimson body
    ctx.fillStyle = '#4a000e';
    ctx.fill();

    // Face 1: Left Face (Rich Velvet Red)
    const leftGrad = ctx.createLinearGradient(pts[5][0], pts[5][1], pts[3][0], pts[3][1]);
    leftGrad.addColorStop(0, '#c7002e');
    leftGrad.addColorStop(0.5, '#990022');
    leftGrad.addColorStop(1, '#4d0012');
    ctx.fillStyle = leftGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(pts[5][0], pts[5][1]); ctx.lineTo(pts[4][0], pts[4][1]); ctx.lineTo(pts[3][0], pts[3][1]);
    ctx.closePath();
    ctx.fill();

    // Face 2: Right Face (Deep Shade Red with Ambient Shadow)
    const rightGrad = ctx.createLinearGradient(0, 0, pts[2][0], pts[2][1]);
    rightGrad.addColorStop(0, '#88001e');
    rightGrad.addColorStop(0.6, '#5e0015');
    rightGrad.addColorStop(1, '#2a0009');
    ctx.fillStyle = rightGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(pts[1][0], pts[1][1]); ctx.lineTo(pts[2][0], pts[2][1]); ctx.lineTo(pts[3][0], pts[3][1]);
    ctx.closePath();
    ctx.fill();

    // Face 3: Top Face (Vibrant Ruby Highlighted with Direct Light)
    const topGrad = ctx.createLinearGradient(pts[0][0], pts[0][1], 0, 0);
    topGrad.addColorStop(0, '#ff3b65');
    topGrad.addColorStop(0.4, '#e11d48');
    topGrad.addColorStop(1, '#9f1239');
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(pts[1][0], pts[1][1]); ctx.lineTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[5][0], pts[5][1]);
    ctx.closePath();
    ctx.fill();

    // Chamfer highlights along interior edges
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(pts[0][0], pts[0][1]);
    ctx.moveTo(0, 0); ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.moveTo(0, 0); ctx.lineTo(pts[5][0], pts[5][1]);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(pts[3][0], pts[3][1]);
    ctx.stroke();

    // Pips rendering on the top face
    function drawTopPip(u, v, r, isGold = false) {
        const px = (u - v) * (S * cos30 * 0.48);
        const py = - (u + v) * (S * sin30 * 0.48) - S * 0.38;

        ctx.save();
        ctx.translate(px, py);
        ctx.scale(1, 0.58);

        // Ambient pip cavity shadow
        ctx.fillStyle = 'rgba(20, 0, 5, 0.65)';
        ctx.beginPath();
        ctx.arc(0, 2, r * 1.15, 0, Math.PI * 2);
        ctx.fill();

        // Enamel inlay
        const pipGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
        if (isGold) {
            pipGrad.addColorStop(0, '#fff3b0');
            pipGrad.addColorStop(0.5, '#d4af37');
            pipGrad.addColorStop(1, '#855800');
        } else {
            pipGrad.addColorStop(0, '#ffffff');
            pipGrad.addColorStop(0.6, '#f1f5f9');
            pipGrad.addColorStop(1, '#cbd5e1');
        }
        ctx.fillStyle = pipGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    const pr = S * 0.11;
    if (topVal === 1) {
        drawTopPip(0, 0, S * 0.18, true);
    } else if (topVal === 2) {
        drawTopPip(-0.7, -0.7, pr);
        drawTopPip(0.7, 0.7, pr);
    } else if (topVal === 3) {
        drawTopPip(-0.75, -0.75, pr);
        drawTopPip(0, 0, pr);
        drawTopPip(0.75, 0.75, pr);
    } else if (topVal === 4) {
        drawTopPip(-0.7, -0.7, pr);
        drawTopPip(0.7, -0.7, pr);
        drawTopPip(-0.7, 0.7, pr);
        drawTopPip(0.7, 0.7, pr);
    } else if (topVal === 5) {
        drawTopPip(-0.75, -0.75, pr);
        drawTopPip(0.75, -0.75, pr);
        drawTopPip(0, 0, pr);
        drawTopPip(-0.75, 0.75, pr);
        drawTopPip(0.75, 0.75, pr);
    } else if (topVal === 6) {
        drawTopPip(-0.75, -0.75, pr);
        drawTopPip(0.75, -0.75, pr);
        drawTopPip(-0.75, 0, pr);
        drawTopPip(0.75, 0, pr);
        drawTopPip(-0.75, 0.75, pr);
        drawTopPip(0.75, 0.75, pr);
    }

    // Side pips for realism
    function drawSidePip(x, y, r, isLeft) {
        ctx.save();
        ctx.translate(x, y);
        if (isLeft) ctx.transform(1, -sin30, 0, 1, 0, 0);
        else ctx.transform(1, sin30, 0, 1, 0, 0);

        ctx.fillStyle = 'rgba(25, 0, 5, 0.7)';
        ctx.beginPath();
        ctx.arc(0, 1, r * 1.1, 0, Math.PI * 2);
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
    ctx.restore(); // root
}

function drawRoundedRectCustom(ctx, x, y, w, h, r, fill = true, stroke = false) {
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
 * Renders the Premium Atelier Redesign (The Monte Carlo Bespoke Edition)
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
    const width = 1280;
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
    const subResultStr = `${taiXiuStr}  /  ${chanLeStr}${isTriple ? "  /  BỘ BA" : isPair ? "  /  ĐÔI" : ""}`;

    // 1. Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#06070a');
    bgGrad.addColorStop(0.4, '#0d0f17');
    bgGrad.addColorStop(0.8, '#12141f');
    bgGrad.addColorStop(1, '#08090d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle atmospheric glow
    const ambGlow = ctx.createRadialGradient(280, 380, 50, 280, 380, 480);
    ambGlow.addColorStop(0, 'rgba(244, 63, 94, 0.16)');
    ambGlow.addColorStop(0.4, 'rgba(217, 119, 6, 0.08)');
    ambGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = ambGlow;
    ctx.fillRect(0, 0, width, height);

    // Architectural fine grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    const gridStep = 40;
    for (let x = 0; x <= width; x += gridStep) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridStep) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // 2. Outer Swiss Precision Border & Crosshairs
    const outerPad = 30;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.28)';
    ctx.lineWidth = 1.2;
    drawRoundedRectCustom(ctx, outerPad, outerPad, width - outerPad * 2, height - outerPad * 2, 16, false, true);

    const cornerArm = 18;
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2.5;

    // Top-Left Crosshair
    ctx.beginPath();
    ctx.moveTo(outerPad - 6, outerPad + cornerArm);
    ctx.lineTo(outerPad - 6, outerPad - 6);
    ctx.lineTo(outerPad + cornerArm, outerPad - 6);
    ctx.stroke();

    // Top-Right Crosshair
    ctx.beginPath();
    ctx.moveTo(width - outerPad + 6 - cornerArm, outerPad - 6);
    ctx.lineTo(width - outerPad + 6, outerPad - 6);
    ctx.lineTo(width - outerPad + 6, outerPad + cornerArm);
    ctx.stroke();

    // Bottom-Left Crosshair
    ctx.beginPath();
    ctx.moveTo(outerPad - 6, height - outerPad - cornerArm + 6);
    ctx.lineTo(outerPad - 6, height - outerPad + 6);
    ctx.lineTo(outerPad + cornerArm, height - outerPad + 6);
    ctx.stroke();

    // Bottom-Right Crosshair
    ctx.beginPath();
    ctx.moveTo(width - outerPad + 6 - cornerArm, height - outerPad + 6);
    ctx.lineTo(width - outerPad + 6, height - outerPad + 6);
    ctx.lineTo(width - outerPad + 6, height - outerPad + 6 - cornerArm);
    ctx.stroke();

    // 3. Top Master Navigation Bar
    const topBarY = outerPad + 18;
    ctx.save();
    ctx.font = `bold 18px ${fontFam}`;
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    ctx.fillText("TÀI XỈU ĐẠI CHIẾN", outerPad + 24, topBarY + 16);

    ctx.font = `600 11px ${fontFam}`;
    ctx.fillStyle = '#d4af37';
    ctx.letterSpacing = '3px';
    ctx.fillText("HAUTE CASINO  •  EDITION N° 2026", outerPad + 24, topBarY + 34);

    // Right side: Wager Summary Chip
    const wagerPillW = 320;
    const wagerPillH = 44;
    const wagerPillX = width - outerPad - 24 - wagerPillW;
    const wagerPillY = topBarY;

    ctx.fillStyle = 'rgba(15, 17, 26, 0.85)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1;
    drawRoundedRectCustom(ctx, wagerPillX, wagerPillY, wagerPillW, wagerPillH, 12, true, true);

    ctx.font = `600 11px ${fontFam}`;
    ctx.fillStyle = '#94a3b8';
    ctx.letterSpacing = '2px';
    ctx.textAlign = 'left';
    ctx.fillText("TIỀN CƯỢC", wagerPillX + 18, wagerPillY + 27);

    ctx.font = `bold 18px ${fontFam}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`${betAmount} XU`, wagerPillX + wagerPillW - 18, wagerPillY + 28);
    ctx.restore();

    // 4. Main Body Layout
    const contentY = outerPad + 86;
    const contentH = 500;

    // --- LEFT CHAMBER: THE DYNAMIC LEVITATION ARC ---
    const leftChamberX = outerPad + 20;
    const leftChamberW = 440;

    ctx.save();
    const chamberBg = ctx.createLinearGradient(leftChamberX, contentY, leftChamberX + leftChamberW, contentY + contentH);
    chamberBg.addColorStop(0, 'rgba(25, 28, 42, 0.65)');
    chamberBg.addColorStop(0.5, 'rgba(15, 17, 26, 0.75)');
    chamberBg.addColorStop(1, 'rgba(8, 9, 14, 0.85)');
    ctx.fillStyle = chamberBg;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.2;
    drawRoundedRectCustom(ctx, leftChamberX, contentY, leftChamberW, contentH, 20, true, true);

    const arcCenterX = leftChamberX + leftChamberW / 2;
    const arcCenterY = contentY + 240;

    // Fine concentric orbital rings
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(arcCenterX, arcCenterY, 160, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(arcCenterX, arcCenterY, 195, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Soft pedestal reflection light on floor
    const pedGrad = ctx.createRadialGradient(arcCenterX, arcCenterY + 140, 20, arcCenterX, arcCenterY + 140, 140);
    pedGrad.addColorStop(0, 'rgba(244, 63, 94, 0.22)');
    pedGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.08)');
    pedGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pedGrad;
    ctx.beginPath();
    ctx.ellipse(arcCenterX, arcCenterY + 140, 150, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chamber Label Header
    ctx.font = `700 11px ${fontFam}`;
    ctx.fillStyle = '#94a3b8';
    ctx.letterSpacing = '2px';
    ctx.textAlign = 'center';
    ctx.fillText("KẾT QUẢ 3 XÚC XẮC  •  RUBY EDITION", arcCenterX, contentY + 36);

    // 3 Levitating Dice on dynamic perspective arc
    const dieRadius = 52;
    drawBespokeDie(ctx, arcCenterX - 8, arcCenterY - 78, dieRadius, dice[0], -8, 30);
    drawBespokeDie(ctx, arcCenterX - 78, arcCenterY + 68, dieRadius, dice[1], 16, 12);
    drawBespokeDie(ctx, arcCenterX + 76, arcCenterY + 62, dieRadius, dice[2], -14, 15);

    // Bottom Micro-Pill
    const sumPillW = 180;
    const sumPillH = 34;
    const sumPillX = arcCenterX - sumPillW / 2;
    const sumPillY = contentY + contentH - 54;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 1;
    drawRoundedRectCustom(ctx, sumPillX, sumPillY, sumPillW, sumPillH, 17, true, true);

    ctx.font = `bold 14px ${fontFam}`;
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(`${dice[0]}   +   ${dice[1]}   +   ${dice[2]}   =   ${total}`, arcCenterX, sumPillY + 22);
    ctx.restore();

    // --- RIGHT DECK: EDITORIAL TOTAL & TRANSACTION DASHBOARD ---
    const rightDeckX = leftChamberX + leftChamberW + 24;
    const rightDeckW = width - outerPad - 20 - rightDeckX;

    // 4A. TOP RIGHT CARD: EDITORIAL TOTAL SCORE DISPLAY
    const scoreCardH = 220;

    ctx.save();
    const scoreCardBg = ctx.createLinearGradient(rightDeckX, contentY, rightDeckX + rightDeckW, contentY + scoreCardH);
    scoreCardBg.addColorStop(0, 'rgba(25, 28, 42, 0.65)');
    scoreCardBg.addColorStop(1, 'rgba(12, 14, 22, 0.85)');
    ctx.fillStyle = scoreCardBg;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.2;
    drawRoundedRectCustom(ctx, rightDeckX, contentY, rightDeckW, scoreCardH, 20, true, true);

    ctx.font = `700 11px ${fontFam}`;
    ctx.fillStyle = '#94a3b8';
    ctx.letterSpacing = '3px';
    ctx.fillText("TỔNG ĐIỂM PHIÊN NÀY", rightDeckX + 36, contentY + 40);

    // GIGANTIC SCULPTED METALLIC DIGIT
    ctx.font = `900 128px ${fontNumber}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const numY = contentY + 120;
    const numX = rightDeckX + 32;

    const goldNumGrad = ctx.createLinearGradient(numX, numY - 60, numX + 160, numY + 60);
    goldNumGrad.addColorStop(0, '#ffffff');
    goldNumGrad.addColorStop(0.25, '#ffe57f');
    goldNumGrad.addColorStop(0.65, '#f59e0b');
    goldNumGrad.addColorStop(1, '#92400e');

    ctx.fillStyle = goldNumGrad;
    ctx.shadowColor = isTai ? 'rgba(245, 158, 11, 0.5)' : 'rgba(56, 189, 248, 0.5)';
    ctx.shadowBlur = 24;
    ctx.fillText(String(total), numX, numY);

    // Right Side of Score Card: Tag Pills & Result Taxonomy
    const tagCenterX = rightDeckX + rightDeckW - 180;
    
    // Pill 1: TÀI or XỈU
    const pill1W = 160;
    const pill1H = 42;
    const pill1Y = contentY + 45;
    ctx.save();
    ctx.fillStyle = isTai ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)';
    ctx.strokeStyle = isTai ? '#f59e0b' : '#38bdf8';
    ctx.lineWidth = 1.4;
    drawRoundedRectCustom(ctx, tagCenterX - pill1W / 2, pill1Y, pill1W, pill1H, 10, true, true);
    ctx.font = `bold 16px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = isTai ? '#fbbf24' : '#7dd3fc';
    ctx.fillText(`CỬA ${taiXiuStr}  (${isTai ? '11–18' : '3–10'})`, tagCenterX, pill1Y + 26);
    ctx.restore();

    // Pill 2: CHẴN or LẺ + SPECIAL COMBINATION
    const pill2Y = contentY + 102;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    drawRoundedRectCustom(ctx, tagCenterX - pill1W / 2, pill2Y, pill1W, pill1H, 10, true, true);
    ctx.font = `bold 14px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(isTriple ? "BỘ BA ĐẶC BIỆT" : isPair ? `ĐÔI  •  ${chanLeStr}` : `SỐ ${chanLeStr}`, tagCenterX, pill2Y + 26);
    ctx.restore();

    // Divider accent line inside score card
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(rightDeckX + 36, contentY + scoreCardH - 35);
    ctx.lineTo(rightDeckX + rightDeckW - 36, contentY + scoreCardH - 35);
    ctx.stroke();

    ctx.font = `600 12px ${fontFam}`;
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText(`PHÂN LOẠI TOÀN BỘ: ${subResultStr}`, rightDeckX + 36, contentY + scoreCardH - 18);
    ctx.restore();

    // 4B. BOTTOM RIGHT CARD: THE FINANCIAL SETTLEMENT & BET SUMMARY
    const settleY = contentY + scoreCardH + 18;
    const settleH = contentH - scoreCardH - 18;

    ctx.save();
    const settleBg = ctx.createLinearGradient(rightDeckX, settleY, rightDeckX + rightDeckW, settleY + settleH);
    settleBg.addColorStop(0, 'rgba(25, 28, 42, 0.65)');
    settleBg.addColorStop(1, 'rgba(12, 14, 22, 0.85)');
    ctx.fillStyle = settleBg;
    ctx.strokeStyle = isWin ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)';
    ctx.lineWidth = 1.2;
    drawRoundedRectCustom(ctx, rightDeckX, settleY, rightDeckW, settleH, 20, true, true);

    const outcomeColW = 310;
    
    // Status Badge
    const badgeW = 160;
    const badgeH = 34;
    const badgeX = rightDeckX + 32;
    const badgeY = settleY + 30;

    ctx.save();
    ctx.fillStyle = isWin ? 'rgba(16, 185, 129, 0.16)' : 'rgba(244, 63, 94, 0.16)';
    ctx.strokeStyle = isWin ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 1.2;
    drawRoundedRectCustom(ctx, badgeX, badgeY, badgeW, badgeH, 17, true, true);

    // Status beacon dot
    ctx.beginPath();
    ctx.arc(badgeX + 20, badgeY + badgeH / 2, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isWin ? '#34d399' : '#fb7185';
    ctx.shadowColor = isWin ? '#10b981' : '#f43f5e';
    ctx.shadowBlur = 8;
    ctx.fill();

    ctx.font = `bold 13px ${fontFam}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isWin ? '#6ee7b7' : '#fda4af';
    ctx.fillText(isWin ? "THẮNG CƯỢC" : "THUA CƯỢC", badgeX + 34, badgeY + badgeH / 2);
    ctx.restore();

    // Financial Big Payout Display
    ctx.save();
    ctx.font = `bold 46px ${fontNumber}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const payX = rightDeckX + 32;
    const payY = settleY + 105;

    if (isWin) {
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
        ctx.shadowBlur = 18;
        ctx.fillText(`+ ${payout}`, payX, payY);
    } else {
        ctx.fillStyle = '#ff476d';
        ctx.shadowColor = 'rgba(255, 71, 109, 0.6)';
        ctx.shadowBlur = 18;
        ctx.fillText(`- ${betAmount}`, payX, payY);
    }

    // Event or Hint caption below amount
    ctx.textBaseline = 'middle';
    if (randomEvent) {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = 'rgba(251, 191, 36, 0.4)';
        ctx.shadowBlur = 4;
        ctx.font = `600 11px ${fontFam}`;

        const maxTextW = outcomeColW - 60;
        if (ctx.measureText(randomEvent).width > maxTextW) {
            const parts = randomEvent.split(':');
            if (parts.length > 1) {
                ctx.fillText(parts[0].trim(), payX, settleY + 152);
                ctx.fillStyle = '#fde68a';
                ctx.font = `bold 12px ${fontFam}`;
                ctx.fillText(parts.slice(1).join(':').trim(), payX, settleY + 170);
            } else {
                ctx.fillText(randomEvent.slice(0, 30) + '...', payX, settleY + 160);
            }
        } else {
            ctx.fillText(randomEvent, payX, settleY + 160);
        }
    } else {
        ctx.fillStyle = '#64748b';
        ctx.font = `500 11px ${fontFam}`;
        const hint = isWin ? "⚡ Đã cộng vào số dư tài khoản" : "⚡ Gợi ý: Có thể cược nhân đôi ở ván tiếp theo";
        ctx.fillText(hint, payX, settleY + 160);
    }
    ctx.restore();

    // Divider Line inside settlement card
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(rightDeckX + outcomeColW, settleY + 24);
    ctx.lineTo(rightDeckX + outcomeColW, settleY + settleH - 24);
    ctx.stroke();

    // Right Section of Settlement Card: Minimalist High-Density Data Grid
    const gridX = rightDeckX + outcomeColW + 28;
    const gridW = rightDeckW - outcomeColW - 56;

    const summaryRows = [
        { label: "CỬA ĐẶT CỦA BẠN", val: betType.toUpperCase(), color: '#ffffff' },
        { label: "KẾT QUẢ PHIÊN", val: `${total} (${subResultStr})`, color: '#d4af37' },
        { label: "TIỀN THỰC NHẬN", val: isWin ? `+ ${payout}` : "0 XU", color: isWin ? '#34d399' : '#94a3b8' }
    ];

    const rowStart = settleY + 48;
    const rowGap = 56;

    summaryRows.forEach((r, idx) => {
        const ry = rowStart + idx * rowGap;

        ctx.font = `600 11px ${fontFam}`;
        ctx.fillStyle = '#64748b';
        ctx.letterSpacing = '1.5px';
        ctx.textAlign = 'left';
        ctx.fillText(r.label, gridX, ry);

        ctx.font = `bold 18px ${fontFam}`;
        ctx.fillStyle = r.color;
        ctx.textAlign = 'left';
        ctx.fillText(r.val, gridX, ry + 24);

        if (idx < summaryRows.length - 1) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.beginPath();
            ctx.moveTo(gridX, ry + 36); ctx.lineTo(gridX + gridW, ry + 36);
            ctx.stroke();
        }
    });

    ctx.restore();

    // 5. Bottom Minimalist Pearl History Road
    const roadY = height - outerPad - 46;
    const roadH = 34;
    const roadX = outerPad + 20;
    const roadW = width - outerPad * 2 - 40;

    ctx.save();
    ctx.fillStyle = 'rgba(10, 12, 18, 0.65)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    drawRoundedRectCustom(ctx, roadX, roadY, roadW, roadH, 10, true, true);

    ctx.font = `bold 11px ${fontFam}`;
    ctx.fillStyle = '#94a3b8';
    ctx.letterSpacing = '1.5px';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText("SO CẦU LỊCH SỬ:", roadX + 16, roadY + roadH / 2);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText("TÀI", roadX + 130, roadY + roadH / 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText("XỈU", roadX + 175, roadY + roadH / 2);

    // Diamond Beads
    const historyStart = roadX + 230;
    const beadGap = 28;
    const maxBeads = 15;
    const recentStreak = (streakHistory || []).slice(-maxBeads);

    recentStreak.forEach((item, i) => {
        const bx = historyStart + i * beadGap;
        const by = roadY + roadH / 2;
        const isTaiBead = (item === "TAI" || item === "tài" || item === true);

        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(Math.PI / 4);

        if (isTaiBead) {
            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = 'rgba(251, 191, 36, 0.5)';
            ctx.shadowBlur = 4;
            ctx.fillRect(-4.5, -4.5, 9, 9);
        } else {
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.6;
            ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
            ctx.shadowBlur = 4;
            ctx.strokeRect(-4.5, -4.5, 9, 9);
        }
        ctx.restore();
    });

    // Halo ring on latest bead
    if (recentStreak.length > 0) {
        const lastIndex = recentStreak.length - 1;
        const lastPearlX = historyStart + lastIndex * beadGap;
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(lastPearlX, roadY + roadH / 2, 12, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();

    return canvas;
}

module.exports = {
    renderTaiXiuCard
};
