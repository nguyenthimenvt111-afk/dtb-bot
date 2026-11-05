module.exports.config = {
    name: "randomname",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Random biệt danh tiếng Nhật hoặc ngẫu nhiên",
    commandCategory: "Nhóm",
    cooldowns: 5
};

const defaultNames = [
    "Sakura Haruno", "Hinata Hyuga", "Sasuke Uchiha", "Naruto Uzumaki", "Kakashi Hatake",
    "Itachi Uchiha", "Mikasa Ackerman", "Levi Ackerman", "Tanjiro Kamado", "Nezuko Kamado",
    "Zenitsu Agatsuma", "Inosuke Hashibira", "Giyu Tomioka", "Kanao Tsuyuri", "Shinobu Kocho",
    "Satoru Gojo", "Yuji Itadori", "Megumi Fushiguro", "Nobara Kugisaki", "Kento Nanami"
];

module.exports.run = async ({ api, event }) => {
    const axios = require("axios");
    try {
        let chosenName = defaultNames[Math.floor(Math.random() * defaultNames.length)];
        try {
            const res = await axios.get("https://www.behindthename.com/api/random.json?usage=jap&gender=f&key=mi451266190", { timeout: 3000 });
            if (res.data && Array.isArray(res.data.names) && res.data.names.length >= 2) {
                chosenName = `${res.data.names[0]} ${res.data.names[1]}`;
            }
        } catch (_) {}

        api.changeNickname(chosenName, event.threadID, event.senderID, (err) => {
            if (err) return api.sendMessage("➜ Không thể đổi biệt danh!", event.threadID, event.messageID);
            api.sendMessage(`➜ Đã đổi biệt danh của bạn thành: ${chosenName}`, event.threadID, event.messageID);
        });
    } catch (e) {
        return api.sendMessage("➜ Lỗi khi đổi biệt danh ngẫu nhiên!", event.threadID, event.messageID);
    }
};
