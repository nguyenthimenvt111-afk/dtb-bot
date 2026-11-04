module.exports.config = {
    name: "tikinfo",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Info user tiktok",
    commandCategory: "Nhóm",
    usages: "[username]",
    cooldowns: 5,
    dependencies: {
      "axios": "",
      "fs": "",
      "request": ""
    },
    envConfig: {
        "apikey": "fOeckmtu"
    }
}
module.exports.run = async function({ api, event, args }) {
  // const url = 'https://nguyenmanh.name.vn/api/tikInfo?query='
  // const axios = require('axios')
  // const fs = require('fs')
  // const {threadID, messageID} = event
  // const {apikey} = global.config[this.config.name]
  // try {
  //   if (args.length == 0) {
  //     return api.sendMessage('Nhập username người dùng.', threadID, messageID)
  //   }
  //   const data = await axios.get('https://nguyenmanh.name.vn/api/tikInfo?query=' + args[0] + '&apikey=' + apikey)
  //   return api.sendMessage(data, threadID, messageID)
  // }
  // catch(e) {
  //   return api.sendMessage(e.message, threadID, messageID)
  // }

    var url_api = 'https://nguyenmanh.name.vn/api/tikInfo?query='
    const request = require("request");
    const axios = require("axios");
    const fs = require("fs");
    const {apikey} = global.config[this.config.name];
    const { senderID } = event;
    if (!args[0]) return api.sendMessage('Nhập username người dùng');
    var query = args.join(" ");
    const {data} = await axios.get(url_api + encodeURI(query)+ '&apikey='+ apikey);
    if (data.status != 200) return api.sendMessage(data.result)
    const { nickname, verified, uniqueId, avatar, signature, privateAccount } = data.result;
    const { followerCount, followingCount, heart, diggCount, videoCount } = data.result;
    var dataJson = `===「USER TIKTOK」===` +
        `\n\n🤓 Tên: ${nickname}` +
        `\n🔖 ID: ${uniqueId}` +
        `\n🐥 Link: https://tiktok.com/@${uniqueId}` +
        `\n${privateAccount ? "🔒 Tài khoản riêng tư: có" : "🔓 Tài khoản riêng tư: không"}` +
        `\n👀 Người theo dõi: ${followerCount}` +
        `\n♻️ Đang theo dõi: ${followingCount}` +
        `\n💗 Lượt tim: ${heart}` +
        `\n💞 Đã thả tim: ${diggCount} video` +
        `\n📤 Video đã đăng: ${videoCount}` +
        `\n📝 Tiểu sử: ${signature}` +
        `\n✅ Tích xanh: ${verified ? "có" : "không"}`;
    var callback = () => api.sendMessage({
            body: dataJson,
            attachment: fs.createReadStream(__dirname + `/cache/${senderID}-info.png`)
        },
        () => fs.unlinkSync(__dirname + `/cache/${senderID}-info.png`));
return request(encodeURI(`${avatar}`)).pipe(fs.createWriteStream(__dirname + `/cache/${senderID}-info.png`)).on('close', () => callback());
}