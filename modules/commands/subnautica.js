const path = require("path");
const axios = require("axios");
module.exports.config = {
    name: "subnautica",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Câu cá ở một hành tinh khác, dựa theo tựa game Subnautica khiến bạn đái ra máu vì độ đa dạng của nó UwU",
    commandCategory: "Trò Chơi",
    usages: "",
    cooldowns: 0,
    envConfig: {
        APIKEY: ""
    }
};

module.exports.checkPath = function (type, senderID) {
    const pathItem = path.join(__dirname, 'game','cauca', `item.json`);
    const pathUser = path.join(__dirname, 'game','cauca', 'datauser', `${senderID}.json`);
    const pathUser_1 = require("./game/cauca/datauser/" + senderID + '.json');
    const pathItem_1 = require("./game/cauca/item.json");
    if (type == 1) return pathItem
    if (type == 2) return pathItem_1
    if (type == 3) return pathUser
    if (type == 4) return pathUser_1
}

module.exports.onLoad = async () => {
    const fs = require("fs-extra");
    const axios = require("axios");

    const dir = __dirname + `/game/cauca/`;
    const dirCache = __dirname + `/game/cauca/cache/`;
    const dirData = __dirname + `/game/cauca/datauser/`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, {
        recursive: true
    });
    if (!fs.existsSync(dirData)) fs.mkdirSync(dirData, {
        recursive: true
    });
    if (!fs.existsSync(dirCache)) fs.mkdirSync(dirCache, {
        recursive: true
    });

    if (!fs.existsSync(dir + "data.json")) (await axios({
        url: "https://raw.githubusercontent.com/phamvandien1/abc/main/data.json",
        method: 'GET',
        responseType: 'stream'
    })).data.pipe(fs.createWriteStream(dir + "data.json"));

    if (!fs.existsSync(dir + "item.json")) (await axios({
        url: "https://raw.githubusercontent.com/phamvandien1/abc/main/item.json",
        method: 'GET',
        responseType: 'stream'
    })).data.pipe(fs.createWriteStream(dir + "item.json"));
    return;
}

