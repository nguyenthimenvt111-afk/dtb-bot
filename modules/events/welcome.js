const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");
const axios = require("axios");

let Canvas = null;
try {
    Canvas = require("canvas");
} catch (e) {
    console.warn("[welcomeEvent] Thư viện 'canvas' chưa khả dụng hoặc thiếu thư viện hệ thống (" + e.message + "). Bot sẽ gửi dạng thông báo văn bản chi tiết.");
}

module.exports.config = {
    name: "welcomeEvent",
    eventType: ["log:subscribe"],
    version: "2.6.0",
    credits: "dtb",
    description: "Tự động vẽ card Canvas chào mừng thành viên mới với avatar và thông tin động"
};

// Ensure fonts and cache
const fontPath = path.resolve(__dirname, "../commands/cache/fonts/BeVietnamPro-Bold.ttf");
let fontFam = "Segoe UI, Arial, sans-serif";
if (Canvas && Canvas.registerFont && fs.existsSync(fontPath)) {
    try {
        Canvas.registerFont(fontPath, { family: "Be Vietnam Pro" });
        fontFam = '"Be Vietnam Pro", Segoe UI, sans-serif';
    } catch (_) {}
}

const cacheDir = path.resolve(__dirname, "cache");
fs.ensureDirSync(cacheDir);

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

function truncateText(ctx, text, maxWidth) {
    if (!text) return "";
    let width = ctx.measureText(text).width;
    if (width <= maxWidth) return text;
    while (width > maxWidth && text.length > 0) {
        text = text.slice(0, -1);
        width = ctx.measureText(text + "...").width;
    }
    return text + "...";
}

