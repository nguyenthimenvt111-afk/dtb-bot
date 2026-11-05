const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
    name: "taoanhbox",
    version: "2.0.0",
    hasPermssion: 1,
    credits: "dtb",
    description: "Tạo ảnh đại diện tất cả thành viên trong nhóm",
    commandCategory: "Quản Lí Box",
    usages: "[size avt] [mã màu hex] [tên nhóm]",
    cooldowns: 5,
    dependencies: {
        "fs-extra": "", 
        "axios": "", 
        "canvas": "", 
        "jimp": ""
    }
};

async function circle(image) {
    const jimp = require("jimp");
    image = await jimp.read(image);
    image.circle();
    return await image.getBufferAsync("image/png");
}

module.exports.circle = circle;

module.exports.run = async ({ event, api, args }) => {
    const Canvas = require("canvas");
    const jimp = require("jimp");
    const { threadID, messageID } = event;

    if (args[0] === 'help' || args[0] === '-h') {
        return api.sendMessage(
`=== 『 HELP TAOANHBOX 』 ===
━━━━━━━━━━━━━━━━
➜ Sử dụng: /taoanhbox [size avt] [mã màu hex] [tên nhóm]
➜ Bỏ trống tất cả để tạo ảnh tự động.`, threadID, messageID);
    }

    try {
        const cacheDataDir = path.join(__dirname, 'cache', 'data');
        fs.ensureDirSync(cacheDataDir);
        const fontFile = path.join(cacheDataDir, 'TUVBenchmark.ttf');
        if (!fs.existsSync(fontFile)) {
            try {
                const downFonts = (await axios.get('https://drive.google.com/u/0/uc?id=1NIoSu00tStE8bIpVgFjWt2in9hkiIzYz&export=download', { responseType: "arraybuffer", timeout: 5000 })).data;
                fs.writeFileSync(fontFile, Buffer.from(downFonts));
            } catch (_) {}
        }

        const bgImages = ['https://i.imgur.com/P3QrAgh.jpg', 'https://i.imgur.com/RueGAGI.jpg'];
        let bgUrl = bgImages[Math.floor(Math.random() * bgImages.length)];
        let background = await Canvas.loadImage(bgUrl);
        let bgX = background.width;
        let bgY = background.height;

        const imgCanvas = Canvas.createCanvas(bgX, bgY);
        const ctx = imgCanvas.getContext('2d');
        ctx.drawImage(background, 0, 0, bgX, bgY);

        let { participantIDs, adminIDs, name, userInfo } = await api.getThreadInfo(threadID);
        const admin = (Array.isArray(adminIDs) ? adminIDs : []).map(a => a.id);
        const userList = Array.isArray(userInfo) ? userInfo : Object.values(userInfo || {});

        let live = [];
        for (let user of userList) {
            if (user && user.gender !== undefined) live.push(user);
        }

        let size = parseInt(args[0]) || 120;
        let color = args[1] && args[1].startsWith("#") ? args[1] : "#FFFFFF";
        let title = args.slice(2).join(" ") || name || "Gia Đình Chúng Ta";

        let l = Math.floor(size / 15);
        let x = l, y = 200, xcrop = live.length * size, ycrop = 200 + size;
        size = size - l * 2;

        api.sendMessage(`=== 『 CREATE TAOANHBOX 』 ===\n━━━━━━━━━━━━━━━━\n[🍗] Dự tính: ${live.length} thành viên\n[🥑] Size Avatar: ${size}\n[🥪] Màu: ${color}`, threadID, messageID);

        let successDraw = 0;
        for (let user of live) {
            try {
                const avtUrl = `https://graph.facebook.com/${user.id}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
                const avtBuf = (await axios.get(avtUrl, { responseType: 'arraybuffer', timeout: 4000 })).data;
                const rounded = await circle(avtBuf);
                const avatarImg = await Canvas.loadImage(rounded);

                if (x + size > bgX) {
                    xcrop = x;
                    x = l;
                    y += size + l;
                    ycrop += size + l;
                }
                if (ycrop > bgY) break;

                ctx.drawImage(avatarImg, x, y, size, size);
                successDraw++;
                x += size + l;
            } catch (_) {}
        }

        if (fs.existsSync(fontFile)) {
            Canvas.registerFont(fontFile, { family: "TUVBenchmark" });
            ctx.font = "80px TUVBenchmark";
        } else {
            ctx.font = "bold 60px Arial";
        }
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.fillText(title, bgX / 2, 130);

        const outPath = path.join(__dirname, 'cache', `taoanhbox_${Date.now()}.png`);
        const buffer = imgCanvas.toBuffer('image/png');
        fs.writeFileSync(outPath, buffer);

        return api.sendMessage({
            body: `=== 『 TAOANHBOX HOÀN TẤT 』 ===\n━━━━━━━━━━━━━━━━\n[🍗] Số thành viên đã vẽ: ${successDraw}`,
            attachment: fs.createReadStream(outPath)
        }, threadID, () => {
            if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
        }, messageID);
    } catch (e) {
        console.error("Lỗi taoanhbox:", e);
        return api.sendMessage("➜ Đã xảy ra lỗi khi tạo ảnh nhóm!", threadID, messageID);
    }
};