module.exports.run = async function ({
    api,
    event,
    args,
    Users,
    Currencies
}) {
    const {
        threadID,
        messageID,
        senderID
    } = event;
    const {
        readFileSync,
        writeFileSync,
        existsSync,
        createReadStream,
        readdirSync
    } = require("fs-extra")
    const axios = require("axios")
    const pathData = path.join(__dirname, 'game','cauca', 'datauser', `${senderID}.json`);
    switch (args[0]) {
    case 'register':
    case '-r': {
        const nDate = new Date().toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh'
        });
        if (!existsSync(pathData)) {
            var obj = {};
            obj.name = (await Users.getData(senderID)).name;
            obj.ID = senderID;
            obj.mainROD = null,
                obj.GPS = {};
            obj.GPS.locate = null,
                obj.GPS.area = null,
                obj.fishBag = [];
            obj.item = [];
            obj.timeRegister = nDate
            obj.fishBag.push({
                ID: 0,
                name: 'Cá Thách Đấu',
                category: 'Legendary',
                size: 999999,
                sell: 0
            });
            writeFileSync(pathData, JSON.stringify(obj, null, 4));
            var msg = {body: "🦈== 𝐒𝐔𝐁𝐍𝐀𝐔𝐓𝐈𝐂𝐀 ==🦈\n\n⚔️𝗧𝗮̣𝗼 𝘁𝗵𝗮̀𝗻𝗵 𝗰𝗼̂𝗻𝗴 𝗰𝗮̂𝘂 𝗰𝗮́⚔️", attachment: await this.subnautica()}
            return api.sendMessage(msg, threadID, messageID);
        } else return api.sendMessage({body: "🦈== 𝐒𝐔𝐁𝐍𝐀𝐔𝐓𝐈𝐂𝐀 ==🦈\n\n⚔️𝗕𝗮̣𝗻 𝗵𝗶𝗲̣̂𝗻 𝘁𝗮̣𝗼 𝗰𝗮𝘂𝗰𝗮 𝗿𝗼̂̀𝗶⚔️", attachment: await this.subnautica()}, threadID, messageID);
    }
    case 'shop':
    case '-s': {
        if (!existsSync(pathData)) {
            return api.sendMessage({body: "🦈== 𝐒𝐔𝐁𝐍𝐀𝐔𝐓𝐈𝐂𝐀 ==🦈\n\n𝗕𝗮̣𝗻 𝗰𝗵𝘂̛𝗮 𝘁𝗵𝘂𝗲̂ 𝗸𝗵𝘂 𝗰𝗮̂𝘂 𝗰𝗮́\n𝗛𝗮̃𝘆 𝗻𝗵𝗮̂́𝗻 /𝘀𝘂𝗯𝗻𝗮𝘂 -𝗿 𝘁𝗵𝘂𝗲̂ 𝗸𝗵𝘂 𝗰𝗮̂𝘂 𝗰𝗮́ 𝗻𝗵𝗲́ ⚓", attachment: await this.subnautica()}, threadID, messageID);
        }
        return api.sendMessage({body: "💸== 𝑭𝑰𝑺𝑯𝑰𝑵𝑮 𝑺𝑯𝑶𝑷 ==💸\n\n𝟭. 𝗠𝘂𝗮 𝗰𝗮̂̀𝗻 𝗰𝗮̂𝘂 🎣\n𝟮. 𝗕𝗮́𝗻 𝗰𝗮́ 𝗵𝗶𝗲̣̂𝗻 𝗰𝗼́ 🐟\n𝟯. 𝗡𝗮̂𝗻𝗴 𝗰𝗮̂́𝗽/𝗦𝘂̛̉𝗮 𝗰𝗵𝘂̛̉𝗮 𝗰𝗮̂̀𝗻 𝗰𝗮̂𝘂 🛠\n\n💎 𝐑𝐞𝐩𝐥𝐲 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐯𝐨̛́𝐢 𝐥𝐮̛̣𝐚 𝐜𝐡𝐨̣𝐧 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧", attachment: await this.subnautica()}, threadID, (error, info) => {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: event.senderID,
                type: "shop"
            })
        }, messageID);
    }
    case 'bag':
    case '-b': {
        if (!existsSync(pathData)) {
            return api.sendMessage({body: "🦈== 𝐒𝐔𝐁𝐍𝐀𝐔𝐓𝐈𝐂𝐀 ==🦈\n\n𝗕𝗮̣𝗻 𝗰𝗵𝘂̛𝗮 𝘁𝗵𝘂𝗲̂ 𝗸𝗵𝘂 𝗰𝗮̂𝘂 𝗰𝗮́\n𝗛𝗮̃𝘆 𝗻𝗵𝗮̂́𝗻 /𝘀𝘂𝗯𝗻𝗮𝘂 -𝗿 𝘁𝗵𝘂𝗲̂ 𝗸𝗵𝘂 𝗰𝗮̂𝘂 𝗰𝗮́ 𝗻𝗵𝗲́ ⚓", attachment: await this.subnautica()}, threadID, messageID);
        }
        var data = this.checkPath(4, senderID)

        return api.sendMessage({body: `🦈== 𝐒𝐔𝐁𝐍𝐀𝐔𝐓𝐈𝐂𝐀 ==🦈\n\n𝟭. 𝗖𝗮́ (𝗦𝗟: ${data.fishBag.length})\n𝟮. 𝗖𝗮̂̀𝗻 𝗰𝗮̂𝘂 (𝗦𝗟: ${data.item.length})\n\n💎 𝗩𝘂𝗶 𝗹𝗼̀𝗻𝗴 𝗿𝗲𝗽𝗹𝘆 𝘃𝗮̣̂𝘁 𝗽𝗵𝗮̂̉𝗺 𝗰𝗮̂̀𝗻 𝘅𝗲𝗺`, attachment: await this.subnautica()}, threadID, (error, info) => {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: event.senderID,
                type: "choosebag"
            })
        }, messageID);
    }
    case 'custom':
    case '-c': {
        if (!existsSync(pathData)) {
            return api.sendMessage({body: "🦈== 𝐒𝐔𝐁𝐍𝐀𝐔𝐓𝐈𝐂𝐀 ==🦈\n\n𝗕𝗮̣𝗻 𝗰𝗵𝘂̛𝗮 𝘁𝗵𝘂𝗲̂ 𝗸𝗵𝘂 𝗰𝗮̂𝘂 𝗰𝗮́\n𝗛𝗮̃𝘆 𝗻𝗵𝗮̂́𝗻 /𝘀𝘂𝗯𝗻𝗮𝘂 -𝗿 𝘁𝗵𝘂𝗲̂ 𝗸𝗵𝘂 𝗰𝗮̂𝘂 𝗰𝗮́ 𝗻𝗵𝗲́ ⚓", attachment: await this.subnautica()}, threadID, messageID);
        }
        if (args[1] == 'rod') {
            var data = this.checkPath(4, senderID)
            var listItem = '🦈== 𝐒𝐔𝐁𝐍𝐀𝐔𝐓𝐈𝐂𝐀 ==🦈\n\n',
                number = 1;
            for (let i of data.item) {
                listItem += `${number++}. ${i.name} - 𝗧𝗵𝗼̛̀𝗶 𝗴𝗶𝗮𝗻 𝗰𝗵𝗼̛̀: ${i.countdown}𝘀 - 𝗧𝗶̉ 𝗹𝗲̣̂ 𝗯𝗲̂̀𝗻: ${i.durability}\n`
            }
            listItem += '𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐫𝐞𝐩𝐥𝐲 𝐧𝐞̂́𝐮 𝐦𝐮𝐨̂́𝐧 𝐭𝐡𝐚𝐲 𝐜𝐚̂̀𝐧 𝐜𝐚̂𝐮 𝐜𝐡𝐢́𝐧𝐡 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧'
            return api.sendMessage(listItem, threadID, (error, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    type: "rodMain",
                    data: data,
                    item: data.item
                })
            }, messageID);
        }
        if (args[1] == 'locate') {
            return api.sendMessage({body: "🐙==𝐊𝐇𝐔 𝐕𝐔̛̣𝐂 𝐂𝐀̂𝐔==🐙\n\n𝟭. 𝗧𝗵𝗲 𝗖𝗿𝗮𝘁𝗲𝗿 🦑\n𝟮. 𝗦𝗲𝗰𝘁𝗼𝗿 𝗭𝗲𝗿𝗼 🦀", attachment: await this.subnautica()}, threadID, (error, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    type: "location"
                })
            }, messageID);
        }
    }
    case 'help': {
            return api.sendMessage({body: "🦈== 𝐒𝐔𝐁𝐍𝐀𝐔𝐓𝐈𝐂𝐀 ==🦈\n\n- 𝗥: 𝗧𝗮̣𝗼 𝘁𝗮̀𝗶 𝗸𝗵𝗼𝗮̉𝗻 👤\n- 𝗖𝗨𝗦𝗧𝗢𝗠: 𝗟𝘂̛̣𝗮 𝗰𝗵𝗼̣𝗻 𝗸𝗵𝘂 𝘃𝘂̛̣𝗰 𝗰𝗮̂𝘂 𝗰𝗮́ 🐊\n- 𝗕𝗔𝗚: 𝗫𝗲𝗺 𝗯𝗮𝗹𝗼 🎒\n- 𝗦𝗛𝗢𝗣: 𝗖𝘂̛̉𝗮 𝗵𝗮̀𝗻𝗴 💰\n\n======= 𝐃-𝐉𝐮𝐤𝐢𝐞 =======", attachment: await this.subnautica()}, threadID, messageID);
        }
    default: {
        async function checkTime(cooldown, dataTime) {
            if (cooldown - (Date.now() - dataTime) > 0) {

                var time = cooldown - (Date.now() - dataTime),
                    minutes = Math.floor(time / 60000),
                    seconds = ((time % 60000) / 1000).toFixed(0);
                return api.sendMessage(`⏰ 𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐦𝐮𝐚 𝐜𝐚̂̀𝐧 𝐜𝐚̂𝐮 𝐜𝐚̂́𝐩 𝐛𝐚̣̂𝐜 𝐜𝐚𝐨 𝐡𝐨̛𝐧 𝐧𝐞̂́𝐮 𝐦𝐮𝐨̂́𝐧 𝐜𝐚̂𝐮 𝐥𝐢𝐞̂𝐧 𝐭𝐮̣𝐜 𝐭𝐫𝐨𝐧𝐠 𝐭𝐡𝐨̛̀𝐢 𝐠𝐢𝐚𝐧 𝐧𝐠𝐚̆́𝐧\n⌚ 𝐂𝐡𝐨̛̀ 𝐠𝐢𝐚𝐧 𝐜𝐡𝐨̛̀ 𝐜𝐨̀𝐧 𝐥𝐚̣𝐢: ${minutes}:${seconds}!`, threadID, messageID);
            }
        }
        if (!existsSync(pathData)) {
            return api.sendMessage({body: "🦈== 𝐒𝐔𝐁𝐍𝐀𝐔𝐓𝐈𝐂𝐀 ==🦈\n\n𝗕𝗮̣𝗻 𝗰𝗵𝘂̛𝗮 𝘁𝗵𝘂𝗲̂ 𝗸𝗵𝘂 𝗰𝗮̂𝘂 𝗰𝗮́\n𝗛𝗮̃𝘆 𝗻𝗵𝗮̂́𝗻 /𝘀𝘂𝗯𝗻𝗮𝘂 -𝗿 𝘁𝗵𝘂𝗲̂ 𝗸𝗵𝘂 𝗰𝗮̂𝘂 𝗰𝗮́ 𝗻𝗵𝗲́ ⚓", attachment: await this.subnautica()}, threadID, messageID);
        }
        var data = this.checkPath(4, senderID)
        if (data.item.length == 0) return api.sendMessage(`🏄: 𝐁𝐚̣𝐧 𝐜𝐡𝐮̛𝐚 𝐜𝐨́ 𝐜𝐚̂̀𝐧 𝐜𝐚̂𝐮, 𝐯𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐯𝐚̀𝐨 𝐬𝐡𝐨𝐩 𝐦𝐮𝐚 𝐯𝐚̀ 𝐪𝐮𝐚𝐲 𝐥𝐚̣𝐢 ️`, threadID, messageID);
        if (data.mainROD == null) return api.sendMessage('🏄: 𝐁𝐚̣𝐧 𝐜𝐡𝐮̛𝐚 𝐜𝐡𝐨̣𝐧 𝐜𝐚̂̀𝐧 𝐜𝐚̂𝐮 𝐜𝐚́\n𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐧𝐡𝐚̣̂𝐩 `-𝐜 𝐫𝐨𝐝` 𝐯𝐚̀ 𝐜𝐡𝐨̣𝐧 𝐜𝐚̂̀𝐧 𝐜𝐚̂𝐮', threadID, messageID);
        if (data.GPS.locate == null || data.GPS.area == null) return api.sendMessage('🏄: 𝐁𝐚̣𝐧 𝐜𝐡𝐮̛𝐚 𝐜𝐡𝐨̣𝐧 𝐤𝐡𝐮 𝐯𝐮̛̣𝐜 𝐜𝐚̂𝐮 𝐜𝐚́\n𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐧𝐡𝐚̣̂𝐩 `-𝐜 𝐥𝐨𝐜𝐚𝐭𝐞` 𝐯𝐚̀ 𝐜𝐡𝐨̣𝐧 𝐤𝐡𝐮 𝐯𝐮̛̣𝐜 𝐜𝐚̂𝐮 ', threadID, messageID);
        var rod = data.mainROD
        var location = data.GPS.locate
        var area = data.GPS.area
        var type = this.getFish()
        var findRod = data.item.find(i => i.name == rod)
        if (findRod.durability <= 0) return api.sendMessage('🏄: 𝐂𝐚̂̀𝐧 𝐜𝐚̂𝐮 𝐡𝐨̉𝐧𝐠 𝐦𝐚̂́𝐭 𝐫𝐨̂̀𝐢, 𝐛𝐚̣𝐧 𝐜𝐚̂̀𝐧 𝐬𝐮̛̉𝐚 𝐜𝐡𝐮̛̃𝐚 𝐡𝐨𝐚̣̆𝐜 𝐜𝐡𝐨̣𝐧 𝐜𝐚̂̀𝐧 𝐜𝐚̂𝐮 𝐦𝐨̛́𝐢 ', threadID, messageID);
        await checkTime(findRod.countdown * 1000, findRod.countdownData)
        findRod.countdownData = Date.now();
        findRod.durability = findRod.durability - 10;
        writeFileSync(this.checkPath(3, senderID), JSON.stringify(this.checkPath(4, senderID), null, 2));
        if (type == false) return api.sendMessage('𝐎̂𝐢 𝐤𝐡𝐨̂𝐧𝐠, 𝐛𝐚̣𝐧 𝐭𝐡𝐚̣̂𝐭 𝐱𝐮 𝐜𝐚̀ 𝐧𝐚 𝐜𝐡𝐚̆̉𝐧𝐠 𝐝𝐢́𝐧𝐡 𝐜𝐨𝐧 𝐜𝐚́ 𝐧𝐚̀𝐨 𝐜𝐚̉ 😿', threadID, messageID);
        var fil = (await this.dataFish(location, area)).filter(i => i.category == type)
        if (fil.length == 0) return api.sendMessage('𝐎̂𝐢 𝐤𝐡𝐨̂𝐧𝐠, 𝐛𝐚̣𝐧 𝐭𝐡𝐚̣̂𝐭 𝐱𝐮 𝐜𝐚̀ 𝐧𝐚 𝐜𝐡𝐚̆̉𝐧𝐠 𝐝𝐢́𝐧𝐡 𝐜𝐨𝐧 𝐜𝐚́ 𝐧𝐚̀𝐨 𝐜𝐚̉ 😿', threadID, messageID);
        var getData = fil[Math.floor(Math.random() * fil.length)];
        var IDF = ((this.checkPath(4, senderID)).fishBag)[parseInt(((this.checkPath(4, senderID)).fishBag).length - 1)].ID + 1;
        (this.checkPath(4, senderID)).fishBag.push({
            ID: IDF,
            name: getData.name,
            category: getData.category,
            size: getData.size,
            sell: getData.sell,
            image: getData.image
        });
        writeFileSync(this.checkPath(3, senderID), JSON.stringify(this.checkPath(4, senderID), null, 2));
        var msg = {body: `🦈== 𝐒𝐔𝐁𝐍𝐀𝐔𝐓𝐈𝐂𝐀 ==🦈\n\n𝗖𝗵𝘂́𝗰 𝗺𝘂̛̀𝗻𝗴 𝗯𝗮̣𝗻 𝘃𝘂̛̀𝗮 𝗰𝗮̂𝘂 𝗱𝗶́𝗻𝗵 𝗺𝗼̣̂𝘁 𝗰𝗼𝗻 𝗰𝗮́ 🐬\n𝐓𝐞̂𝐧: ${getData.name}\n𝗟𝗼𝗮̣𝗶: ${getData.category}\n𝗦𝗶𝘇𝗲: ${getData.size}𝗰𝗺\n𝗚𝗶𝗮́: (${getData.sell}$)`, attachment: await this.image(getData.image)}
        return api.sendMessage(msg, threadID, messageID);
    }
    }
}
module.exports.data = async function () {
    const data = require('./game/cauca/data.json')
    return data
}

