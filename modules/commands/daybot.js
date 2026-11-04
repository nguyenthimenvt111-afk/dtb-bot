
const { simi } = require('./../../lib/sim.js'); // Thay đường dẫn tới mã mới của bạn

module.exports.config = {
    name: "daybot",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Dạy bot ",
    commandCategory: "Nhóm",
    usages: "",
    cooldowns: 2,
    dependencies: {
        "axios": ""
    }
};

module.exports.run = ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    return api.sendMessage("[ BOT ] - Reply tin nhắn này nhập câu hỏi cho Bot", threadID, (err, info) => {
        global.client.handleReply.push({
            step: 1,
            name: this.config.name,
            messageID: info.messageID,
            content: {
                id: senderID,
                ask: "",
                ans: ""
            }
        })
    }, messageID);
}

module.exports.handleReply = async({ api, event, Users, handleReply }) => {
    const moment = require("moment-timezone");
    var timeZ = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss | DD/MM/YYYY");
    const { threadID, messageID, senderID, body } = event;
    let by_name = (await Users.getData(senderID)).name;
    if (handleReply.content.id != senderID) return;
    const input = body.trim();
    const sendC = (msg, step, content) => api.sendMessage(msg, threadID, (err, info) => {
        global.client.handleReply.splice(global.client.handleReply.indexOf(handleReply), 1);
        api.unsendMessage(handleReply.messageID);
        global.client.handleReply.push({
            step: step,
            name: this.config.name,
            messageID: info.messageID,
            content: content
        })
    }, messageID);
    const send = async(msg) => api.sendMessage(msg, threadID, messageID);

    let content = handleReply.content;
    switch (handleReply.step) {
        case 1:
            content.ask = input;
            sendC("[ BOT ] - Reply tin nhắn này trả lời câu hỏi vừa xong", 2, content);
            break;

        case 2:
            content.ans = input;
            global.client.handleReply.splice(global.client.handleReply.indexOf(handleReply), 1);
            api.unsendMessage(handleReply.messageID);
            let c = content;
            let response = simi('teach', { ask: c.ask, ans: c.ans }); // Sử dụng hàm simi từ mã mới
            if (response.error) return send(`${response.error}`);
            send(`[ BOT ] - Dạy Bot thành công, previews:\n\n🤤 Data:\n🧑‍🎓Khi bạn hỏi bot: " ${c.ask} " \n📌Bot sẽ trả lời: " ${c.ans} "\n\n⏱ Time: ${timeZ}`);
            break;
        default:
            break;
    }
}