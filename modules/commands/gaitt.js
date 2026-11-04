const axios = require("axios");
const fs = require("fs-extra");
const request = require("request");

module.exports.config = {
  name: "gaitt",
  version: "1.0.0",
  hasPermission: 2,
  credits: "dtb", 
  description: "random gái tiktok",
  commandCategory: "Video",
  usages: "gaitt",
  cooldowns: 5,
};

module.exports.run = async function({ api, event, args }) {
  try {
    const res = await axios.get("https://gaitiktok.onrender.com/random?apikey=randomtnt");
    const { play, author, digg_count, comment_count, play_count, share_count, download_count, title, duration, region } = res.data.data;

    const callback = () => {
      api.sendMessage({
        body: `┏━━━━━━━━━━━━━━━━━━━━┓\n┣➤📺 Random gái tiktok\n┣➤🌐 Quốc gia: ${region}\n┣➤📝 Tiêu đề: ${title}\n┣➤🔍 Tên kênh: ${author.nickname}\n┣➤😽 ID người dùng: ${author.unique_id}\n┣➤❤ Lượt tim: ${digg_count}\n┣➤💬 Lượt bình luận: ${comment_count}\n┣➤👁‍🗨 Lượt xem: ${play_count}\n┣➤📎 Lượt share: ${share_count}\n┣➤👉 Lượt tải: ${download_count}\n┣➤⏰ Thời gian: ${duration} s\n┗━━━━━━━━━━━━━━━━━━━━┛\n`,
        attachment: fs.createReadStream(__dirname + "/cache/tkvd.mp4")
      }, event.threadID, () => fs.unlinkSync(__dirname + "/cache/tkvd.mp4"));
    };

    request(encodeURI(play)).pipe(fs.createWriteStream(__dirname + "/cache/tkvd.mp4")).on("close", callback);
  } catch (err) {
    console.log(err);
    api.sendMessage("Đã xảy ra lỗi...", event.threadID);
  }
};