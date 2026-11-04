const fs = require('fs-extra');
const axios = require('axios');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const moment = require('moment-timezone');

// --- CONFIG ---
module.exports.config = {
    name: "cardbox",
    version: "6.3.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Tạo card thông tin nhóm",
    commandCategory: "Nhóm",
    usages: "cardbox",
    cooldowns: 15,
};

// --- HELPERS ---
function roundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    return ctx;
}

function truncateText(ctx, text, maxWidth) {
    let width = ctx.measureText(text).width;
    if (width <= maxWidth) return text;
    const ellipsis = '...';
    const ellipsisWidth = ctx.measureText(ellipsis).width;
    while (width + ellipsisWidth > maxWidth && text.length > 0) {
        text = text.slice(0, -1);
        width = ctx.measureText(text).width;
    }
    return text + ellipsis;
}

// --- ONLOAD: Tải và đăng ký font (nếu cần) ---
module.exports.onLoad = async () => {
    const cacheDir = path.join(__dirname, "cache", "fonts");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const fontPath = path.join(cacheDir, "BeVietnamPro-Bold.ttf");

    if (!fs.existsSync(fontPath)) {
        console.log("Font 'BeVietnamPro-Bold.ttf' chưa tồn tại, tiến hành tải về...");
        const fontUrl = "https://github.com/google/fonts/raw/main/ofl/bevietnampro/BeVietnamPro-Bold.ttf";
        try {
            const res = await axios.get(fontUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(fontPath, res.data);
            console.log("Tải font thành công cho các module sử dụng.");
        } catch (e) {
            console.error("Lỗi tải font dùng chung:", e.message);
        }
    }

    try {
        if (fs.existsSync(fontPath)) {
            registerFont(fontPath, { family: "Be Vietnam Pro" });
        } else {
            console.error("Không tìm thấy file font 'BeVietnamPro-Bold.ttf' trong cache.");
        }
    } catch (e) {
        console.error("Lỗi đăng ký font:", e.message);
    }
};

// --- MAIN RUN ---
module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;

    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const customName = args.join(' ').trim() || threadInfo.threadName || "Nhóm Chat";

        let maleCount = 0, femaleCount = 0, unknownCount = 0;
        if (threadInfo.userInfo && typeof threadInfo.userInfo === 'object') {
            for (const user of Object.values(threadInfo.userInfo)) {
                if (user.gender === 'MALE') maleCount++;
                else if (user.gender === 'FEMALE') femaleCount++;
                else unknownCount++;
            }
        }

        const totalMembers = threadInfo.participantIDs.length;
        const adminCount = threadInfo.adminIDs.length;
        const messageCount = threadInfo.messageCount;
        const timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm DD/MM/YYYY");

        let firstAdminName = 'Không xác định';
        if (threadInfo.adminIDs.length > 0) {
            const firstAdminId = threadInfo.adminIDs[0].id;
            try {
                const adminInfo = await api.getUserInfo(firstAdminId);
                firstAdminName = adminInfo[firstAdminId]?.name || `Admin ID: ${firstAdminId}`;
            } catch {
                firstAdminName = `Admin ID: ${firstAdminId}`;
            }
        }

        const canvas = createCanvas(1000, 600);
        const ctx = canvas.getContext('2d');
        ctx.font = "20px 'Be Vietnam Pro'";

        const gradient = ctx.createLinearGradient(0, 0, 1000, 600);
        gradient.addColorStop(0, "#1a1a2e");
        gradient.addColorStop(1, "#16213e");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1000, 600);

        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
        ctx.shadowBlur = 20;
        roundRect(ctx, 40, 40, 920, 520, 25);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 2;
        ctx.stroke();

        const avatarSize = 150;
        const avatarX = 150; // Tăng lề trái cho avatar
        const avatarY = 140;
        try {
            const avatarUrl = threadInfo.imageSrc || `https://graph.facebook.com/${threadID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
            const avatar = await loadImage(avatarUrl);
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
            ctx.restore();
        } catch (e) {
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = "#fff";
            ctx.fill();
            ctx.font = "bold 60px 'Be Vietnam Pro'";
            ctx.fillStyle = "#1a1a2e";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText((customName.match(/\b\w/g) || []).join('').toUpperCase() || '?', avatarX, avatarY);
        }

        const borderGradient = ctx.createLinearGradient(avatarX - 75, avatarY - 75, avatarX + 75, avatarY + 75);
        borderGradient.addColorStop(0, "#89f7fe");
        borderGradient.addColorStop(1, "#66a6ff");
        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarSize / 2 + 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 40px 'Be Vietnam Pro'";
        const truncatedName = truncateText(ctx, customName, 620);
        ctx.fillText(truncatedName, 260, 90);

        ctx.fillStyle = "#a9a9b3";
        ctx.font = "20px 'Be Vietnam Pro'";
        ctx.fillText(`ID: ${threadID}`, 260, 150);

        const mainStatsY = 260;
        const mainStatsX = 230; // Tăng lề trái
        const mainStatsSpacing = 260; // Giảm khoảng cách
        ctx.textAlign = "center";
        ctx.font = "bold 36px 'Be Vietnam Pro'";
        ctx.fillStyle = "#ffffff";

        ctx.fillText(totalMembers.toLocaleString(), mainStatsX, mainStatsY);
        ctx.fillText(adminCount.toLocaleString(), mainStatsX + mainStatsSpacing, mainStatsY);
        ctx.fillText(messageCount.toLocaleString(), mainStatsX + mainStatsSpacing * 2, mainStatsY);

        ctx.font = "22px 'Be Vietnam Pro'";
        ctx.fillStyle = "#a9a9b3";
        ctx.fillText("👥 Thành viên", mainStatsX, mainStatsY + 50);
        ctx.fillText("⭐ Quản trị viên", mainStatsX + mainStatsSpacing, mainStatsY + 50);
        ctx.fillText("💬 Tin nhắn", mainStatsX + mainStatsSpacing * 2, mainStatsY + 50);

        ctx.beginPath();
        ctx.moveTo(80, 380);
        ctx.lineTo(920, 380);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const detailY = 420;
        const detailX1 = 100;
        const detailX2 = 550;
        ctx.textAlign = "left";
        ctx.font = "22px 'Be Vietnam Pro'";
        ctx.fillStyle = "#ffffff";

        const malePercent = totalMembers > 0 ? Math.round((maleCount / totalMembers) * 100) : 0;
        const femalePercent = totalMembers > 0 ? Math.round((femaleCount / totalMembers) * 100) : 0;
        ctx.fillText(`👨 Nam: ${maleCount} (${malePercent}%)`, detailX1, detailY);
        ctx.fillText(`👩 Nữ: ${femaleCount} (${femalePercent}%)`, detailX1, detailY + 45);
        ctx.fillText(`❓ Khác: ${unknownCount}`, detailX1, detailY + 90);

        const truncatedAdminName = truncateText(ctx, `👑 QTV chính: ${firstAdminName}`, 400);
        ctx.fillText(truncatedAdminName, detailX2, detailY);
        const activity = messageCount > 5000 ? 'Rất sôi nổi' : messageCount > 1000 ? 'Sôi nổi' : 'Yên tĩnh';
        ctx.fillText(`📊 Hoạt động: ${activity}`, detailX2, detailY + 45);
        ctx.fillText(`⏰ Cập nhật: ${timeNow}`, detailX2, detailY + 90);

        const outputPath = path.join(__dirname, 'cache', `cardbox_${threadID}.png`);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);

        return api.sendMessage({
            body: `📊 Đây là thẻ thông tin của nhóm:\n ${customName}`,
            attachment: fs.createReadStream(outputPath)
        }, threadID, () => fs.unlinkSync(outputPath), messageID);

    } catch (error) {
        console.error('Lỗi khi tạo cardbox:', error);
        return api.sendMessage('❌ Đã xảy ra lỗi khi tạo card thông tin nhóm. Vui lòng thử lại sau.', threadID, messageID);
    }
};
