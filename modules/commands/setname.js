module.exports.config = {
    name: "setname",
    version: "3.1.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Đổi biệt danh trong nhóm cho bạn hoặc người được tag/reply",
    commandCategory: "Quản Lí Box",
    usages: "[trống/reply/tag] + [tên mới]",
    cooldowns: 3
};

module.exports.run = async ({ api, event, args }) => {
    let { threadID, messageReply, senderID, mentions, type, messageID } = event;

    let targetID = senderID;
    let name = "";

    if (type === "message_reply") {
        targetID = messageReply.senderID;
        name = args.join(" ");
    } else if (mentions && Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
        name = args.join(" ").replace(mentions[targetID], "").trim();
    } else {
        name = args.join(" ");
    }

    api.changeNickname(name, threadID, targetID, (err) => {
        if (err) return api.sendMessage("➜ Không thể thay đổi biệt danh! Vui lòng kiểm tra quyền hạn của Bot.", threadID, messageID);
        return api.sendMessage(`➜ Đã ${name ? "thay đổi" : "gỡ"} biệt danh thành công!`, threadID, messageID);
    });
};
