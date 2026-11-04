module.exports.config = {
	name: "autosetname",
	eventType: ["log:subscribe"],
	version: "1.0.3",
	credits: "dtb",
	description: "Tự động set biệt danh thành viên mới"
};

module.exports.run = async function({ Threads, api, event, Users }) {
  const { createReadStream, existsSync, mkdirSync, readdirSync } = global.nodemodule["fs-extra"];
  const { join } =  global.nodemodule["path"];
const { threadID } = event;

  const moment = require("moment-timezone");
    var gio = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || D/MM/YYYY");
    var thu = moment.tz('Asia/Ho_Chi_Minh').format('dddd');
    if (thu == 'Sunday') thu = 'Chủ Nhật'
    if (thu == 'Monday') thu = 'Thứ Hai'
    if (thu == 'Tuesday') thu = 'Thứ Ba'
    if (thu == 'Wednesday') thu = 'Thứ Tư'
    if (thu == "Thursday") thu = 'Thứ Năm'
    if (thu == 'Friday') thu = 'Thứ Sáu'
    if (thu == 'Saturday') thu = 'Thứ Bảy'
var memJoin = event.logMessageData.addedParticipants.map(info => info.userFbId)
	for (let idUser of memJoin) {
		const { readFileSync, writeFileSync } = global.nodemodule["fs-extra"];
		const { join } = global.nodemodule["path"]
		const pathData = join("./modules/commands","cache","data", "autosetname.json");
		var dataJson = JSON.parse(readFileSync(pathData, "utf-8"));
		var thisThread = dataJson.find(item => item.threadID == threadID) || { threadID, nameUser: [] };
		if (thisThread.nameUser.length == 0) return 
		if (thisThread.nameUser.length != 0) {  
		var setName = thisThread.nameUser[0] 
		await new Promise(resolve => setTimeout(resolve, 1000));
		var namee1 = await api.getUserInfo(idUser)
        var namee = namee1[idUser].name
		api.changeNickname(`${setName} ${namee}`, threadID, idUser);
		} 
	}
  const path = join(__dirname, "cache", "autosetname","randomgif");
	const gifPath = join(path, `autosetname.mp3`);
	const randomPath = readdirSync(join(__dirname, "cache", "autosetname", "randomgif"));
	 if (randomPath.lenth != 0) {
		const pathRandom = join(__dirname, "cache", "autosetname", "randomgif",`${randomPath[Math.floor(Math.random() * randomPath.length)]}`);
}
	return api.sendMessage({body:
    `=== 『 𝐒𝐮𝐜𝐜𝐞𝐬𝐬 』 ===\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n→ Bot vừa set biệt danh tạm thời cho thành viên mới\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n=== 「${thu} || ${gio}」 ===`,attachment: createReadStream(gifPath) }, threadID, event.messageID)
}