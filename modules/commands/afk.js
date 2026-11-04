module.exports.config = {
	name: "afk",
	version: "1.0.0",
	permissions: 1,
	credits: "dtb",
	description: "Bật hoặc tắt chế độ afk",
  usages: "[lí do]",
  commandCategory: "Nhóm",
  cooldowns: 5
};

const busyPath = __dirname + '/cache/data/busy.json';
const fs = require('fs');

module.exports.onLoad = () => {
  if (!fs.existsSync(busyPath)) fs.writeFileSync(busyPath, JSON.stringify({}));
}

module.exports.handleEvent = async function({ api, event, Users }) {
    let busyData = JSON.parse(fs.readFileSync(busyPath));
    var { senderID, threadID, messageID, mentions } = event;
    if (senderID in busyData) {
        var info = busyData[senderID];
        delete busyData[senderID];
        fs.writeFileSync(busyPath, JSON.stringify(busyData, null, 4));
        return api.sendMessage(`Chào mừng bạn đã quay trở lại! 🥰`, threadID, () => {
            if (info.tag.length == 0) api.sendMessage("Trong lúc bạn đi vắng, không có ai nhắc đến bạn cả", threadID);
            else {
                var msg = "";
                for (var i of info.tag) {
                    msg += `${i}\n`
                }
                api.sendMessage("Đây là danh sách những tin nhắn bạn được tag trong khi bạn đi vắng:\n\n" + msg, threadID)
            }
        }, messageID);
    }

    if (!mentions || Object.keys(mentions).length == 0) return;
    
    for (const [ID, name] of Object.entries(mentions)) {
        if (ID in busyData) {
            var infoBusy = busyData[ID], mentioner = await Users.getNameUser(senderID), replaceName = event.body.replace(`${name}`, "");
            infoBusy.tag.push(`${mentioner}: ${replaceName == "" ? "Đã tag bạn" : replaceName}`)
            busyData[ID] = infoBusy;
            fs.writeFileSync(busyPath, JSON.stringify(busyData, null, 4));
            return api.sendMessage(`${name.replace("@", "")} hiện đang bận${infoBusy.lido ? ` với lý do: ${infoBusy.lido}.` : "."}`, threadID, messageID);
        }
    }
}

module.exports.run = async function({ api, event, args, Users }) {
	await new Promise(resolve => setTimeout(resolve, 1000));
    let busyData = JSON.parse(fs.readFileSync(busyPath));
    const { threadID, senderID, messageID, body } = event;
    var content = args.join(" ") || "";
    if (!(senderID in busyData)) {
        busyData[senderID] = {
            lido: content,
            tag: []
        }
        fs.writeFileSync(busyPath, JSON.stringify(busyData, null, 4));
        var msg = (content.length == 0) ? 'Bạn đã bật chế độ afk mà không có lí do' : `Bạn đã bật chế độ afk với lí do: ${content}`;
        return api.sendMessage(msg, threadID, messageID);
    }
}