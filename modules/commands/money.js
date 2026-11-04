module.exports.config = {
    name: "money",
    version: "0.0.1",
    hasPermssion: 0,
    credits: "dtb",//mod by ARAXY XD
    description: "Kiểm tra số tiền của bản thân hoặc người được tag",
    commandCategory: "Tiện ích",
    usages: "[Tag]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args, Currencies, Users }) {
    const { threadID, messageID, senderID, mentions } = event;
    const fs = require('fs');
    const axios = require('axios');

    // Hàm làm tròn số về phần nguyên gần nhất
    function formatNumber(num) {
        return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    if(!fs.existsSync(__dirname+'/cache/SplineSans-Medium.ttf')) { 
        let getfont = (await axios.get(`https://drive.google.com/u/0/uc?id=102B8O3_0vTn_zla13wzSzMa-vdTZOCmp&export=download`, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(__dirname+"/cache/SplineSans-Medium.ttf", Buffer.from(getfont));
    };
    if(!fs.existsSync(__dirname+'/cache/SplineSans.ttf')) { 
        let getfont2 = (await axios.get(`https://drive.google.com/u/0/uc?id=1--V7DANKLsUx57zg8nLD4b5aiPfHcmwD&export=download`, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(__dirname+"/cache/SplineSans.ttf", Buffer.from(getfont2));
    };

    let name, money;

    if (event.type == "message_reply") {
        const uid = event.messageReply.senderID;
        name = (await Users.getData(uid)).name;
        money = (await Currencies.getData(uid)).money || 0;
    } else if (Object.keys(event.mentions).length == 1) {
        const mention = Object.keys(mentions)[0];
        name = (await Users.getData(mention)).name;
        money = (await Currencies.getData(mention)).money || 0;
    } else {
        name = (await Users.getData(senderID)).name;
        money = (await Currencies.getData(senderID)).money || 0;
    }

    const argss = formatNumber(money);

    const { loadImage, createCanvas } = require("canvas");
    const path = __dirname + "/cache/atmaraxy.png";
    try {
        const bg = (await axios.get(`https://i.ibb.co/NZD1Zzz/image.png`, { responseType: "arraybuffer", timeout: 8000 })).data;
        fs.writeFileSync(path, Buffer.from(bg));
        const bgBase = await loadImage(path);
        const canvas = createCanvas(bgBase.width, bgBase.height);
        const ctx = canvas.getContext("2d");
        const Canvas = global.nodemodule["canvas"];
        ctx.drawImage(bgBase, 0, 0, canvas.width, canvas.height);
        try {
            Canvas.registerFont(__dirname+targetFontMedium, { family: "SplineSans-Medium" });
            Canvas.registerFont(__dirname+targetFontRegular, { family: "SplineSans" });
        } catch (_) {}
        ctx.font = "50px SplineSans-Medium";
        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.fillText('' + argss + 'đ', 530, 359);
        const imageBuffer = canvas.toBuffer();
        fs.writeFileSync(path, imageBuffer);

        const msg = {
            body: `💳 Số tiền của ${name}: ${argss}đ`,
            attachment: fs.createReadStream(path)
        };
        return api.sendMessage(msg, threadID, () => { try { fs.unlinkSync(path); } catch(_) {} }, messageID);
    } catch (_) {
        return api.sendMessage(`💰 [ VÍ TIỀN ]\n👤 Chủ tài khoản: ${name}\n💵 Số dư hiện có: ${argss}đ`, threadID, messageID);
    }
};
