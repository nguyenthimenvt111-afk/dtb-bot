/*
* @Module made by Binee
* @No edit credits
* @Ban user edit credits
*/
module.exports.config = {
    name: "sieunhan",
    version: "1.0.2",
    hasPermssion: 0,
    credits: "dtb",
    description: "Game Siêu nhân gao có đặt cược </> Coder by Binee",
    commandCategory: "Trò Chơi",
    usages: "<[trắng/đỏ/bạc/vàng/biển/đen] hoặc[⚪/🔴/🔘/🟡/🔵/⚫]> <Số tiền cược (lưu ý phải trên 50$)>",
    cooldowns: 0
  };
  
  module.exports.run = async function({ api, event, args, Currencies, getText, permssion }) {
    try {
      const { threadID, messageID, senderID } = event;
      const { getData, increaseMoney, decreaseMoney } = Currencies;
      const request = require('request');
      const axios = require('axios');
      // verified
      const { readdirSync, readFileSync, writeFileSync, existsSync, copySync, createWriteStream, createReadStream } = require("fs-extra");
      const slotItems = ["trắng", "đỏ", "bạc", "vàng", "biển", "đen"];
      const money = (await getData(senderID)).money;
      if (isNaN(args[1]) == true) return api.sendMessage('Nội dung "Số tiền cược" mà bạn nhập không phải 1 con số hợp lệ!', threadID, messageID);
      var moneyBet = parseInt(args[1]);
      if (isNaN(moneyBet) || moneyBet <= 50) return api.sendMessage('Số tiền đặt cược không được dưới 50$', threadID, messageID);
      if (moneyBet > money) return api.sendMessage('Tài khoản của bạn không đủ tiền để chơi.', threadID, messageID);
      var number = [], list = [], listimg = [], win = false;
      var baucua1 = slotItems[Math.floor(Math.random() * slotItems.length)];
      var baucua2 = slotItems[Math.floor(Math.random() * slotItems.length)];
      var baucua3 = slotItems[Math.floor(Math.random() * slotItems.length)];
      // ARGS
      let content = args[0];
      var content1;
      if (content == 'trắng' || content == '⚪') {
        content1 = 'trăng';
      }
      else if (content == 'đỏ' || content == '🔴') {
        content1 = 'do';
      }
      else if (content == 'bạc' || content == '🔘') {
        content1 == 'bac';
      }
      else if (content == 'vàng' || content == '🟡') {
        content1 = 'vang';
      }
      else if (content == 'biển' || content == '🔵') {
        content1 = 'bien';
      }
      else if (content == 'đen' || content == '⚫') {
        content1 = 'den';
      }
      else {
        return api.sendMessage(`Sai định dạng\n${global.config.PREFIX}${this.config.name} <[trắng/đỏ/bạc/vàng/biển/đen] hoặc[⚪/🔴/🔘/🟡/🔵/⚫]> <Số tiền cược (lưu ý phải trên 50$)>`, threadID, messageID);
      }
      // request
      if (!existsSync(__dirname + '/cache/trang.jpg')) {
        request('https://i.imgur.com/o6K6STA.jpg').pipe(createWriteStream(__dirname + '/cache/trang.jpg'));
      }
      if (!existsSync(__dirname + '/cache/do.jpg')) {
        request('https://i.imgur.com/6yB8LUg.jpg').pipe(createWriteStream(__dirname + '/cache/do.jpg'));
      }
      if (!existsSync(__dirname + '/cache/bac.jpg')) {
        request('https://i.imgur.com/nJdHgFV.jpg').pipe(createWriteStream(__dirname + '/cache/bac.jpg'));
      }
      if (!existsSync(__dirname + '/cache/vang.jpg')) {
        request('https://i.imgur.com/9oT0Pwk.jpg').pipe(createWriteStream(__dirname + '/cache/vang.jpg'));
      }
      if (!existsSync(__dirname + '/cache/bien.jpg')) {
        request('https://i.imgur.com/GouAB46.jpg').pipe(createWriteStream(__dirname + '/cache/bien.jpg'));
      }
      if (!existsSync(__dirname + '/cache/den.jpg')) {
        request('https://i.imgur.com/fvCORQp.jpg').pipe(createWriteStream(__dirname + '/cache/den.jpg'));
      }
      if (!existsSync(__dirname + '/cache/snhangao.gif')) {
        request('https://i.imgur.com/JSa5heh.gif').pipe(createWriteStream(__dirname + '/cache/snhangao.gif'));
      }
      // snhangao 1
      if (baucua1 == 'trắng') {
        var bau1 = 'trang';
        var bau_1 = __dirname + '/cache/trang.jpg';
      }
      else if (baucua1 == 'đỏ') {
        var bau1 = 'do';
        var bau_1 = __dirname + '/cache/do.jpg';
      }
      else if (baucua1 == 'bạc') {
        var bau1 = 'bac';
        var bau_1 = __dirname + '/cache/bac.jpg';
      }
      else if (baucua1 == 'vàng') {
        var bau1 = 'vang';
        var bau_1 = __dirname + '/cache/vang.jpg';
      }
      else if (baucua1 == 'biển') {
        var bau1 = 'bien';
        var bau_1 = __dirname + '/cache/bien.jpg';
      }
      else if (baucua1 == 'đen') {
        var bau1 = 'den';
        var bau_1 = __dirname + '/cache/den.jpg';
      }
      // baucua 2
      if (baucua2 == 'trắng') {
        var bau2 = 'trang';
        var bau_2 = __dirname + '/cache/trang.jpg';
      }
      else if (baucua2 == 'đỏ') {
        var bau2 = 'do';
        var bau_2 = __dirname + '/cache/do.jpg';
      }
      else if (baucua2 == 'bạc') {
        var bau2 = 'bac';
        var bau_2 = __dirname + '/cache/bac.jpg';
      }
      else if (baucua2 == 'vàng') {
        var bau2 = 'vang';
        var bau_2 = __dirname + '/cache/vvang.jpg';
      }
      else if (baucua2 == 'biển') {
        var bau2 = 'bien';
        var bau_2 = __dirname + '/cache/bien.jpg';
      }
      else if (baucua2 == 'đen') {
        var bau2 = 'den';
        var bau_2 = __dirname + '/cache/den.jpg';
      }
      // baucua 3
      if (baucua3 == 'trắng') {
        var bau3 = 'trang';
        var bau_3 = __dirname + '/cache/trang.jpg';
      }
      else if (baucua3 == 'đỏ') {
        var bau3 = 'do';
        var bau_3 = __dirname + '/cache/do.jpg';
      }
      else if (baucua3 == 'bạc') {
        var bau3 = 'bac';
        var bau_3 = __dirname + '/cache/bac.jpg';
      }
      else if (baucua3 == 'vàng') {
        var bau3 = 'vang';
        var bau_3 = __dirname + '/cache/vang.jpg';
      }
      else if (baucua3 == 'biển') {
        var bau3 = 'bien';
        var bau_3 = __dirname + '/cache/bien.jpg';
      }
      else if (baucua3 == 'đen') {
        var bau3 = 'den';
        var bau_3 = __dirname + '/cache/den.jpg';
      }
      // array baucua
      list.push(bau1);
      list.push(bau2);
      list.push(bau3);
      // array img
      listimg.push(createReadStream(__dirname + '/cache/' + bau1 + '.jpg'))
      listimg.push(createReadStream(__dirname + '/cache/' + bau2 + '.jpg'))
      listimg.push(createReadStream(__dirname + '/cache/' + bau3 + '.jpg'))
      // ICON
      // icon 1
      if (bau1 == 'trang') {
        var icon1 = '⚪';
      }
      else if (bau1 == 'do') {
        var icon1 = '🔴'
      }
      else if (bau1 == 'bac') {
        var icon1 = '🔘';
      }
      else if (bau1 == 'vang') {
        var icon1 = '🟡';
      }
      else if (bau1 == 'bien') {
        var icon1 = '🔵';
      }
      else if (bau1 == 'den') {
        var icon1 = '⚫';
      }
      // icon 2
      if (bau2 == 'trang') {
        var icon2 = '⚪';
      }
      else if (bau2 == 'do') {
        var icon2 = '🔴'
      }
      else if (bau2 == 'bac') {
        var icon2 = '🔘';
      }
      else if (bau2 == 'vang') {
        var icon2 = '🟡';
      }
      else if (bau2 == 'bien') {
        var icon2 = '🔵';
      }
      else if (bau2 == 'den') {
        var icon2 = '⚫';
      }
      // icon 3
      if (bau3 == 'trang') {
        var icon3 = '⚪';
      }
      else if (bau3 == 'do') {
        var icon3 = '🔴'
      }
      else if (bau3 == 'bac') {
        var icon3 = '🔘';
      }
      else if (bau3 == 'vang') {
        var icon3 = '🟡';
      }
      else if (bau3 == 'bien') {
        var icon3 = '🔵';
      }
      else if (bau3 == 'den') {
        var icon3 = '⚫';
      }
      // sendMessage
      api.sendMessage({
        body: '[🚧] Siu nhân nào ra đây UwU [🚧] \n[🔰] Chờ đợi là hạnh phúc chúc may mắn [🔰]:>>',
        attachment: createReadStream(__dirname + '/cache/snhangao.gif')
      }, threadID, (err, info) => {
        if (err) return api.sendMessage(err, threadID, messageID);
        setTimeout(() => {
          api.unsendMessage(info.messageID);
          var check = list.findIndex(i => i.toString() == content1);
          var check2 = list.includes(content1);
          //console.log(check);
          //console.log(icon1 + icon2 + icon3);
          if (check >= 0 || check2 == true) {
            return api.sendMessage({
              body: `[⚜️] Màu của siêu nhân tương ứng [⚜️]: ${icon1} | ${icon2} | ${icon3}\n[🔰] Đoán đúng rùi nên cho bạn \n[💸] ${moneyBet * 3} 𝙑𝙉𝘿`,
              attachment: listimg
            }, threadID, () => Currencies.increaseMoney(senderID, moneyBet * 3), messageID);
          }
          else if (check < 0 || check2 == false) {
            return api.sendMessage({
              body: `[⚜️] Màu của siêu nhân tương ứng [⚜️]: ${icon1} | ${icon2} | ${icon3}\n[🔰] Bạn đã thua và bị trừ \n[💸] ${moneyBet} 𝙑𝙉𝘿`,
              attachment: listimg
            }, threadID, () => Currencies.decreaseMoney(senderID, moneyBet), messageID);
          }
          else {
            return api.sendMessage('Đã xảy ra lỗi. Vui lòng thử lại sau 5s', threadID, messageID);
          }
        }, 3000);
      }, messageID);
    }
    catch (err) {
      console.error(err);
      return api.sendMessage(err, event.threadID, event.messageID);
    }
  }