module.exports.dataFish =async function (a, b) {
    const data = await this.data()
    console.log(data)
    var loc = data.find(i => i.location == a)
    var are = loc.area.find(i => i.name == b)
    
    return are.creature
}

module.exports.image = async function(link) {
    const fs = require("fs-extra");
    const axios = require("axios");
    var images = [];
    let download = (await axios.get(link, { responseType: "arraybuffer" } )).data; 
        fs.writeFileSync( __dirname + `/game/cauca/cache/subnautica.png`, Buffer.from(download, "utf-8"));
        images.push(fs.createReadStream(__dirname + `/game/cauca/cache/subnautica.png`));
    return images
}
module.exports.subnautica = async function() {
    const fs = require("fs-extra");
    const axios = require("axios");
    var images = [];
    let download = (await axios.get('https://i.imgur.com/pTrrcQB.png', { responseType: "arraybuffer" } )).data; 
        fs.writeFileSync( __dirname + `/game/cauca/cache/subnauticapage.png`, Buffer.from(download, "utf-8"));
        images.push(fs.createReadStream(__dirname + `/game/cauca/cache/subnauticapage.png`));
    return images
}

module.exports.getFish = function () {
    var rate = Math.floor(Math.random() * 100) + 1
    if (rate <= 4) return false
    if (rate > 4 && rate <= 34) return 'Common';
    if (rate > 34 && rate <= 59) return 'Uncommon';
    if (rate > 59 && rate <= 79) return 'Rare';
    if (rate > 79 && rate <= 94) return 'Epic';
    if (rate > 94 && rate <= 99) return 'Legendary';
    if (rate > 99 && rate <= 100) return 'Mythical';
}
module.exports.handleReply = async function ({
    event,
    api,
    Currencies,
    handleReply,
    Users
}) {

    const {
        body,
        threadID,
        messageID,
        senderID
    } = event;
    const axios = require("axios")
    const {
        readFileSync,
        writeFileSync,
        existsSync,
        createReadStream,
        unlinkSync,
        writeFile
    } = require("fs-extra")
    const pathItem = this.checkPath(2, senderID);
    async function checkDur(a, b, c) {
        var data = require("./game/cauca/item.json");
        var find = data.find(i => i.name == a)
        if (c == 'rate') return (b / find.durability) * 100
        if (c == 'reset') return find.durability
        return `${b}/${find.durability} (${((b/find.durability)*100).toFixed(0)}%)`
    }
    switch (handleReply.type) {
    case 'shop': {
        if (body == 1) {
            api.unsendMessage(handleReply.messageID)
            var listItem = '️️🎣=== 𝑭𝑰𝑺𝑯𝑰𝑵𝑮 𝑹𝑶𝑫 ===️🎣\n\n',
                number = 1;
            for (let i of pathItem) {
                listItem += `${number++}. ${i.name} (${i.price}$) - 𝗧𝗵𝗼̛̀𝗶 𝗴𝗶𝗮𝗻 𝗰𝗵𝗼̛̀ ${i.countdown} (𝗧𝗶̉ 𝗹𝗲̣̂ 𝗯𝗲̂̀𝗻: ${i.durability})\n\n`
            }
            return api.sendMessage(listItem + '👉 𝐑𝐞𝐩𝐥𝐲 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐯𝐚̀ 𝐜𝐡𝐨̣𝐧 𝐜𝐚̂̀𝐧 𝐜𝐚̂𝐮 𝐜𝐡𝐨 𝐛𝐚̣𝐧. 𝐌𝐨̂̃𝐢 𝐥𝐚̂̀𝐧 𝐜𝐚̂𝐮 𝐭𝐫𝐮̛̀ 𝟏𝟎 𝐬𝐮̛́𝐜 𝐛𝐞̂̀𝐧 !', threadID, (error, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    type: "buyfishingrod"
                })
            }, messageID);
        }
        if (body == 2) {
            api.unsendMessage(handleReply.messageID)
            var data = this.checkPath(4, senderID).fishBag;
            if (data.length == 0) return api.sendMessage('𝐓𝐮́𝐢 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐜𝐨́ 𝐠𝐢̀ 𝐜𝐚̉ !', threadID, messageID);
            var Common = data.filter(i => i.category == 'Common')
            var Uncommon = data.filter(i => i.category == 'Uncommon')
            var Rare = data.filter(i => i.category == 'Rare')
            var Epic = data.filter(i => i.category == 'Epic')
            var Legendary = data.filter(i => i.category == 'Legendary')
            var Mythical = data.filter(i => i.category == 'Mythical')
            var listCategory = [Common, Uncommon, Rare, Epic, Legendary, Mythical];
            return api.sendMessage(`𝐂𝐡𝐨̣𝐧 𝐥𝐨𝐚̣𝐢 𝐜𝐚́ 𝐦𝐮𝐨̂́𝐧 𝐛𝐚́𝐧:\n𝟭. 𝗖𝗼𝗺𝗺𝗼𝗻 🦀 - ${Common.length}\n𝟮. 𝗨𝗻𝗰𝗼𝗺𝗺𝗼𝗻 🐚 - ${Uncommon.length}\n𝟯. 𝗥𝗮𝗿𝗲 🦐 - ${Rare.length}\n𝟰. 𝗘𝗽𝗶𝗰 🐙 - ${Epic.length}\n𝟱. 𝗟𝗲𝗴𝗲𝗻𝗱𝗮𝗿𝘆 🦈 - ${Legendary.length}\n𝟲. 𝗠𝘆𝘁𝗵𝗶𝗰𝗮𝗹 🐊 - ${Mythical.length}`, threadID, (error, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    type: "chooseFish",
                    listCategory
                })
            }, messageID);
        }
        if (body == 3) {
            api.unsendMessage(handleReply.messageID)
            var data = this.checkPath(4, senderID).item;
            var msg = `===== 𝑭𝑰𝑿 𝑰𝑻𝑬𝑴𝑺 =====\n\n`,
                number = 1;
            for (let i of data) {
                msg += `${number++}. ${i.name} - 𝗧𝗶̉ 𝗹𝗲̣̂ 𝗯𝗲̂̀𝗻 𝗰𝘂̉𝗮 𝗰𝗮̂̀𝗻 𝗰𝗮̂𝘂: ${await checkDur(i.name, i.durability, 0)}\n\n`
            }
            return api.sendMessage(msg + '👉 𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐫𝐞𝐩𝐥𝐲 𝐯𝐚̣̂𝐭 𝐩𝐡𝐚̂̉𝐦 𝐦𝐮𝐨̂́𝐧 𝐬𝐮̛̉𝐚, 𝐠𝐢𝐚́ 𝐬𝐮̛̉𝐚 𝐛𝐚̆̀𝐧𝐠 𝟏/𝟑 𝐠𝐢𝐚́ 𝐯𝐚̣̂𝐭 𝐩𝐡𝐚̂̉𝐦', threadID, (error, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    type: "fixfishingrod",
                    list: data
                })
            }, messageID);
        } else return api.sendMessage('𝐋𝐮̛̣𝐚 𝐜𝐡𝐨̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐡𝐨̛̣𝐩 𝐥𝐞̣̂ 🚫', threadID, messageID);
    }
    case 'choosebag': {
        api.unsendMessage(handleReply.messageID)
        var data = this.checkPath(4, senderID)
        if (body == 1) {
            if (data.fishBag.length == 0) return api.sendMessage('𝐓𝐫𝐨𝐧𝐠 𝐭𝐮́𝐢 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐜𝐨́ 𝐜𝐨𝐧 𝐜𝐚́ 𝐧𝐚̀𝐨 ', threadID, messageID);
            var listFish = `🎒=== 𝑰𝑵𝑽𝑬𝑵𝑻𝑶𝑹𝒀 ===🎒\n\n`,
                number = 1;
            for (let i of data.fishBag) {
                listFish += `${number++}. ${i.name} (${i.size}cm) - ${i.category} (${i.sell}$)\n`
            }
            return api.sendMessage(listFish, threadID, messageID);
        }
        if (body == 2) {
            api.unsendMessage(handleReply.messageID)
            if (data.item.length == 0) return api.sendMessage('Trong túi của bạn không có vật phẩm nào!', threadID, messageID);
            var listItemm = `🎒=== 𝑰𝑵𝑽𝑬𝑵𝑻𝑶𝑹𝒀 ===🎒\n\n`,
                number = 1;
            for (let i of data.item) {
                listItemm += `${number++}. ${i.name} (${i.price}$) - Độ bền: ${i.durability} (${i.countdown}s)\n`
            }
            return api.sendMessage(listItemm, threadID, messageID);
        } else return api.sendMessage('𝐋𝐮̛̣𝐚 𝐜𝐡𝐨̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐡𝐨̛̣𝐩 𝐥𝐞̣̂ 🚫', threadID, messageID);
    }
    case 'rodMain': {
        var data = handleReply.data;
        var item = handleReply.item;
        if (parseInt(body) > item.length || parseInt(body) <= 0) return api.sendMessage('Lựa chọn không hợp lệ!', threadID, messageID);
        api.unsendMessage(handleReply.messageID)
        data.mainROD = item[parseInt(body) - 1].name
        writeFileSync(this.checkPath(3, senderID), JSON.stringify(data, null, 2));
        return api.sendMessage(`️🎣===== 𝐌𝐀𝐈𝐍 𝐑𝐎𝐃 =====️🎣\n\n- Đặt '${item[parseInt(body) - 1].name}' thành cần câu chính thành công!`, threadID, messageID);
    }
    case 'location': {
        const data = require("./game/cauca/data.json");
        if (body != 1 && body != 2) return api.sendMessage("Lựa chọn không hợp lệ!", threadID, messageID);
        api.unsendMessage(handleReply.messageID)
        var listLoca = '🦈== 𝐋𝐎𝐂𝐀𝐓𝐄 𝐅𝐈𝐒𝐇 ==🦈\n\n',
            number = 1;
        for (let i of data[parseInt(body) - 1].area) {
            listLoca += `${number++}. ${i.name}\n`
        };
        (this.checkPath(4, senderID)).GPS.locate = data[parseInt(body) - 1].location
        writeFileSync(this.checkPath(3, senderID), JSON.stringify(this.checkPath(4, senderID), null, 2));
        if(body == 1) var images = 'https://i.imgur.com/SJewp15.png'
        if(body == 2) var images = 'https://i.imgur.com/FtB2vWi.png'
        return api.sendMessage({body: listLoca + '𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐜𝐡𝐨̣𝐧 𝐯𝐮̀𝐧𝐠 𝐛𝐚̣𝐧 𝐦𝐮𝐨̂́𝐧 𝐜𝐚̂𝐮 🐬', attachment: await this.image(images)}, threadID, (error, info) => {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: event.senderID,
                type: "chooseArea",
                area: data[parseInt(body) - 1]
            })
        }, messageID);
    }
    case 'chooseArea': {
        var area = handleReply.area;
        var pathh = this.checkPath(4, senderID)
        var pathhh = this.checkPath(3, senderID)
        if (parseInt(body) > area.area.length || parseInt(body) <= 0) return api.sendMessage('𝐋𝐮̛̣𝐚 𝐜𝐡𝐨̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐡𝐨̛̣𝐩 𝐥𝐞̣̂ 🚫', threadID, messageID);
        api.unsendMessage(handleReply.messageID)
        pathh.GPS.area = area.area[parseInt(body) - 1].name
        writeFileSync(pathhh, JSON.stringify(pathh, null, 2));
        return api.sendMessage(`🦈== 𝐋𝐎𝐂𝐀𝐓𝐄 𝐅𝐈𝐒𝐇 ==🦈\n\nChuyển tới vùng '${area.location} - ${area.area[parseInt(body) - 1].name}' thành công`, threadID, messageID);
    }
    case 'fixfishingrod': {
        if (parseInt(body) > handleReply.list.length || parseInt(body) <= 0) return api.sendMessage('𝐋𝐮̛̣𝐚 𝐜𝐡𝐨̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐡𝐨̛̣𝐩 𝐥𝐞̣̂ 🚫', threadID, messageID);
        var rod = handleReply.list[parseInt(body) - 1]
        if (await checkDur(rod.name, rod.durability, 'rate') > 75) return api.sendMessage('𝐂𝐡𝐢̉ 𝐜𝐨́ 𝐭𝐡𝐞̂̉ 𝐬𝐮̛̉𝐚 𝐜𝐚̂̀𝐧 𝐜𝐚̂𝐮 𝐜𝐨́ 𝐭𝐢̉ 𝐥𝐞̣̂ 𝐛𝐞̂̀𝐧 𝐝𝐮̛𝐨̛́𝐢 𝟕𝟓%', threadID, messageID);
        api.unsendMessage(handleReply.messageID)
        await checkMoney(senderID, parseInt((rod.price * (1 / 3)).toFixed(0)))
        await Currencies.decreaseMoney(senderID, parseInt((rod.price * (1 / 3)).toFixed(0)));
        rod.durability = await checkDur(rod.name, rod.durability, 'reset')
        writeFileSync(this.checkPath(3, senderID), JSON.stringify(this.checkPath(4, senderID), null, 2));
        return api.sendMessage(`===== 𝑭𝑰𝑿 𝑰𝑻𝑬𝑴𝑺 =====\n- Sửa thành công ${rod.name} (${parseInt((rod.price*(1/3)).toFixed(0))}$)`, threadID, messageID);
    }
    case 'buyfishingrod': {
        if (parseInt(body) > pathItem.length || parseInt(body) <= 0) return api.sendMessage('𝐋𝐮̛̣𝐚 𝐜𝐡𝐨̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐡𝐨̛̣𝐩 𝐥𝐞̣̂ 🚫', threadID, messageID);
        var data = pathItem[parseInt(body) - 1]
        var checkM = await checkMoney(senderID, data.price);
        if ((this.checkPath(4, senderID)).item.some(i => i.name == data.name)) return api.sendMessage('𝐁𝐚̣𝐧 𝐡𝐢𝐞̣̂𝐧 𝐬𝐨̛̉ 𝐡𝐮̛̃𝐮 𝐯𝐚̣̂𝐭 𝐩𝐡𝐚̂̉𝐦 𝐧𝐚̀𝐲 𝐫𝐨̂̀𝐢', threadID, messageID);
        (this.checkPath(4, senderID)).item.push({
            name: data.name,
            price: data.price,
            durability: data.durability,
            countdown: data.countdown,
            countdownData: null,
            image: data.image
        })
        writeFileSync(this.checkPath(3, senderID), JSON.stringify(this.checkPath(4, senderID), null, 2));
        api.unsendMessage(handleReply.messageID)
        var msg = { body: `𝗠𝘂𝗮 𝘁𝗵𝗮̀𝗻𝗵 𝗰𝗼̂𝗻𝗴 ${data.name}\n𝗚𝗶𝗮́ 𝗺𝘂𝗮: ${data.price}$\n𝗧𝗶̉ 𝗹𝗲̣̂ 𝗯𝗲̂̀𝗻: ${data.durability}\n𝗧𝗵𝗼̛̀𝗶 𝗴𝗶𝗮𝗻 𝗰𝗵𝗼̛̀: ${data.countdown}`, attachment: await this.image(data.image)}
        return api.sendMessage(msg, threadID, messageID);
    }
    case 'chooseFish': {
        if (parseInt(body) > handleReply.listCategory.length || parseInt(body) <= 0) return api.sendMessage('𝐋𝐮̛̣𝐚 𝐜𝐡𝐨̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐡𝐨̛̣𝐩 𝐥𝐞̣̂ 🚫', threadID, messageID);
        api.unsendMessage(handleReply.messageID);
        if (handleReply.listCategory[parseInt(body) - 1].length == 0) return api.sendMessage('𝐊𝐡𝐨̂𝐧𝐠 𝐜𝐨́ 𝐜𝐨𝐧 𝐜𝐚́ 𝐧𝐚̀𝐨 𝐡𝐞̂́𝐭 𝐚́, 𝐡𝐦𝐦𝐦 !', threadID, messageID);
        var fish = "🐋===== 𝑭𝑰𝑺𝑯 =====🐋\n\n",
            number = 1;
        for (let i of handleReply.listCategory[parseInt(body) - 1]) {
            fish += `${number++}. ${i.name} (${i.size}cm) - Loại: ${i.category} - ${i.sell}$\n\n`
        }
        return api.sendMessage(fish + "👉 𝐑𝐞𝐩𝐥𝐲 𝐬𝐨̂́ 𝐭𝐡𝐮̛́ 𝐭𝐮̛̣ 𝐯𝐚̀ 𝐛𝐚́𝐧 (𝐜𝐨́ 𝐭𝐡𝐞̂̉ 𝐫𝐞𝐩 𝐧𝐡𝐢𝐞̂̀𝐮 𝐬𝐨̂́) 𝐡𝐨𝐚̣̆𝐜 𝐫𝐞𝐩𝐥𝐲 '𝐚𝐥𝐥' 𝐧𝐞̂́𝐮 𝐦𝐮𝐨̂́𝐧 𝐛𝐚́𝐧 𝐭𝐚̂́𝐭 𝐜𝐚̉ 𝐜𝐚́", threadID, (error, info) => {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: event.senderID,
                type: "sell",
                list: handleReply.listCategory[parseInt(body) - 1]
            })
        }, messageID);
    }
    case 'sell': {
        if ((parseInt(body) > handleReply.list.length || parseInt(body) <= 0) && body.toLowerCase() != 'all') return api.sendMessage('𝐋𝐮̛̣𝐚 𝐜𝐡𝐨̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐡𝐨̛̣𝐩 𝐥𝐞̣̂ 🚫', threadID, messageID);
        api.unsendMessage(handleReply.messageID)
        var bag = (this.checkPath(4, senderID)).fishBag
        var coins = 0;
        if (body.toLowerCase() == 'all') {
            for (let i of handleReply.list) {
                await Currencies.increaseMoney(senderID, parseInt(i.sell));
                coins += parseInt(i.sell)
                console.log(i.ID)
                var index = (this.checkPath(4, senderID)).fishBag.findIndex(item => item.ID == i.ID);
                bag.splice(index, 1);
                writeFileSync(this.checkPath(3, senderID), JSON.stringify((this.checkPath(4, senderID)), null, 2));
            }
            return api.sendMessage(`𝗕𝗮́𝗻 𝘁𝗵𝗮̀𝗻𝗵 𝗰𝗼̂𝗻𝗴 ${handleReply.list.length} 𝗰𝗼𝗻 𝗰𝗮́ 𝘃𝗮̀ 𝘁𝗵𝘂 𝘃𝗲̂̀ 𝘁𝗼̂̉𝗻𝗴 ${coins}$`, threadID, messageID);
        }
        else {
            var msg = 'Code_By_D-Jukie ' + body
            var chooses = msg.split(" ").map(n => parseInt(n));
            chooses.shift();
            var text = `===== 𝑺𝑬𝑳𝑳 =====\n\n`,
                number = 1;
            for (let i of chooses) {
                const index = (this.checkPath(4, senderID)).fishBag.findIndex(item => item.ID == handleReply.list[i - 1].ID);
                text += `${number++}. ${bag[index].name} +${bag[index].sell}$\n`
                coins += parseInt(bag[index].sell)
                await Currencies.increaseMoney(senderID, parseInt(bag[index].sell));
                bag.splice(index, 1);
                writeFileSync(this.checkPath(3, senderID), JSON.stringify((this.checkPath(4, senderID)), null, 2));
            }
            return api.sendMessage(text + `\n\n𝗧𝗵𝘂 𝘃𝗲̂̀ ${coins}$`, threadID, messageID);
        }
    }
    default: {
        api.unsendMessage(handleReply.messageID)
        return api.sendMessage('𝐋𝐮̛̣𝐚 𝐜𝐡𝐨̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐡𝐨̛̣𝐩 𝐥𝐞̣̂ 🚫', threadID, messageID);
    }
    }
    async function checkMoney(senderID, maxMoney) {
        var i, w;
        i = (await Currencies.getData(senderID)) || {};
        w = i.money || 0
        if (w < parseInt(maxMoney)) return api.sendMessage('Bạn không đủ tiền để thực hiện giao dịch này!', threadID, messageID);
    }
}