module.exports.config = {
  name: "restart",
  version: "2.0.2",
  hasPermssion: 3,
  credits: "dtb",
  description: "Khởi động lai bot",
  commandCategory: "Hệ Thống",
  usages: "restart",
  cooldowns: 5,
  dependencies: { }
}

module.exports.run = async function({ api, args, Users, event}) {
const { threadID, messageID } = event;
const axios = global.nodemodule["axios"];

const moment = require("moment-timezone");
  var gio = moment.tz("Asia/Ho_Chi_Minh").format("HH");
  var phut = moment.tz("Asia/Ho_Chi_Minh").format("mm");
  var giay = moment.tz("Asia/Ho_Chi_Minh").format("ss");
const fs = require("fs");
  let name = await Users.getNameUser(event.senderID)
if (event.senderID != 100040472494187) return api.sendMessage(`Tuổi?`, event.threadID, event.messageID)
if(args.length == 0) api.sendMessage(`𝐃̄𝐚̃ 𝐧𝐡𝐚̣̂𝐧 𝐥𝐞̣̂𝐧𝐡 𝐫𝐞𝐬𝐭𝐚𝐫𝐭 𝐭𝐮̛̀ 𝐚𝐝𝐦𝐢𝐧 𝐯𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐝̄𝐨̛̣𝐢`,event.threadID, () =>process.exit(1))
else{    
let time = args.join(" ");
setTimeout(() =>
api.sendMessage(`𝐁𝐨𝐭 𝐬𝐞̃ 𝐤𝐡𝐨̛̉𝐢 𝐝̄𝐨̣̂𝐧𝐠 𝐥𝐚̣𝐢 𝐬𝐚𝐮: ${gio}s\n[⏰] 𝐁𝐚̂𝐲 𝐠𝐢𝐨̛̀ 𝐥𝐚̀: ${gio}:${phut}:${giay} `, threadID), 0)
setTimeout(() =>
api.sendMessage("𝐃̄𝐚𝐧𝐠 𝐛𝐚̆́𝐭 𝐝̄𝐚̂̀𝐮 𝐪𝐮𝐚́ 𝐭𝐫𝐢̀𝐧𝐡 𝐤𝐡𝐨̉𝐢 𝐝̄𝐨̣̂𝐧𝐠 𝐥𝐚̣𝐢",event.threadID, () =>process.exit(1)), 1000*`${time}`);
}
}