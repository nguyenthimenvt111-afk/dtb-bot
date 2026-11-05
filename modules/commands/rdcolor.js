module.exports.config = {
    name: "rdcolor",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Đổi màu chủ đề đoạn chat ngẫu nhiên",
    commandCategory: "Nhóm",
    usages: "",
    cooldowns: 3
};

module.exports.run = async({ api, event }) => {
    const color = [
        '196241301102133', '169463077092846', '2442142322678320', '234137870477637',
        '980963458735625', '175615189761153', '2136751179887052', '2058653964378557',
        '2129984390566328', '174636906462322', '1928399724138152', '417639218648241',
        '930060997172551', '164535220883264', '370940413392601', '205488546921017', '809305022860427'
    ];
    let picked = color[Math.floor(Math.random() * color.length)];
    api.changeThreadColor(picked, event.threadID, (err) => {
        if (err) return api.sendMessage("➜ Không thể thay đổi màu chủ đề!", event.threadID, event.messageID);
        api.sendMessage("➜ Đã thay đổi màu chủ đề nhóm ngẫu nhiên!", event.threadID, event.messageID);
    });
};
