const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");
const axios = require("axios");
const { createCanvas, loadImage, registerFont } = require("canvas");

module.exports.config = {
    name: "leavenoti",
    eventType: ["log:unsubscribe"],
    version: "2.5.0",
    credits: "dtb",
    description: "Tự động vẽ card Canvas thành viên rời nhóm hoặc bị kick với avatar và thông tin động"
};

// Ensure fonts and cache
const fontPath = path.resolve(__dirname, "../commands/cache/fonts/BeVietnamPro-Bold.ttf");
let fontFam = "Segoe UI, Arial, sans-serif";
if (fs.existsSync(fontPath)) {
    try {
        registerFont(fontPath, { family: "Be Vietnam Pro" });
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

async function renderLeaveCard({ uid, name, threadName, currentMembers, isSelfLeave, timeString }) {
    const width = 1280;
    const height = 720;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 1. Deep Obsidian Crimson Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0c0407');
    bgGrad.addColorStop(0.35, '#18070d');
    bgGrad.addColorStop(0.7, '#1f0a14');
    bgGrad.addColorStop(1, '#0a0206');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient Crimson Glowing Orbs
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

    drawGlowOrb(240, 200, 380, 'rgba(255, 15, 60, 0.25)', 0.25);
    drawGlowOrb(1060, 520, 420, 'rgba(255, 87, 34, 0.22)', 0.22);
    drawGlowOrb(640, 100, 300, 'rgba(194, 24, 91, 0.18)', 0.18);
    drawGlowOrb(980, 180, 260, 'rgba(255, 61, 0, 0.14)', 0.14);

    // 3. Cyber Tech Grid & Hazard Floating Embers
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 50, 75, 0.04)';
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

    const embers = [
        { x: 140, y: 120, r: 2.4, a: 0.8 }, { x: 280, y: 90, r: 1.6, a: 0.6 },
        { x: 1140, y: 140, r: 2.5, a: 0.85 }, { x: 1040, y: 240, r: 1.8, a: 0.7 },
        { x: 160, y: 600, r: 2.2, a: 0.75 }, { x: 920, y: 630, r: 1.8, a: 0.65 }
    ];
    for (const e of embers) {
        ctx.fillStyle = `rgba(255, 75, 75, ${e.a})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
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
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 45;
    ctx.shadowOffsetY = 22;
    ctx.fillStyle = 'rgba(25, 12, 18, 0.76)';
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR, true, false);
    ctx.restore();

    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    cardGrad.addColorStop(0, 'rgba(255, 255, 255, 0.07)');
    cardGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)');
    cardGrad.addColorStop(1, 'rgba(255, 50, 50, 0.04)');
    ctx.fillStyle = cardGrad;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR, true, false);

    const borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    borderGrad.addColorStop(0, '#ff0844');
    borderGrad.addColorStop(0.35, '#ff4e50');
    borderGrad.addColorStop(0.7, '#f857a6');
    borderGrad.addColorStop(1, '#ff3366');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR, false, true);

    // Hazard Tech Corner Brackets
    ctx.save();
    ctx.strokeStyle = '#ff2a55';
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
    const pillW = 420;
    const pillH = 42;
    const pillX = width / 2 - pillW / 2;
    const pillY = cardY + 28;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 8, 68, 0.15)';
    ctx.strokeStyle = 'rgba(255, 8, 68, 0.55)';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 21, true, true);

    ctx.font = `bold 15px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff3366';
    ctx.shadowColor = '#ff0844';
    ctx.shadowBlur = 14;
    const headerTitle = isSelfLeave ? '✦  THÀNH VIÊN ĐÃ RỜI NHÓM  ✦' : '✦  THÀNH VIÊN ĐÃ BỊ KICK  ✦';
    ctx.fillText(headerTitle, width / 2, pillY + pillH / 2);
    ctx.restore();

    // 6. Avatar Section
    const avatarCenterX = width / 2;
    const avatarCenterY = cardY + 165;
    const avatarRadius = 68;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 18, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 50, 75, 0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 8, 0, Math.PI * 2);
    const ringGrad = ctx.createLinearGradient(avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarCenterX + avatarRadius, avatarCenterY + avatarRadius);
    ringGrad.addColorStop(0, '#ff0844');
    ringGrad.addColorStop(0.5, '#ff4e50');
    ringGrad.addColorStop(1, '#9b111e');
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.shadowColor = '#ff0844';
    ctx.shadowBlur = 20;
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
        avGrad.addColorStop(0, '#2a111a');
        avGrad.addColorStop(0.5, '#3d1c27');
        avGrad.addColorStop(1, '#18070d');
        ctx.fillStyle = avGrad;
        ctx.fillRect(avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2);

        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY - 18, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY + 62, 54, Math.PI, 0, false);
        ctx.fill();
    }
    ctx.restore();

    // Red Warning Exit Badge
    const dotX = avatarCenterX + avatarRadius * 0.72;
    const dotY = avatarCenterY + avatarRadius * 0.72;
    ctx.save();
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#18070d';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(dotX - 5, dotY - 5); ctx.lineTo(dotX + 5, dotY + 5);
    ctx.moveTo(dotX + 5, dotY - 5); ctx.lineTo(dotX - 5, dotY + 5);
    ctx.stroke();
    ctx.restore();

    // 7. Member Name
    ctx.save();
    ctx.font = `bold 38px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 50, 75, 0.6)';
    ctx.shadowBlur = 18;
    const safeName = truncateText(ctx, name, 800);
    ctx.fillText(safeName, width / 2, cardY + 288);
    ctx.restore();

    // Subtitle
    ctx.save();
    ctx.font = `500 19px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fca5a5';
    const subText = isSelfLeave ? 'Đã tự rời khỏi nhóm chat.' : 'Đã bị Quản trị viên xóa khỏi nhóm.';
    ctx.fillText(subText, width / 2, cardY + 326);
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
            color: '#f87171'
        },
        {
            icon: '📉',
            title: 'THÀNH VIÊN HIỆN TẠI',
            value: `Còn lại ${currentMembers} thành viên`,
            color: '#fb923c'
        },
        {
            icon: '⏱',
            title: 'THỜI GIAN RỜI NHÓM',
            value: timeString,
            color: '#f43f5e'
        }
    ];

    stats.forEach((st, idx) => {
        const sx = startX + idx * (statW + gap);
        ctx.save();
        ctx.fillStyle = 'rgba(45, 18, 28, 0.6)';
        ctx.strokeStyle = 'rgba(255, 80, 100, 0.12)';
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
        ctx.fillStyle = '#9ca3af';
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
    ctx.fillStyle = 'rgba(25, 10, 16, 0.55)';
    ctx.strokeStyle = 'rgba(255, 50, 75, 0.28)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, tipX, tipY, tipW, tipH, 23, true, true);

    ctx.font = `14px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('🛡️ Nhóm luôn duy trì môi trường văn minh, tôn trọng. Hãy luôn tuân thủ quy tắc nhóm nhé!', width / 2, tipY + tipH / 2);
    ctx.restore();

    // 10. Footer Branding
    ctx.save();
    ctx.font = `bold 13px ${fontFam}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff3366';
    ctx.shadowColor = '#ff0844';
    ctx.shadowBlur = 10;
    ctx.fillText('⚡ POWERED BY DTB BOT SYSTEM ⚡', width / 2, cardY + cardH - 24);
    ctx.restore();

    const filePath = path.join(cacheDir, `leave_${uid}_${Date.now()}.png`);
    fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
    return filePath;
}

module.exports.run = async function ({ api, event, Users, Threads }) {
    try {
        if (!event.logMessageData || !event.logMessageData.leftParticipantFbId) return;
        const leftID = String(event.logMessageData.leftParticipantFbId);
        const botID = String(api.getCurrentUserID());
        if (leftID === botID) return; // Skip if bot left/removed

        const { threadID, author } = event;
        const threadData = (await Threads.getData(threadID)) || {};
        const cachedData = (global.data.threadData && global.data.threadData.get(String(threadID))) || {};
        const data = { ...cachedData, ...(threadData.data || {}) };
        if (data.leaveNoti === false) return; // Skip if explicitly turned off

        let name = "Người dùng Facebook";
        try {
            name = (global.data.userName && global.data.userName.get(leftID)) || await Users.getNameUser(leftID) || name;
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
        const currentMembers = (threadInfo.participantIDs || []).length || "---";
        const timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

        const isSelfLeave = String(author) === leftID;
        const typeText = isSelfLeave ? "Đã tự rời khỏi nhóm." : "Đã bị Quản trị viên xóa khỏi nhóm.";

        // Antiout integration
        if (data.antiout === true && isSelfLeave) {
            api.addUserToGroup(leftID, threadID, (err) => {
                if (!err) {
                    api.sendMessage(`[ ANTIOUT ] Đã tự động thêm lại ${name} vào nhóm!`, threadID);
                }
            });
        }

        let cardPath = null;
        try {
            cardPath = await renderLeaveCard({
                uid: leftID,
                name,
                threadName,
                currentMembers,
                isSelfLeave,
                timeString: timeNow
            });
        } catch (err) {
            console.error("Lỗi vẽ canvas leaveNoti:", err);
        }

        const leaveMsg = 
`╔═════════════════════════╗
   ${isSelfLeave ? "👋 THÀNH VIÊN RỜI NHÓM" : "🚫 THÀNH VIÊN BỊ KICK"}
╚═════════════════════════╝
👤 Thành viên: ${name}
🏠 Nhóm: ${threadName}
📌 Tình trạng: ${typeText}
📉 Thành viên còn lại: ${currentMembers}
⏰ Thời gian: ${timeNow}`;

        const payload = { body: leaveMsg };
        if (cardPath && fs.existsSync(cardPath)) {
            try {
                const stream = fs.createReadStream(cardPath);
                stream.on("error", (err) => {
                    console.error("[leaveNoti] Stream error:", err.message);
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
                console.error("[leaveNoti] Lỗi gửi card leaveNoti, gửi fallback text:", err);
                api.sendMessage(leaveMsg, threadID);
                if (cardPath) {
                    try { fs.unlinkSync(cardPath); } catch (_) {}
                }
            }
        });
    } catch (e) {
        console.error("Lỗi leaveNoti:", e.message);
    }
};
