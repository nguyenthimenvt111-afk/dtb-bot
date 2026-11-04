module.exports.config = {
	name: "duyettv",
	version: "1.0.0",
	hasPermssion: 1,
	credits: "dtb",
	description: "Duyệt Thành Viên Trong Danh Sách Phê Duyệt Box",
	commandCategory: "Quản Lí Box",
	usages: "",
	cooldowns: 0
}, module.exports.run = async function({
	args: e,
	event: a,
	api: s,
	Users: n,
	Threads: r
}) {
	var {
		userInfo: t,
		adminIDs: o
	} = await s.getThreadInfo(a.threadID);
	if (o = o.map((e => e.id)).some((e => e == s.getCurrentUserID()))) {
		const e = await s.getThreadInfo(a.threadID);
		let r = e.approvalQueue.length;
		var u = "";
		for (let a = 0; a < r; a++) {
			u += `[${a+1}].${await n.getNameUser(e.approvalQueue[a].requesterID)} - ${e.approvalQueue[a].requesterID}\n\n`
		}
		u += "[👉] 𝐑𝐞𝐩𝐥𝐲 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐭𝐡𝐞𝐨 𝐬𝐨̂́ 𝐭𝐡𝐚̀𝐧𝐡 𝐯𝐢𝐞̂𝐧 𝐭𝐮̛𝐨̛𝐧𝐠 𝐮̛́𝐧𝐠 𝐦𝐚̀ 𝐛𝐚̣𝐧 𝐦𝐮𝐨̂́𝐧 𝐝𝐮𝐲𝐞̣̂𝐭", s.sendMessage(`====『 𝐑𝐄𝐐𝐔𝐄𝐒𝐓 』 ====\n\n${u}`, a.threadID, ((e, s) => global.client.handleReply.push({
			name: this.config.name,
			author: a.senderID,
			messageID: s.messageID,
			type: "reply"
		})))
	} else s.sendMessage("𝐁𝐨𝐭 𝐜𝐚̂̀𝐧 𝐪𝐮𝐚̉𝐧 𝐭𝐫𝐢̣ 𝐯𝐢𝐞̂𝐧 𝐤𝐡𝐢 𝐩𝐡𝐞̂ 𝐝𝐮𝐲𝐞̣̂𝐭, 𝐯𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐜𝐚̂́𝐩 𝐪𝐮𝐲𝐞̂̀𝐧 𝐪𝐮𝐚̉𝐧 𝐭𝐫𝐢̣ 𝐯𝐢𝐞̂𝐧 𝐯𝐚̀ 𝐭𝐡𝐮̛̉ 𝐥𝐚̣𝐢 👾", a.threadID)
}, module.exports.handleReply = async function({
	api: e,
	args: a,
	Users: s,
	handleReply: n,
	event: r,
	Threads: t
}) {
	const {
		threadID: o,
		messageID: u
	} = r;
	if ("reply" === n.type) {
		let a = (await e.getThreadInfo(r.threadID)).approvalQueue[parseInt(r.body - 1)].requesterID;
		e.addUserToGroup(a, o), e.sendMessage(`𝐃𝐮𝐲𝐞̣̂𝐭 𝐯𝐚̀𝐨 𝐧𝐡𝐨́𝐦 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 ❤️`, o, (() => e.unsendMessage(n.messageID)))
	}
};