module.exports.config = { 	
    name: "outall", 	
    version: "1.1.0", 	
    hasPermssion: 3, 	
    credits: "dtb", 	
    description: "Bot rời tất cả các nhóm", 	
    commandCategory: "Hệ Thống", 	
    usages: "outall", 	
    cooldowns: 5 	
};

module.exports.run = async ({ api, event }) => { 	
    return api.getThreadList(100, null, ["INBOX"], (err, list) => {
        if (err) return api.sendMessage("➜ Không thể lấy danh sách nhóm!", event.threadID);
        let count = 0;
        list.forEach(item => {
            if (item.isGroup && String(item.threadID) !== String(event.threadID)) {
                api.removeUserFromGroup(api.getCurrentUserID(), item.threadID);
                count++;
            }
        });
        api.sendMessage(`➜ Đã nhận lệnh và tiến hành rời ${count} nhóm!`, event.threadID);
    }); 
};
