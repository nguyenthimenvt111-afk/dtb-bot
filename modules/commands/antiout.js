module.exports.config = {
    name: "antiout",
    version: "1.0.0",
    credits: "dtb",
    hasPermssion: 1,
    description: "Bật tắt antiout",
    usages: "antiout on/off",
    commandCategory: "Nhóm",
    cooldowns: 0
};
module.exports.run = async({ api, event, Threads}) => {
    let data = (await Threads.getData(event.threadID)).data || {};
    if (typeof data["antiout"] == "undefined" || data["antiout"] == false) data["antiout"] = true;
    else data["antiout"] = false;

    await Threads.setData(event.threadID, { data });
    global.data.threadData.set(parseInt(event.threadID), data);

    return api.sendMessage(`𝐃𝐚̃ ${(data["antiout"] == true) ? "𝐛𝐚̣̂𝐭" : "𝐭𝐚̆́𝐭"} 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 𝐚𝐧𝐭𝐢𝐨𝐮𝐭!`, event.threadID);

}