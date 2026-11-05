module.exports.config = {
    name: "newbox",
    version: "1.1.0", 
    hasPermssion: 0,
    credits: "dtb",
    description: "Tạo nhóm chat mới với những người được tag", 
    commandCategory: "Nhóm",
    usages: "[tag] | [tên nhóm mới]",
    cooldowns: 5
};

module.exports.run = async function({ api, args, event }) {
    let id = [event.senderID];
    let main = event.body;
    let groupTitle = main.includes("|") ? main.slice(main.indexOf("|") + 1).trim() : "Nhóm mới";
    let mentions = event.mentions || {};

    for (let uid of Object.keys(mentions)) {
        if (!id.includes(uid)) id.push(uid);
    }

    if (id.length < 2) {
        return api.sendMessage("➜ Cần ít nhất 2 người tham gia để tạo nhóm mới! Cú pháp: newbox @tag1 @tag2 | Tên nhóm", event.threadID, event.messageID);
    }

    api.createNewGroup(id, groupTitle, (err) => {
        if (err) return api.sendMessage("➜ Không thể tạo nhóm mới!", event.threadID, event.messageID);
        api.sendMessage(`➜ Đã tạo nhóm "${groupTitle}" thành công!`, event.threadID);
    });
};
