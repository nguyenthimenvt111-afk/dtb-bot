module.exports.config = {
    name: "sendnoti",
    version: "1.1.1",
    hasPermssion: 3,
    credits: "dtb",
    description: "Gửi tin nhắn đến tất cả nhóm và reply để phản hồi",
    commandCategory: "Hệ Thống",
    usages: "sendnoti [text]",
    cooldowns: 2
};
request = require("request");
fse = require("fs-extra");
imageDownload = require("image-downloader");
moment = require("moment-timezone");
fullTime = () => moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || DD/MM/YYYY");
module.exports.run = async({ api,
    event, Users }) => {
    const { threadID: tid, messageID: mid, senderID: sid, attachments: atms, messageReply: mR, type, body, args } = event; 
    const allTid = global.data.allThreadID || [];
    const atm = await type == "message_reply" ? mR.attachments : atms.length != 0 ? atms : "nofile";
    const content = !args[1] ? "𝑐ℎ𝑖̉ 𝑐𝑜́ 𝑡𝑒̣̂𝑝" : body.slice(body.indexOf(args[1]));
    if (!args[1] && atm == "nofile") return api.sendMessage(`==== 『 𝐄𝐑𝐎𝐋 』 ==== \n▱▱▱▱▱▱▱▱▱▱▱▱▱\n→ 𝐵𝑎̣𝑛 𝑐ℎ𝑢̛𝑎 𝑛ℎ𝑎̣̂𝑝 𝑛𝑜̣̂𝑖 𝑑𝑢𝑛𝑔\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n=== 「${thu} || ${gio}」 ===`, tid, mid);
    var msg = `[📢]→ 𝑇ℎ𝑜̂𝑛𝑔 𝑏𝑎́𝑜 𝑡𝑢̛̀ 𝐴𝑑𝑚𝑖𝑛: ${(await Users.getData(sid)).name}\n[⏱]→ 𝑇𝑖𝑚𝑒: ${fullTime()}\n[📝]→ 𝑁𝑜̣̂𝑖 𝑑𝑢𝑛𝑔: ${content}\n\n → 𝑅𝑒𝑝𝑙𝑦 đ𝑒̂̉ 𝑝ℎ𝑎̉𝑛 ℎ𝑜̂̀𝑖 𝑙𝑎̣𝑖 𝐴𝑑𝑚𝑖𝑛.`
    const uwu = atm == "nofile" ? msg : {
        body: msg,
        attachment: await DownLoad(atm)
    };
var c1 = 0, c2 = 0;
    for (var idT of allTid) {
      var promise = new Promise (async(r1, r2) => {
 await api.sendMessage(uwu, idT, async(e, i) => {
   if (e) r2(++c2); else r1(++c1)
      return global.client.handleReply.push({
            name: this.config.name,
            messageID: i.messageID,
            author: sid,
            type: "userReply"
        })
      });
    })
  }
promise.then(async(r) => api.sendMessage(`[✅]→ Đ𝑎̃ 𝑔𝑢̛̉𝑖 𝑡ℎ𝑜̂𝑛𝑔 𝑏𝑎́𝑜 đ𝑒̂́𝑛 ${r} 𝑛ℎ𝑜́𝑚`, tid, mid)).catch(async(err) => api.sendMessage(`[❌]→ 𝐾ℎ𝑜̂𝑛𝑔 𝑡ℎ𝑒̂̉ 𝑔𝑢̛̉𝑖 𝑡ℎ𝑜̂𝑛𝑔 𝑏𝑎́𝑜 đ𝑒̂́𝑛 ${err} 𝑛ℎ𝑜́𝑚`, tid, mid))
};
module.exports.handleReply = async({ api, event, handleReply: h, Users, Threads }) => {
    const { threadID: tid, messageID: mid, senderID: sid, attachments: atms, body, type } = event;
    const { ADMINBOT } = global.config;
    switch (h.type) {
        case "userReply": {
            const atm = atms.length != 0 ? atms : "nofile";
            var msg = `[📩]→ 𝑃ℎ𝑎̉𝑛 ℎ𝑜̂̀𝑖 𝑡𝑢̛̀ 𝑈𝑠𝑒𝑟 ${(await Users.getData(sid)).name}\n[🔎]→ 𝑁ℎ𝑜́𝑚: ${(await Threads.getData(tid)).threadInfo.threadName}\n[⏱] 𝑇𝑖𝑚𝑒: ${fullTime()}\n[📝]→ 𝑁𝑜̣̂𝑖 𝑑𝑢𝑛𝑔: ${atm == "nofile" ? body : "𝐶ℎ𝑖̉ 𝑐𝑜́ 𝑡𝑒̣̂𝑝 đ𝑒̂́𝑛 𝑏𝑎̣𝑛"}\n\n→ 𝑅𝑒𝑝𝑙𝑦 đ𝑒̂̉ 𝑝ℎ𝑎̉𝑛 ℎ𝑜̂̀𝑖 𝑙𝑎̣𝑖 𝑢𝑠𝑒𝑟.`
            const uwu = atm == "nofile" ? msg : {
                body: msg,
                attachment: await DownLoad(atm)
            };
          var c1 = 0, c2 = 0;
            for (var idA of ADMINBOT) {
              var promise = new Promise (async(r1, r2) => {
                await api.sendMessage(uwu, idA, async(e, i) => {
     if (e) r2(++c2); else r1(++c1)
                    return global.client.handleReply.push({
                        name: this.config.name,
                        messageID: i.messageID,
                        author: h.author, idThread: tid, idMessage: mid, idUser: sid,
                        type: "adminReply"
                    })
                });
            });
       }; 
          promise.then(async(r1) => api.sendMessage(`[📨]→ Đ𝑎̃ 𝑝ℎ𝑎̉𝑛 ℎ𝑜̂̀𝑖 đ𝑒̂́𝑛 𝐴𝑑𝑚𝑖𝑛 ${(await Users.getData(h.author)).name} 𝑣𝑎̀ ${+r1-1} 𝐴𝑑𝑚𝑖𝑛 𝑘ℎ𝑎́𝑐`, tid, mid)).catch(async(err) => api.sendMessage(`[❌]→ 𝐾ℎ𝑜̂𝑛𝑔 𝑡ℎ𝑒̂̉ 𝑝ℎ𝑎̉𝑛 ℎ𝑜̂̀𝑖 đ𝑒̂́𝑛 ${err} 𝐴𝑑𝑚𝑖𝑛`, tid, mid))
            break;
        };
    case "adminReply": {
        const atm = atms.length != 0 ? atms : "nofile";
        var msg = `[📩]→ 𝑃ℎ𝑎̉𝑛 ℎ𝑜̂̀𝑖 𝑡𝑢̛̀ 𝐴𝑑𝑚𝑖𝑛 ${(await Users.getData(sid)).name}\n[⏱]→ 𝑇𝑖𝑚𝑒: ${fullTime()}\n[📝]→ 𝑁𝑜̣̂𝑖 𝑑𝑢𝑛𝑔: ${atm == "nofile" ? body : "𝐶ℎ𝑖̉ 𝑐𝑜́ 𝑡𝑒̣̂𝑝 đ𝑒̂́𝑛 𝑏𝑎̣𝑛"}\n\n[👉]→ 𝑅𝑒𝑝𝑙𝑦 đ𝑒̂̉ 𝑝ℎ𝑎̉𝑛 ℎ𝑜̂̀𝑖 𝑙𝑎̣𝑖 𝐴𝑑𝑚𝑖𝑛.`
        const uwu = atm == "nofile" ? msg : {
            body: msg,
            attachment: await DownLoad(atm)
        };
        await api.sendMessage(uwu, h.idThread, async(e, i) => {
            if (e) return api.sendMessage(`Error`, tid, mid);
            else api.sendMessage(`[📨]→ Đ𝑎̃ 𝑝ℎ𝑎̉𝑛 ℎ𝑜̂̀𝑖 đ𝑒̂́𝑛 𝑈𝑠𝑒𝑟 ${(await Users.getData(h.idUser)).name} 𝑡𝑎̣𝑖 𝑛ℎ𝑜́𝑚 ${(await Threads.getData(h.idThread)).threadInfo.threadName}`, tid, mid)
            return global.client.handleReply.push({
                name: this.config.name,
                messageID: i.messageID,
                author: sid,
                type: "userReply"
            })
        }, h.idMessage);
        break;
    };
  }
};

const DownLoad = async(atm) => {
    var arr = [];
    for (var i = 0; i < atm.length; i++) {
        const nameUrl = request.get(atm[i].url).uri.pathname
        const namefile = atm[i].type != "audio" ? nameUrl : nameUrl.replace(/\.mp4/g, ".m4a");
        const path = __dirname + "/cache/" + namefile.slice(namefile.lastIndexOf("/") + 1);
        await imageDownload.image({
            url: atm[i].url,
            dest: path
        });
        arr.push(fse.createReadStream(path));
        fse.unlinkSync(path);
    }
    return arr;
};