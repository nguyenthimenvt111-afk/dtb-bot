const axios = require("axios");

const ADMIN_ID = "61577714247816"; // ID admin

module.exports.config = {
  name: "addatb",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "dtb",
  description: "Thêm key thuê auto bank",
  commandCategory: "Hệ thống",
  usages: "/addatb <số ngày> <link>",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // CHỈ ADMIN ĐƯỢC DÙNG
  if (String(senderID) !== String(ADMIN_ID))
    return api.sendMessage("⚠️ Chỉ admin mới được phép sử dụng lệnh này.", threadID, messageID);

  // KIỂM TRA THAM SỐ
  if (args.length < 2)
    return api.sendMessage("⚙️ Dùng: /addatb <số ngày> <link>", threadID, messageID);

  const days = parseInt(args[0]);
  const link = args[1];

  try {
    const res = await axios.get(`https://sieuthiweb.site/checkapi.php?add=${days}&link=${encodeURIComponent(link)}`);
    const d = res.data;
    if (d.status === "success") {
      return api.sendMessage(`✅ Tạo Thành Công\nKEY: ${d.key}\nHSD: ${d.hsd}\nLINK: ${link}`, threadID, messageID);
    } else {
      return api.sendMessage(`❌ API báo lỗi: ${d.message || "Không rõ"}`, threadID, messageID);
    }
  } catch (err) {
    return api.sendMessage("❌ Lỗi khi gọi API tạo key.", threadID, messageID);
  }
};