async function renderWelcomeCard({ uid, name, threadName, memberIndex, timeString }) {
    if (!Canvas || !Canvas.createCanvas) return null;
    const { createCanvas, loadImage } = Canvas;
    const width = 1280;
    const height = 720;
    const cvs = createCanvas(width, height);
    const ctx = cvs.getContext("2d");

    // 1. Deep Space Cyber Dark Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#060913');
    bgGrad.addColorStop(0.4, '#0a1026');
    bgGrad.addColorStop(0.8, '#120d24');
    bgGrad.addColorStop(1, '#080512');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient Cosmic Glows
    function drawGlowOrb(x, y, radius, color, alpha) {
        const radial = ctx.createRadialGradient(x, y, 0, x, y, radius);
        radial.addColorStop(0, color);
        radial.addColorStop(0.5, color.replace(/[\d\.]+\)$/, `${alpha * 0.4})`));
        radial.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.save();
        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawGlowOrb(220, 180, 360, 'rgba(0, 242, 254, 0.22)', 0.22);
    drawGlowOrb(1080, 520, 400, 'rgba(155, 81, 224, 0.25)', 0.25);
    drawGlowOrb(640, 100, 280, 'rgba(255, 126, 95, 0.15)', 0.15);
    drawGlowOrb(1000, 160, 250, 'rgba(0, 230, 118, 0.12)', 0.12);

    // 3. Constellation & Grid Overlay
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y <= height; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    const stars = [
        { x: 120, y: 100, r: 2.2, a: 0.8 }, { x: 300, y: 80, r: 1.5, a: 0.6 },
        { x: 1150, y: 120, r: 2.5, a: 0.85 }, { x: 1020, y: 220, r: 1.8, a: 0.7 },
        { x: 180, y: 620, r: 2.0, a: 0.75 }, { x: 950, y: 640, r: 1.6, a: 0.6 }
    ];
    for (const s of stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // 4. Center Glassmorphic Card Container
    const cardX = 90;
    const cardY = 60;
    const cardW = 1100;
    const cardH = 600;
    const cardR = 30;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR, true, false);
    ctx.restore();

    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    cardGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    cardGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)');
    cardGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = cardGrad;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR, true, false);

    const borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    borderGrad.addColorStop(0, '#00f2fe');
    borderGrad.addColorStop(0.35, '#4facfe');
    borderGrad.addColorStop(0.7, '#9b51e0');
    borderGrad.addColorStop(1, '#ff007f');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR, false, true);

    // Tech Corner Brackets
    ctx.save();
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 3.5;
    const cornerSize = 25;
    ctx.beginPath();
    ctx.moveTo(cardX - 5, cardY + cornerSize); ctx.lineTo(cardX - 5, cardY - 5); ctx.lineTo(cardX + cornerSize, cardY - 5);
    ctx.moveTo(cardX + cardW + 5 - cornerSize, cardY - 5); ctx.lineTo(cardX + cardW + 5, cardY - 5); ctx.lineTo(cardX + cardW + 5, cardY + cornerSize);
    ctx.moveTo(cardX - 5, cardY + cardH - cornerSize); ctx.lineTo(cardX - 5, cardY + cardH + 5); ctx.lineTo(cardX + cornerSize, cardY + cardH + 5);
    ctx.moveTo(cardX + cardW + 5 - cornerSize, cardY + cardH + 5); ctx.lineTo(cardX + cardW + 5, cardY + cardH + 5); ctx.lineTo(cardX + cardW + 5, cardY + cardH - cornerSize);
    ctx.stroke();
    ctx.restore();

    // 5. Header Pill Badge
    const pillW = 380;
    const pillH = 42;
    const pillX = width / 2 - pillW / 2;
    const pillY = cardY + 28;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 242, 254, 0.12)';
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.45)';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 21, true, true);

    ctx.font = `bold 15px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#00f2fe';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 12;
    ctx.fillText('✦  CHÀO MỪNG THÀNH VIÊN MỚI  ✦', width / 2, pillY + pillH / 2);
    ctx.restore();

    // 6. Avatar Section
    const avatarCenterX = width / 2;
    const avatarCenterY = cardY + 165;
    const avatarRadius = 68;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 18, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 8, 0, Math.PI * 2);
    const ringGrad = ctx.createLinearGradient(avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarCenterX + avatarRadius, avatarCenterY + avatarRadius);
    ringGrad.addColorStop(0, '#00f2fe');
    ringGrad.addColorStop(0.5, '#7f00ff');
    ringGrad.addColorStop(1, '#ff007f');
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.restore();

    // Draw User Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    let avatarLoaded = false;
    try {
        const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const resp = await axios.get(avatarUrl, {
            responseType: "arraybuffer",
            timeout: 2500,
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
        if (resp && resp.status === 200 && resp.data) {
            const avatarImg = await loadImage(Buffer.from(resp.data));
            ctx.drawImage(avatarImg, avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
            avatarLoaded = true;
        }
    } catch (_) {}

    if (!avatarLoaded) {
        const avGrad = ctx.createLinearGradient(avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarCenterX + avatarRadius, avatarCenterY + avatarRadius);
        avGrad.addColorStop(0, '#1f2937');
        avGrad.addColorStop(0.5, '#374151');
        avGrad.addColorStop(1, '#111827');
        ctx.fillStyle = avGrad;
        ctx.fillRect(avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2);

        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY - 18, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY + 62, 54, Math.PI, 0, false);
        ctx.fill();
    }
    ctx.restore();

    // Online Status Green Dot
    const dotX = avatarCenterX + avatarRadius * 0.72;
    const dotY = avatarCenterY + avatarRadius * 0.72;
    ctx.save();
    ctx.shadowColor = '#00e676';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#00e676';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0a1026';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();

    // 7. Member Name
    ctx.save();
    ctx.font = `bold 38px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 242, 254, 0.5)';
    ctx.shadowBlur = 16;
    const safeName = truncateText(ctx, name, 800);
    ctx.fillText(safeName, width / 2, cardY + 288);
    ctx.restore();

    // Subtitle
    ctx.save();
    ctx.font = `500 19px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Rất vui được chào đón bạn gia nhập đại gia đình của chúng tôi!', width / 2, cardY + 326);
    ctx.restore();

    // 8. Three Stat Pills
    const statY = cardY + 368;
    const statW = 310;
    const statH = 82;
    const gap = 25;
    const totalStatsW = 3 * statW + 2 * gap;
    const startX = width / 2 - totalStatsW / 2;

    const stats = [
        {
            icon: '🏠',
            title: 'NHÓM CHAT',
            value: truncateText(ctx, threadName, 220),
            color: '#38bdf8'
        },
        {
            icon: '👥',
            title: 'VỊ TRÍ THÀNH VIÊN',
            value: `Thành viên thứ #${memberIndex}`,
            color: '#fbbf24'
        },
        {
            icon: '⏰',
            title: 'THỜI GIAN GIA NHẬP',
            value: timeString,
            color: '#a78bfa'
        }
    ];

    stats.forEach((st, idx) => {
        const sx = startX + idx * (statW + gap);
        ctx.save();
        ctx.fillStyle = 'rgba(30, 41, 59, 0.55)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
        ctx.lineWidth = 1.2;
        drawRoundedRect(ctx, sx, statY, statW, statH, 18, true, true);

        const icX = sx + 34;
        const icY = statY + statH / 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.arc(icX, icY, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '22px Segoe UI Emoji, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.icon, icX, icY + 1);

        ctx.font = `bold 12px ${fontFam}`;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#64748b';
        ctx.fillText(st.title, sx + 68, statY + 28);

        ctx.font = `bold 15px ${fontFam}`;
        ctx.fillStyle = st.color;
        ctx.shadowColor = st.color;
        ctx.shadowBlur = 8;
        ctx.fillText(st.value, sx + 68, statY + 54);
        ctx.restore();
    });

    // 9. Rules Notice Banner
    const tipY = cardY + 482;
    const tipW = 860;
    const tipH = 46;
    const tipX = width / 2 - tipW / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, tipX, tipY, tipW, tipH, 23, true, true);

    ctx.font = `14px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('💡 Hãy đọc kỹ quy định nhóm và cùng tương tác vui vẻ, tôn trọng lẫn nhau bạn nhé!', width / 2, tipY + tipH / 2);
    ctx.restore();

    // 10. Footer Branding
    ctx.save();
    ctx.font = `bold 13px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00f2fe';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 10;
    ctx.fillText('⚡ POWERED BY DTB BOT SYSTEM ⚡', width / 2, cardY + cardH - 24);
    ctx.restore();

    const filePath = path.join(cacheDir, `welcome_${uid}_${Date.now()}.png`);
    fs.writeFileSync(filePath, cvs.toBuffer("image/png"));
    return filePath;
}

