module.exports.config = {
    name: `kbb`,
    version: `1.0.0`,
    hasPermssion: 0,
    credits: `D-Jukie`,
    description: `Kéo búa bao (Oẳn tù tì)`,
    commandCategory: `Trò Chơi`,
    usages: `[kéo/búa/bao]`,
    cooldowns: 0
};
module.exports.run = async function({ api, event, args, Users, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const money = (await Currencies.getData(senderID)).money;
    const fs = global.nodemodule["fs-extra"];
    const axios = global.nodemodule["axios"];

    const listIMG = ['https://i.imgur.com/1uBAGlO.jpg', 'https://i.imgur.com/EOZx1tL.jpg', 'https://i.imgur.com/2WSbVaK.jpg'];
    const listItem = ['kéo', 'búa', 'bao'];

    var bot = listItem[Math.floor(Math.random() * listItem.length)];

    var user = args[0];
    var coins = args[1];
    if(!user) return api.sendMessage('Thiếu dữ liệu!', threadID, messageID);
    if(listItem.includes(user.toLowerCase()) == false) return api.sendMessage('Lựa chọn không hợp lệ', threadID, messageID);

    var fu = listItem.findIndex(i => i == user);
    var fb = listItem.findIndex(i => i == bot);
    var a = [fu, fb];
    
    if (args[1] < 50 || isNaN(args[1])) return api.sendMessage(`Mức đặt cược của bạn không phù hợp hoặc dưới 50 BAO`, threadID, messageID);
    if (money < coins) return api.sendMessage(`Bạn không đủ ${coins} BAO để chơi`, threadID, messageID);

    var compare = function (choice1, choice2){
        var out = [`✌️`, `👊`, `✋`];
        var checkwin = []
        var msgWin = `\nNgười: ${out[fu]}\nBot: ${out[fb]}\nCộng: ${coins} BAO`
        var msgLose = `\nNgười: ${out[fu]}Bot: ${out[fb]}\nTrừ: ${coins} BAO`
        if(choice1 == choice2) {
            checkwin.push(`Hòa\nNgười: ${out[fu]}\nBot: ${out[fb]}`)
            checkwin.push(3)
            return checkwin
        }
        if(choice1 == 'búa') {
            if(choice2 == 'kéo') {
                checkwin.push(`Thắng ${msgWin}`)
                checkwin.push(0)
                return checkwin
            }
            if(choice2 == 'bao') {
                checkwin.push(`Thua ${msgLose}`)
                checkwin.push(1)
                return checkwin
            }
        }
        if(choice1 == 'bao') {
            if(choice2 == 'búa') {
                checkwin.push(`Thắng ${msgWin}`)
                checkwin.push(0)
                return checkwin
            }
            if(choice2 == 'kéo') {
                checkwin.push(`Thua ${msgLose}`)
                checkwin.push(1)
                return checkwin
            }
        }
        if(choice1 == 'kéo') {
            if(choice2 == 'bao') {
                checkwin.push(`Thắng ${msgWin}`)
                checkwin.push(0)
                return checkwin
            }
            if(choice2 == 'búa') {
                checkwin.push(`Thua ${msgLose}`)
                checkwin.push(1)
                return checkwin
            }
        }
    };
    async function image(list) {
        var images = [];
        try {
            let download = (await axios.get(`${list[fb]}`, { responseType: "arraybuffer", timeout: 6000 } )).data; 
            let download_2 = (await axios.get(`${list[fu]}`, { responseType: "arraybuffer", timeout: 6000 } )).data; 
            fs.writeFileSync( __dirname + `/cache/avt${fb}.png`, Buffer.from(download));
            fs.writeFileSync( __dirname + `/cache/avt${fu}.png`, Buffer.from(download_2));
            images.push(fs.createReadStream(__dirname + `/cache/avt${fu}.png`));
            images.push(fs.createReadStream(__dirname + `/cache/avt${fb}.png`));
        } catch (_) {}
        return images;
    }
    async function moneyU(type) {
        if(type == 3) return
        if(type == 0)  return Currencies.setData(senderID, options = {money: money + parseInt(coins)});
        if(type == 1) return Currencies.setData(senderID, options = {money: money - parseInt(coins)});
    }
    await moneyU(compare(user, bot)[1])
    var msg = {body: compare(user, bot)[0], attachment: await image(listIMG)}
    return api.sendMessage(msg, threadID, messageID);
}


