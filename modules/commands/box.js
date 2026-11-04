module.exports.config = {
    name: "box",
    version: "2.1.1",
    hasPermssion: 1,
    credits: "dtb",
    description: "Các cài đặt của nhóm",
    commandCategory: "Quản Lí Box",
    usages: "[id/name/setnamebox/emoji/me setqtv/setqtv/image/info/new/taobinhchon/setname/setnameall/rdcolor]",
    cooldowns: 0,
    dependencies: {
        "axios": "",
        "fs-extra": "",
        "request": ""
    }
};

const totalPath = __dirname + '/cache/data/totalChat.json';
const _24hours = 86400000;
const fs = require("fs-extra");
const request = require("request");
const axios = require("axios");

module.exports.handleEvent = async ({ api, event, args }) => {
    if (!fs.existsSync(totalPath)) fs.writeFileSync(totalPath, JSON.stringify({}));
    let totalChat = JSON.parse(fs.readFileSync(totalPath));
    if (!totalChat[event.threadID]) return;
    if (Date.now() - totalChat[event.threadID].time > (_24hours * 2)) {
        let sl = (await api.getThreadInfo(event.threadID)).messageCount;
        totalChat[event.threadID] = {
            time: Date.now() - _24hours,
            count: sl,
            ytd: sl - totalChat[event.threadID].count
        }
        fs.writeFileSync(totalPath, JSON.stringify(totalChat, null, 2));
    }
}
module.exports.handleReply = function({ api, event, handleReply }) {
    const { threadID, senderID, body } = event;
    if(senderID != handleReply.author) return;
    return api.createPoll(body, event.threadID, handleReply.obj, (err, info) => {
        if(err) return console.log(err);
        else {
            api.sendMessage(`➜ Bình chọn ${body} đã được tạo`, threadID);
            api.unsendMessage(handleReply.messageID);
            global.client.handleReply.splice(global.client.handleReply.indexOf(handleReply), 1);
        }
    });
}
module.exports.run = async function({ api, event, args, Users, Threads }) {
    const { threadID, messageID, senderID, type, mentions, messageReply } = event;
  var fullTime = global.client.getTime("fullTime");
    const moment = require("moment-timezone");
  var timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss")
    if (args.length == 0) {
      return api.sendMessage(`==== 『 𝐁𝐎𝐗 𝐂𝐎𝐍𝐅𝐈𝐆 』 ==== \n━━━━━━━━━━━━━━━\n➜ ${global.config.PREFIX}${this.config.name} id \n𝙼𝚘̂ 𝚝𝚊̉: Lấy ID của nhóm\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n➜ ${global.config.PREFIX}${this.config.name} name \n𝙼𝚘̂ 𝚝𝚊̉: Lấy tên nhóm\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n➜ ${global.config.PREFIX}${this.config.name} boxname < tên > \n𝙼𝚘̂ 𝚝𝚊̉: Đổi tên nhóm\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n➜ ${global.config.PREFIX}${this.config.name} emoji < icon > \n𝙼𝚘̂ 𝚝𝚊̉: Đổi icon nhóm\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n➜ ${global.config.PREFIX}${this.config.name} info \n𝙼𝚘̂ 𝚝𝚊̉: Xem thông tin nhóm\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n➜ ${global.config.PREFIX}${this.config.name} me setqtv \n𝙼𝚘̂ 𝚝𝚊̉: Bot sẽ thêm bạn làm Quản trị viên nhóm\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n➜ ${global.config.PREFIX}${this.config.name} setqtv < tag > \n𝙼𝚘̂ 𝚝𝚊̉: Thêm người dùng làm Quản trị viên nhóm\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n➜ ${global.config.PREFIX}${this.config.name} image < phản hồi ảnh > \n𝙼𝚘̂ 𝚝𝚊̉: Đổi ảnh bìa nhóm\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n➜ ${global.config.PREFIX}${this.config.name} new < tag > \n𝙼𝚘̂ 𝚝𝚊̉: Tạo 1 nhóm mới với những người được tag!\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n➜ ${global.config.PREFIX}${this.config.name} info < tag > \n𝙼𝚘̂ 𝚝𝚊̉: Xem thông tin người dùng facebook\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n➜ ${global.config.PREFIX}${this.config.name} taobinhchon \n𝙼𝚘̂ 𝚝𝚊̉: Tạo bình chọn trong nhóm\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n➜ ${global.config.PREFIX}${this.config.name} setname < tag/phản hồi > < biệt danh > → Đặt biệt danh thành viên nhóm\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n➜ ${global.config.PREFIX}${this.config.name} setnameall < biệt danh > \n𝙼𝚘̂ 𝚝𝚊̉: Đặt biệt danh đồng bộ tất cả thành viên nhóm\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n➜ ${global.config.PREFIX}${this.config.name} rdcolor \n𝙼𝚘̂ 𝚝𝚊̉: Thiết lập chủ đề nhóm ngẫu nhiên\n\n━━━━━━━━━━━━━━━\n\n===「${timeNow}」===`, threadID);
    }
    var id = [event.senderID] || [];
  var main = event.body;
  var groupTitle = main.slice(main.indexOf("|") +2)
  if (args[0] == "new") {
   for (var i = 0; i < Object.keys(event.mentions).length; i++) 
id.push(Object.keys(event.mentions)[i]);
  api.createNewGroup(id, groupTitle,() => {
    api.sendMessage(` ➜ Đã tạo nhóm ${groupTitle}`, event.threadID)
  })
}
   if (args[0] == "id") {
    return api.sendMessage(` ➜ ID của box đây: ${event.threadID}`, event.threadID, event.messageID);
  }

  if (args[0] == "name") {
    var nameThread = global.data.threadInfo.get(event.threadID).threadName || ((await Threads.getData(event.threadID)).threadInfo).threadName;
    return api.sendMessage(nameThread, event.threadID, event.messageID);
  }

  if (args[0] == "namebox") {
    var content = args.join(" ");
    var c = content.slice(7, 99) || event.messageReply.body;
    api.setTitle(`${c}`, event.threadID);
  }

  if (args[0] == "emoji") {
    const name = args[1] || event.messageReply.body;
    api.changeThreadEmoji(name, event.threadID)

  }

  if (args[0] == "me") {
    if (args[1] == "qtv") {
      const threadInfo = await api.getThreadInfo(event.threadID)
      const find = threadInfo.adminIDs.find(el => el.id == api.getCurrentUserID());
      if (!find) api.sendMessage("➜ BOT cần ném quản trị viên để dùng ?", event.threadID, event.messageID)
      else if (!global.config.ADMINBOT.includes(event.senderID)) api.sendMessage("➜ Quyền lồn biên giới ?", event.threadID, event.messageID)
      else api.changeAdminStatus(event.threadID, event.senderID, true);
    }
  }

  if (args[0] == "qtv") {
    if (args.join().indexOf('@') !== -1) {
      namee = Object.keys(event.mentions)
    } else namee = args[1]
    if (event.messageReply) {
      namee = event.messageReply.senderID
    }

    const threadInfo = await api.getThreadInfo(event.threadID)
    const findd = threadInfo.adminIDs.find(el => el.id == namee);
    const find = threadInfo.adminIDs.find(el => el.id == api.getCurrentUserID());
    const finddd = threadInfo.adminIDs.find(el => el.id == event.senderID);

    if (!finddd) return api.sendMessage(" ➜ Bạn méo phải quản trị viên box ?", event.threadID, event.messageID);
    if (!find) {
      api.sendMessage(" ➜ Không ném quản trị viên dùng kiểu gì ?", event.threadID, event.messageID)
    }
    if (!findd) {
      api.changeAdminStatus(event.threadID, namee, true);
    } else api.changeAdminStatus(event.threadID, namee, false)
  }

  if (args[0] == "image") {
    if (event.type !== "message_reply") return api.sendMessage(" ➜ Bạn phải reply một audio, video, ảnh nào đó", event.threadID, event.messageID);
    if (!event.messageReply.attachments || event.messageReply.attachments.length == 0) return api.sendMessage("➜ Bạn phải reply một audio, video, ảnh nào đó", event.threadID, event.messageID);
    if (event.messageReply.attachments.length > 1) return api.sendMessage(`➜ Bạn phải reply một audio, video, ảnh nào đó`, event.threadID, event.messageID);
    var callback = () => api.changeGroupImage(fs.createReadStream(__dirname + "/cache/1.png"), event.threadID, () => fs.unlinkSync(__dirname + "/cache/1.png"));
    return request(encodeURI(event.messageReply.attachments[0].url)).pipe(fs.createWriteStream(__dirname + '/cache/1.png')).on('close', () => callback());
  };
  if (args[0] == "taobinhchon") {
    const { threadID, messageID, senderID } = event;
    let options = args.splice(1).join(" ").split("|");
    let obj = {}
    for(let item of options) obj[item] = false;
    api.sendMessage(` ➜ Tạo thành công các bình chọn ${options.join(",")}\n ➜ Hãy phản hồi tin nhắn này để tạo tiêu đề`, event.threadID, (err, info) => {
        if(err) return console.log(err);
        else {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID,
                obj
            })
        }
    });
  }
  if (args[0] == "setname") {
if (event.type == "message_reply") {
    const name = args.splice(1).join(" ")
    return api.changeNickname(`${name}`, event.threadID, event.messageReply.senderID);
  }
  else {
    const name = args.splice(1).join(" ")
	const mention = Object.keys(event.mentions)[0];
	if (!mention) return api.changeNickname(`${name}`, event.threadID, event.senderID);
	if (mention[0]) return api.changeNickname(`${name.replace(event.mentions[mention], "")}`, event.threadID, mention);
  }
  }
  if (args[0] == "rdcolor") {
    var color = ['196241301102133', '169463077092846', '2442142322678320', '234137870477637', '980963458735625', '175615189761153', '2136751179887052', '2058653964378557', '2129984390566328', '174636906462322', '1928399724138152', '417639218648241', '930060997172551', '164535220883264', '370940413392601', '205488546921017', '809305022860427'];
    api.changeThreadColor(color[Math.floor(Math.random() * color.length)], event.threadID)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (args[0] == "setnameall") {
    var threadInfo = await api.getThreadInfo(event.threadID)
  var idtv = threadInfo.participantIDs
  console.log(threadInfo)
  const name = args.splice(1).join(" ")
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
  for (let setname of idtv) {
    await delay(3000)
    api.changeNickname(`${name}`, event.threadID, setname);
  }
  }
    if (args[0] == "info") {
        try {
            if (!fs.existsSync(totalPath)) fs.writeFileSync(totalPath, JSON.stringify({}));
            let totalChat = JSON.parse(fs.readFileSync(totalPath));
            let threadInfo = await api.getThreadInfo(args[1] || threadID); 
             let timeByMS = Date.now();
 const threadSetting = (await Threads.getData(String(event.threadID))).data || 
    {};
            var memLength = threadInfo.participantIDs.length;
            let threadMem = threadInfo.participantIDs.length;
            var nameMen = [];
            var gendernam = [];
            var gendernu = [];
            var nope = [];
            for (let z in threadInfo.userInfo) {
                var gioitinhone = threadInfo.userInfo[z].gender;
                var nName = threadInfo.userInfo[z].name;
                if (gioitinhone == "MALE") {
                    gendernam.push(z + gioitinhone)
                } else if (gioitinhone == "FEMALE") {
                  gendernu.push(gioitinhone)
                } else {
                    nope.push(nName)
                }
            };
            var { adminIDs } = await api.getThreadInfo(args[1] || threadID);
            var adminName = [];
            for (const arrayAdmin of adminIDs) {
          const name = await Users.getNameUser(arrayAdmin.id)
          adminName.push(name)
            }
            var nam = gendernam.length;
            var nu = gendernu.length;
            let qtv = threadInfo.adminIDs.length;
            let sl = threadInfo.messageCount;
            let u = threadInfo.nicknames;
            let icon = threadInfo.emoji;
            let color = threadInfo.color;
            let threadName = threadInfo.threadName;
            let id = threadInfo.threadID;
            let sex = threadInfo.approvalMode;
            var pd = sex == false ? 'tắt' : sex == true ? 'bật' : 'kh';
            if (!totalChat[args[1] || threadID]) {
              totalChat[args[1] || threadID] = {
                    time: timeByMS,
                    count: sl,
                    ytd: 0
                }
              fs.writeFileSync(totalPath, JSON.stringify(totalChat, null, 2));
            }
            let mdtt = Math.floor(Math.random() * 101);
            let preCount = totalChat[args[1] || threadID].count || 0;
            let ytd = totalChat[args[1] || threadID].ytd || 0;
            let hnay = (ytd != 0) ? (sl - preCount) : "chưa có thống kê";
            let hqua = (ytd != 0) ? ytd : "chưa có thống kê";
            if (timeByMS - totalChat[args[1] || threadID].time > _24hours) {
                if (timeByMS - totalChat[args[1] || threadID].time > (_24hours * 2)) {
                  totalChat[args[1] || threadID].count = sl;
                  totalChat[args[1] || threadID].time = timeByMS - _24hours;
                  totalChat[args[1] || threadID].ytd = sl - preCount;
                  fs.writeFileSync(totalPath, JSON.stringify(totalChat, null, 2));
                }
                getHour = Math.ceil((timeByMS - totalChat[args[1] || event.threadID].time - _24hours) / 3600000);
                if (ytd == 0) mdtt = 100;
                else mdtt = ((((hnay) / ((hqua / 24) * getHour))) * 100).toFixed(0);
                mdtt += "%";
            }
            var callback = () =>
                api.sendMessage({
                        body: `=== 𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝚃𝙸𝙾𝙽 ===\n────────────\n→ Tên nhóm: ${threadName || "không có"}\n→ ID: ${id}\n→ Phê duyệt: ${pd}\n→ Biểu tượng: ${icon || "👍"}\n→ Mã giao diện: ${color}\n→ Dấu lệnh hệ thống: ${global.config.PREFIX}\n→ Tổng: ${threadMem} thành viên\n→ Nam: ${nam} thành viên\n→ Nữ: ${nu} thành viên\n→ Quản trị viên: ${qtv}\n→ Danh sách quản trị viên nhóm:\n[👉] ${adminName.join('\n[👉] ')}\n────────────\n→ Tổng tin nhắn: ${sl} tin nhắn\n→ Mức độ tương tác: ${mdtt}\n→ Tổng số tin nhắn hôm qua: ${hqua}\n→ Tổng tin nhắn hôm nay: ${hnay}\n→ Ngày tạo dữ liệu: ${fullTime}\n\n━━━━━━━━━━━━━━━\n===「${timeNow}」===`,
                        attachment: fs.createReadStream(__dirname + '/cache/1.png')
                    },
                    threadID,
                    () => fs.unlinkSync(__dirname + '/cache/1.png'),
                    messageID
                );
            return request(encodeURI(`${threadInfo.imageSrc}`))
              .pipe(fs.createWriteStream(__dirname + '/cache/1.png'))
                .on('close', () => callback());
        } 
        catch (e) {
            return (
              console.log(e),
              api.sendMessage(`➜ Không thể lấy thông tin nhóm của bạn!\n${e}`, threadID, messageID)
            )
        }
    }
 }
