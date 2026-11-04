const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");

// --- CONFIG ---
module.exports.config = {
    name: "cardinfo",
    version: "6.1.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Tạo card info profile .",
    commandCategory: "Tiện ích",
    usages: "cardinfo [uid|reply|tag]",
    cooldowns: 10,
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

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, x, currentY);
            line = words[i] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
}

// --- ONLOAD: Tải font chữ ---
module.exports.onLoad = async () => {
    const fontDir = path.join(__dirname, "cache", "fonts");
    if (!fs.existsSync(fontDir)) fs.mkdirSync(fontDir, { recursive: true });

    const fontUrl = "https://github.com/google/fonts/raw/main/ofl/bevietnampro/BeVietnamPro-Bold.ttf";
    const fontPath = path.join(fontDir, "BeVietnamPro-Bold.ttf");

    if (!fs.existsSync(fontPath)) {
        try {
            const response = await axios.get(fontUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(fontPath, response.data);
            console.log("Font 'Be Vietnam Pro' downloaded successfully.");
        } catch (error) {
            console.error("Failed to download font:", error);
        }
    }
    registerFont(fontPath, { family: "Be Vietnam Pro" });
};

// --- MAIN RUN ---
module.exports.run = async function ({ api, event, args }) {
    try {
        let uid;
        if (event.type === "message_reply") {
            uid = event.messageReply.senderID;
        } else if (args[0]) {
            uid = args[0];
        } else {
            uid = event.senderID;
        }

        const res = await axios.get(`https://apinvh.zzux.com/api/getinfo?uid=${uid}`);
        const info = res.data;

        // --- CANVAS SETUP (Kích thước ngang) ---
        const canvas = createCanvas(1000, 500);
        const ctx = canvas.getContext("2d");
        ctx.font = "20px 'Be Vietnam Pro'";

        // --- DRAWING ---

        // 1. Vẽ nền
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, "#1a1a2e");
        gradient.addColorStop(1, "#16213e");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Vẽ card chính
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        roundRect(ctx, 30, 30, canvas.width - 60, canvas.height - 60, 25);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // 3. Vẽ Avatar (Bên trái)
        const avatarSize = 200;
        const avatarX = 180;
        const avatarY = canvas.height / 2;
        const avatar = await loadImage(info.avatar);
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
        ctx.restore();

        // Viền avatar
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarSize / 2 + 5, 0, Math.PI * 2, true);
        const borderGradient = ctx.createLinearGradient(avatarX - 100, avatarY - 100, avatarX + 100, avatarY + 100);
        borderGradient.addColorStop(0, "#89f7fe");
        borderGradient.addColorStop(1, "#66a6ff");
        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = 6;
        ctx.stroke();

        // --- Vùng thông tin (Bên phải) ---
        const infoX = 350;

        // 4. Vẽ tên và username
        ctx.textAlign = "left";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 42px 'Be Vietnam Pro'";
        ctx.fillText(info.name, infoX, 100);

        ctx.font = "22px 'Be Vietnam Pro'";
        ctx.fillStyle = "#a9a9b3";
        ctx.fillText(info.username || `(${info.first_name || ""})`, infoX, 140);

        // 5. Vẽ đường kẻ ngang
        ctx.beginPath();
        ctx.moveTo(infoX, 170);
        ctx.lineTo(canvas.width - 80, 170);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 6. Vẽ các thông tin phụ
        const statsY = 215;
        const statsSpacing = 200;

        // UID
        ctx.font = "bold 22px 'Be Vietnam Pro'";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("UID", infoX, statsY);
        ctx.font = "20px 'Be Vietnam Pro'";
        ctx.fillStyle = "#a9a9b3";
        ctx.fillText(info.uid, infoX, statsY + 30);

        // Followers
        ctx.font = "bold 22px 'Be Vietnam Pro'";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("Followers", infoX + statsSpacing, statsY);
        ctx.font = "20px 'Be Vietnam Pro'";
        ctx.fillStyle = "#a9a9b3";
        ctx.fillText(info.follower ? info.follower.toLocaleString('en-US') : "0", infoX + statsSpacing, statsY + 30);

        // Sống tại
        ctx.font = "bold 22px 'Be Vietnam Pro'";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("Sống tại", infoX + statsSpacing * 2, statsY);
        ctx.font = "20px 'Be Vietnam Pro'";
        ctx.fillStyle = "#a9a9b3";
        const locationText = info.location || "Chưa cập nhật";
        ctx.fillText(locationText.length > 15 ? locationText.substring(0, 14) + "..." : locationText, infoX + statsSpacing * 2, statsY + 30);

        // 7. Vẽ các thông tin khác (Ngày sinh, Mối quan hệ)
        const otherInfoY = 295;
        ctx.font = "20px 'Be Vietnam Pro'";
        ctx.fillStyle = "#c9c9d1";
        ctx.fillText(`🎂 ${info.birthday || "Không rõ"}`, infoX, otherInfoY);
        ctx.fillText(`💞 ${info.relationship_status || "Không rõ"}`, infoX, otherInfoY + 35);

        // Hiển thị người yêu nếu có và không phải là "Không có"
        if (info.love && info.love !== "Không có") {
            ctx.fillText(`-> ${info.love}`, infoX + 200, otherInfoY + 35);
        }

        // 8. Vẽ phần giới thiệu (Quotes)
        const aboutY = 380;
        ctx.font = "bold 22px 'Be Vietnam Pro'";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("Giới thiệu", infoX, aboutY);

        ctx.font = "italic 20px 'Be Vietnam Pro'";
        ctx.fillStyle = "#c9c9d1";
        const aboutText = (info.quotes && info.quotes !== "Không có dữ liệu!") ? info.quotes : "Người dùng này chưa có phần giới thiệu.";
        wrapText(ctx, `“${aboutText}”`, infoX, aboutY + 35, 580, 30);

        // --- SAVE & SEND ---
        const cachePath = path.join(__dirname, "cache");
        if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
        const imagePath = path.join(cachePath, `cardinfo_horizontal_${uid}.png`);

        const out = fs.createWriteStream(imagePath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);

        out.on("finish", () => {
            api.sendMessage({
                body: `✨ Đây là card thông tin của ${info.name}`,
                attachment: fs.createReadStream(imagePath),
            }, event.threadID, () => fs.unlinkSync(imagePath), event.messageID);
        });

    } catch (error) {
        console.error("Lỗi khi tạo card info:", error);
        api.sendMessage("❌ Đã xảy ra lỗi khi tạo card. Vui lòng thử lại sau.", event.threadID, event.messageID);
    }
};