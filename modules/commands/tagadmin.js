const fs = require('fs');
const moment = require('moment-timezone');
module.exports.config = {
    name: "tagadmin", // Tên lệnh, được sử dụng trong việc gọi lệnh
    version: "1.0.0", // phiên bản của module này
    hasPermssion: 3, // Quyền hạn sử dụng, với 0 là toàn bộ thành viên, 1 là quản trị viên trở lên, 2 là admin/owner
    credits: "dtb", // TruongMini
    description: "Tag admin bot", // Thông tin chi tiết về lệnh
    commandCategory: "Hệ Thống", // Thuộc vào nhóm nào: system, other, game-sp, game-mp, random-img, edit-img, media, economy, ...
    usages: "[msg]", // Cách sử dụng lệnh
    cooldowns: 5 // Thời gian một người có thể lặp lại lệnh
};
module.exports.onLoad = () => {
    const fs = require("fs-extra");
    const request = require("request");
    const dirMaterial = __dirname + `/Noprefix/`;
    if (!fs.existsSync(dirMaterial + "Noprefix")) fs.mkdirSync(dirMaterial, { recursive: true });
    if (!fs.existsSync(dirMaterial + "tagadmin.jpg")) request("https://i.imgur.com/8rUYUiz.jpg ").pipe(fs.createWriteStream(dirMaterial + "tagadmin.jpg"));
                       }

module.exports.handleReply = async function ({ api, event, handleReply, Users, Threads, args }) {
let uid = event.senderID;
var msg = [`ljkj`];
    const { threadID, messageID, body } = event;
    switch (handleReply.type) {
        case "tagadmin": {
            let name = await Users.getNameUser(handleReply.author);
            api.sendMessage({body: `=== 『 FEEDBACK FROM ADMIN 』 ===\n━━━━━━━━━━━━━━━━\n\n[💬] ➜ Nội dung: ${body}\n[👤] ➜ Admin: ${name || "Người dùng facebook"}\n[🌐] ➜ Facebook: https://www.facebook.com/profile.php?id=${event.senderID}\n[👑] ➜ Nơi gửi: ${event.isGroup == true ? 'Nhóm ' + global.data.threadInfo.get(event.threadID).threadName: 'từ cuộc trò chuyện riêng với bot '} \n[⏰] ➜ Time: ${moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss - DD/MM/YYYY")}\n[💢] ➜ Reply tin nhắn ( Phản hồi ) về admin `, attachment: await downLoad(`https://graph.facebook.com/${event.senderID}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, __dirname+'/cache/12345.jpg')}, handleReply.threadID, (err, info) => {
                if(err) console.log(err)
                else {
                    global.client.handleReply.push({
                        name: this.config.name,
                        type: "reply",
                        messageID: info.messageID,
                        messID: messageID,
                        threadID
                    })
                }
            }, handleReply.messID);
            break;
        }
        case "reply": {
            let name = await Users.getNameUser(event.senderID);
            api.sendMessage({body: `=== 『 FEEDBACK FROM USER 』 ===\n━━━━━━━━━━━━━━━━\n\n[💬] ➜ Nội dung: ${body}\n[👤] ➜ Tên: ${name || "Người dùng facebook"}\n[👨‍👩‍👧‍👦] ➜ Box : ${(await Threads.getInfo(threadID)).threadName || "Tên nhóm không tồn tại"}\n[⏰] ➜ Time: ${moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss - DD/MM/YYYY")}\n[💢] ➜ Reply tin nhắn ( phản hồi ) lại người tag`, attachment: await downLoad(`https://graph.facebook.com/${event.senderID}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, __dirname+'/cache/12345.jpg')},handleReply.threadID, (err, info) => {
                if(err) console.log(err)
                else {
                    global.client.handleReply.push({
                        name: this.config.name,
                        type: "tagadmin",
                        messageID: info.messageID,
                        messID: messageID,
                        threadID
                    })
                }
            }, handleReply.messID);
            break;
        }
    }
}

module.exports.handleEvent = async ({ api, event, Users, Threads, args }) => {
    const { threadID, messageID, body, mentions, senderID } = event;
    let path = __dirname + "/cache/data/tagadmin.json";
    if(!fs.existsSync(path)) fs.writeFileSync(path, "{}");
    let data = JSON.parse(fs.readFileSync(path));
    if(!data[threadID]) data[threadID] = true;
    if(!mentions || !data[threadID]) return;
    let mentionsKey = Object.keys(mentions);
    let allAdmin = global.config.ADMINBOT;
    mentionsKey.forEach(async (each) => {
        if(each == api.getCurrentUserID()) return;
        if(allAdmin.includes(each)) {
            let userName = await Users.getNameUser(senderID);
            let threadName = await Threads.getInfo(threadID).threadName;
            api.sendMessage({body:`=== 『 TAG ADMINBOT 』 ===\n━━━━━━━━━━━━━━━━\n\n[👤] ➜ Người tag: ${userName}\n[👨‍👩‍👧‍👦] ➜ Box: ${(await Threads.getInfo(threadID)).threadName || "Tên nhóm không tồn tại"}\n[💬] ➜ Nội dung: ${body}\n[⏰] ➜ Time: ${moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss - DD/MM/YYYY")}\n[💢] ➜ Reply tin nhắn ( Phản hồi ) lại người tag`, attachment: await downLoad(`https://graph.facebook.com/${event.senderID}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, __dirname+'/cache/ảnh/12345.jpg')},each, (err, info) => {
                if(err) console.log(err)
                else {
                    global.client.handleReply.push({
                        name: this.config.name,
                        type: "tagadmin",
                        messageID: info.messageID,
                        messID: messageID,
                        author: each,
                        threadID
                    })
                }
            })
        }
    })
    fs.writeFileSync(path, JSON.stringify(data, null, 4));
}

module.exports.run = async ({ api, event, args }) => {
const fs = require("fs");
    const { threadID } = event;
    let path = __dirname + "/cache/tagadmin.json";
    if(!fs.existsSync(path)) fs.writeFileSync(path, "{}");
    let data = JSON.parse(fs.readFileSync(path));
    if(!data[threadID]) data[threadID] = true;
    if(args[0] == "off") data[threadID] = false;
    else if(args[0] == "on") data[threadID] = true;
    else return api.sendMessage({body: `[💢] ➜ Vui lòng bật tagadmin On hoặc Off`, attachment: (await axios.get((await axios.get(`https://docs-api.jrtxtracy.repl.co/nsfw/ausand?apikey=JRTvip_2200708248`)).data.data, {
                    responseType: 'stream'
                })).data
}, event.threadID);
    fs.writeFileSync(path, JSON.stringify(data, null, 4));
    return api.sendMessage({body: `[💢] ➜ Tag Admin đã được ${data[threadID] ? "Bật" : "Tắt"}`, attachment: (await axios.get((await axios.get(`https://docs-api.jrtxtracy.repl.co/nsfw/ausand?apikey=JRTvip_2200708248`)).data.data, {
                    responseType: 'stream'
                })).data
}, event.threadID);
};

async function downLoad(a, b) {
    await (require('image-downloader')).image({
        url: a, dest: b
    });
    return (require('fs-extra')).createReadStream(b);
};
