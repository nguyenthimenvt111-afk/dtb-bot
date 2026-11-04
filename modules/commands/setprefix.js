module.exports.config = {
	name: "setprefix",
	version: "2.0.0",
	hasPermssion: 1,
	credits: "dtb",
	description: "Đặt lại prefix của nhóm",
	commandCategory: "Quản Lí Box",
	usages: "[prefix/reset]",
	cooldowns: 5
};

module.exports.handleReaction = async function({ api, event, Threads, handleReaction, getText }) {
	try {
		if (event.userID != handleReaction.author) return;
		const { threadID, messageID } = event;
		var data = (await Threads.getData(String(threadID))).data || {};
		data["PREFIX"] = handleReaction.PREFIX;
		await Threads.setData(threadID, { data });
		await global.data.threadData.set(String(threadID), data);
		api.unsendMessage(handleReaction.messageID);

    api.changeNickname(`『 ${handleReaction.PREFIX} 』 ⪼ ${global.config.BOTNAME}`, event.threadID, event.senderID);
    
		return api.sendMessage({body:`𝚄𝚙𝚍𝚊𝚝𝚎 𝚙𝚛𝚎𝚏𝚒𝚡 𝚝𝚘:  ${handleReaction.PREFIX}`}, event.threadID, event.messageID);
    
	} catch (e) { return console.log(e) }
}

module.exports.run = async ({ api, event, args, Threads }) => {
	if (typeof args[0] == "undefined") return api.sendMessage({body:"𝙱𝚊̣𝚗 𝚌𝚊̂̀𝚗 𝚗𝚑𝚊̣̂𝚙 𝚍𝚊̂́𝚞 𝚕𝚎̣̂𝚗𝚑 𝚖𝚞𝚘̂́𝚗 đ𝚘̂̉𝚒!"}, event.threadID, event.messageID);
  
	let prefix = args[0].trim();
	if (!prefix) return api.sendMessage({body:"𝙱𝚊̣𝚗 𝚌𝚊̂̀𝚗 𝚗𝚑𝚊̣̂𝚙 𝚍𝚊̂́𝚞 𝚕𝚎̣̂𝚗𝚑 𝚖𝚞𝚘̂́𝚗 đ𝚘̂̉𝚒!"}, event.threadID, event.messageID);
  
	if (prefix == "reset") {
		var data = (await Threads.getData(event.threadID)).data || {};
		data["PREFIX"] = global.config.PREFIX;
		await Threads.setData(event.threadID, { data });
		await global.data.threadData.set(String(event.threadID), data);
		return api.sendMessage({body:`𝚄𝚙𝚍𝚊𝚝𝚎 𝚙𝚛𝚎𝚏𝚒𝚡 𝚝𝚘: ${global.config.PREFIX}`}, event.threadID, event.messageID);
    api.changeNickname(`『 ${handleReaction.PREFIX} 』 ⪼ ${global.config.BOTNAME}`, event.threadID, event.senderID);
    
	} else return api.sendMessage({body:`𝚃𝚑𝚊̉ 𝚌𝚊̉𝚖 𝚡𝚞́𝚌 𝚋𝚊̂́𝚝 𝚔𝚒̀ 𝚟𝚊̀𝚘 𝚝𝚒𝚗 𝚗𝚑𝚊̆́𝚗 𝚗𝚊̀𝚢 𝚗𝚎̂́𝚞 𝚋𝚊̣𝚗 𝚌𝚑𝚊̆́𝚌 𝚌𝚑𝚊̆́𝚗 𝚖𝚞𝚘̂́𝚗 đ𝚘̂̉𝚒 𝚙𝚛𝚎𝚏𝚒𝚡 𝚝𝚑𝚊̀𝚗𝚑 : ${prefix}`},event.threadID, (error, info) => {
		global.client.handleReaction.push({
			name: this.config.name,
			messageID: info.messageID,
			author: event.senderID,
			PREFIX: prefix
		})
	})
                          }
 
                    
                          