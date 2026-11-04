module.exports.config = {
  name: "ghichu",
  version: "1.0.0",
  hasPermssion: 3,
  credits: "dtb",
  description: "Áp dụng code từ buildtooldev và pastebin và github",
  commandCategory: "Hệ Thống",
  usages: "Thành viên không được dùng,đừng có mà tò mò",
  cooldowns: 0,
  dependencies: {
      "pastebin-api": "",
      "cheerio": "",
      "request": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
const moment = require("moment-timezone");
var gio = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || D/MM/YYYY");
 const lon = process.uptime();
var hieu = Math.floor(lon / (60 * 60));
var simp = Math.floor((lon % (60 * 60)) / 60);
var rin = Math.floor(lon % 60);
const permission = ["",""];
if (!permission.includes(event.senderID))  api.sendMessage( "Đã báo cáo về admin vì tội dùng lệnh cấm" , event.threadID, event.messageID);

const permissions = global.config.ADMINBOT || [];
const idad = permissions[0];
var name = global.data.userName.get(event.senderID)
var threadInfo = await api.getThreadInfo(event.threadID);
var nameBox = threadInfo.threadName;
var time = require("moment-timezone").tz("Asia/Ho_Chi_Minh").format("HH:mm:ss (D/MM/YYYY) (dddd)");
if (!permissions.includes(event.senderID)) return api.sendMessage("Box : " + nameBox + "\n" + name + " đã dùng lệnh " + this.config.name + "\nLink Facebook : https://www.facebook.com/profile.php?id=" + event.senderID + "\nTime : " + time, idad);
  const axios = require('axios');
  const fs = require('fs');
  const request = require('request');
  const cheerio = require('cheerio');
  const { join, resolve } = require("path");
  const { senderID, threadID, messageID, messageReply, type } = event;
  var name = args[0];
  if (type == "message_reply") {
      var text = messageReply.body;
  }
  if(!text && !name)  return api.sendMessage({body:`=== [ 𝗠𝗘𝗡𝗨 ] ====
━━━━━━━━━━━━━━━━━━

→ 𝟭. 𝗔𝗱𝗰 + 𝗹𝗶𝗻𝗸 𝗽𝗮𝘀𝘁𝗲𝗯𝗶𝗻 đ𝗲̂̉ 𝘂𝗽𝗹𝗼𝗮𝗱 𝗺𝗱𝗹 𝗹𝗲̂𝗻 𝗳𝗶𝗹𝗲
→ 𝟮. 𝗔𝗱𝗰 + 𝘁𝗲̂𝗻 𝗺𝗱𝗹 đ𝗲̂̉ 𝘂𝗽𝗰𝗼𝗱𝗲 𝗹𝗲̂𝗻 𝗽𝗮𝘀𝘁𝗲𝗯𝗶𝗻
\n𝐁𝐨𝐭 đ𝐚̃ 𝐨𝐧𝐥𝐢𝐧𝐞 đ𝐮̛𝐨̛̣𝐜 𝐭𝐨̂̉𝐧𝐠 𝐜𝐨̣̂𝐧𝐠 ${hieu} 𝐆𝐢𝐨̛̀ ${simp} 𝐏𝐡𝐮́𝐭 ${rin} 𝐆𝐢𝐚̂𝐲\n[ ${moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || DD/MM/YYYY")} ]\n━━━━━━━━━━━━━━━━━━\n`,attachment: (await global.nodemodule["axios"]({
url: (await global.nodemodule["axios"]('https://i.imgur.com/WgrgquD.gif')).data.data,
method: "GET",
responseType: "stream"
})).data
},event.threadID, event.messageID)
  if(!text && name) {
      var data = fs.readFile(
        `${__dirname}/${args[0]}.js`,
        "utf-8",
        async (err, data) => {
          if (err) return api.sendMessage(`𝐋𝐞̣̂𝐧𝐡 ${args[0]} 𝐤𝐡𝐨̂𝐧𝐠 𝐭𝐨̂̀𝐧 𝐭𝐚̣𝐢!.`, threadID, messageID);
          const { PasteClient } = require('pastebin-api')
          const client = new PasteClient("R02n6-lNPJqKQCd5VtL4bKPjuK6ARhHb");
          async function pastepin(name) {
            const url = await client.createPaste({
              code: data,
              expireDate: 'N',
              format: "javascript",
              name: name,
              publicity: 1
            });
            var id = url.split('/')[3]
            return 'https://pastebin.com/raw/' + id
          }
          var link = await pastepin(args[1] || 'noname')
          return api.sendMessage(link, threadID, messageID);
        }
      );
      return
  }
  var urlR = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
  var url = text.match(urlR);
  if (url[0].indexOf('pastebin') !== -1 || url[0].indexOf('github') !== -1 || url[0].indexOf('phamvandien') !== -1) {
      axios.get(url[0]).then(i => {
          var data = i.data
          fs.writeFile(
              `${__dirname}/${args[0]}.js`,
              data,
              "utf-8",
              function (err) {
                  if (err) return api.sendMessage(`Đ𝐚̃ 𝐱𝐚̉𝐲 𝐫𝐚 𝐥𝐨̂̃𝐢 𝐤𝐡𝐢 𝐚́𝐩 𝐝𝐮̣𝐧𝐠 𝐜𝐨𝐝𝐞 𝐯𝐚̀𝐨 ${args[0]}.𝐣𝐬`, threadID, messageID);
                  api.sendMessage(`Đ𝐚̃ 𝐚́𝐩 𝐝𝐮̣𝐧𝐠 𝐜𝐨𝐝𝐞 𝐯𝐚̀𝐨 ${args[0]}.𝐣𝐬, 𝐬𝐮̛̉ 𝐝𝐮̣𝐧𝐠 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐥𝐨𝐚𝐝 đ𝐞̂̉ 𝐬𝐮̛̉ 𝐝𝐮̣𝐧𝐠!`, threadID, messageID);
              }
          );
      })
  }

  if (url[0].indexOf('buildtool') !== -1 || url[0].indexOf('tinyurl.com') !== -1) {
      const options = {
          method: 'GET',
          url: messageReply.body
      };
      request(options, function (error, response, body) {
          if (error) return api.sendMessage('𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐜𝐡𝐢̉ 𝐫𝐞𝐩𝐥𝐲 𝐥𝐢𝐧𝐤 (𝐤𝐡𝐨̂𝐧𝐠 𝐜𝐡𝐮̛́𝐚 𝐠𝐢̀ 𝐤𝐡𝐚́𝐜 𝐧𝐠𝐨𝐚̀𝐢 𝐥𝐢𝐧𝐤)', threadID, messageID);
          const load = cheerio.load(body);
          load('.language-js').each((index, el) => {
              if (index !== 0) return;
              var code = el.children[0].data
              fs.writeFile(`${__dirname}/${args[0]}.js`, code, "utf-8",
                  function (err) {
                      if (err) return api.sendMessage(`Đ𝐚̃ 𝐱𝐚̉𝐲 𝐫𝐚 𝐥𝐨̂̃𝐢 𝐤𝐡𝐢 𝐚́𝐩 𝐝𝐮̣𝐧𝐠 𝐜𝐨𝐝𝐞 𝐦𝐨̛́𝐢 𝐜𝐡𝐨 "${args[0]}.𝐣𝐬".`, threadID, messageID);
                      return api.sendMessage(`Đ𝐚̃ 𝐭𝐡𝐞̂𝐦 𝐜𝐨𝐝𝐞 𝐧𝐚̀𝐲 𝐯𝐚̀𝐨 "${args[0]}.𝐣𝐬", 𝐬𝐮̛̉ 𝐝𝐮̣𝐧𝐠 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐥𝐨𝐚𝐝 đ𝐞̂̉ 𝐬𝐮̛̉ 𝐝𝐮̣𝐧𝐠!`, threadID, messageID);
                  }
              );
          });
      });
      return
  }
  if (url[0].indexOf('drive.google') !== -1) {
    var id = url[0].match(/[-\w]{25,}/)
    const path = resolve(__dirname, `${args[0]}.js`);
    try {
      await utils.downloadFile(`https://drive.google.com/u/0/uc?id=${id}&export=download`, path);
      return api.sendMessage(`Đã thêm code này vào "${args[0]}.js" nếu xảy ra lỗi thì đổi file drive thành txt nhé!`, threadID, messageID);
    }
    catch(e) {
      return api.sendMessage(`Đã xảy ra lỗi khi áp dụng code mới cho "${args[0]}.js".`, threadID, messageID);
     }
               }
          }