module.exports.run = async function ({ api, event, Threads, Users }) {
    try {
        const { threadID, logMessageData, author } = event;
        if (!logMessageData || !Array.isArray(logMessageData.addedParticipants) || logMessageData.addedParticipants.length === 0) return;

        const threadData = (await Threads.getData(threadID)) || {};
        const cachedData = (global.data.threadData && global.data.threadData.get(String(threadID))) || {};
        const data = { ...cachedData, ...(threadData.data || {}) };
        if (data.welcome === false) return; // Only skip if explicitly turned off

        const addedParticipants = logMessageData.addedParticipants;
        const botID = String(api.getCurrentUserID());

        let adderName = "Người dùng Facebook";
        try {
            adderName = (global.data.userName && global.data.userName.get(String(author))) || await Users.getNameUser(author) || adderName;
        } catch (_) {}

        let threadInfo = (global.data.threadInfo && global.data.threadInfo.get(String(threadID))) || {};
        try {
            const fresh = await Promise.race([
                api.getThreadInfo(threadID),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500))
            ]);
            if (fresh && fresh.threadName) threadInfo = fresh;
        } catch (_) {}

        const threadName = threadInfo.threadName || "Nhóm chat";
        const totalMembers = (threadInfo.participantIDs || []).length || "---";
        const timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

        for (let i = 0; i < addedParticipants.length; i++) {
            const user = addedParticipants[i];
            const addedID = String(user.userFbId);
            if (addedID === botID) continue; // Skip if bot itself joined

            let addedName = user.fullName || "Thành viên mới";
            try {
                const uInfo = await Promise.race([
                    api.getUserInfo(addedID),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
                ]);
                if (uInfo && uInfo[addedID] && uInfo[addedID].name) addedName = uInfo[addedID].name;
            } catch (_) {}

            let cardPath = null;
            try {
                cardPath = await renderWelcomeCard({
                    uid: addedID,
                    name: addedName,
                    threadName,
                    memberIndex: totalMembers,
                    timeString: timeNow
                });
            } catch (err) {
                console.error("Lỗi vẽ canvas welcome:", err);
            }

            const welcomeMsg = 
`╔═════════════════════════╗
   🎉 CHÀO MỪNG THÀNH VIÊN MỚI
╚═════════════════════════╝
👤 Thành viên: ${addedName}
🏠 Nhóm: ${threadName}
👥 Vị trí: Thành viên thứ #${totalMembers}
⏰ Thời gian: ${timeNow}
Người thêm: ${adderName}
──────────────────────────
Chúc bạn có những giây phút vui vẻ và ý nghĩa tại nhóm!`;

            const payload = { body: welcomeMsg };
            if (cardPath && fs.existsSync(cardPath)) {
                try {
                    const stream = fs.createReadStream(cardPath);
                    stream.on("error", (err) => {
                        console.error("[welcomeEvent] Stream error:", err.message);
                        try { fs.unlinkSync(cardPath); } catch (_) {}
                    });
                    stream.on("close", () => {
                        try { fs.unlinkSync(cardPath); } catch (_) {}
                    });
                    payload.attachment = stream;
                } catch (_) {}
            }

            api.sendMessage(payload, threadID, (err) => {
                if (err) {
                    console.error("[welcomeEvent] Lỗi gửi card welcome, gửi fallback text:", err);
                    api.sendMessage(welcomeMsg, threadID);
                    if (cardPath) {
                        try { fs.unlinkSync(cardPath); } catch (_) {}
                    }
                }
            });

            // Small delay between multiple users
            if (i < addedParticipants.length - 1) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    } catch (err) {
        console.error("Lỗi welcomeEvent:", err);
    }
};
