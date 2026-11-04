const axios = require("axios");
const fs = require("fs");
const path = require("path");

function isUrl(text) {
  return /(https?:\/\/[^\s]+)/.test(text);
}

async function streamFile(url, ext) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const filePath = path.join(__dirname, "cache", `${Date.now()}.${ext}`);
  fs.writeFileSync(filePath, res.data);
  setTimeout(() => fs.existsSync(filePath) && fs.unlinkSync(filePath), 60 * 1000);
  return fs.createReadStream(filePath);
}

exports.config = {
  name: "autodownload",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "dtb",
  description: "Tự động phát hiện link MXH và tải về",
  commandCategory: "Tiện ích",
  usages: "",
  cooldowns: 0,
};

exports.handleEvent = async function({ api, event }) {
  try {
    const text = event.body;
    if (!text || !isUrl(text)) return;

    const url = text.match(/https?:\/\/\S+/)[0];
    if (!url) return;

    api.sendMessage(`🔗 Đã phát hiện link\n⏳ Đợi xíu để Genfor tải xuống...`, event.threadID, event.messageID);

    const res = await axios.get("https://api.lunarkrystal.site/download", {
      params: { url }
    });

    if (!res.data || !res.data.url) {
      return api.sendMessage(`❌ Không hỗ trợ hoặc tải lỗi với link này!`, event.threadID);
    }

    const file = await streamFile(res.data.url, res.data.type || "mp4");
    api.sendMessage({
      body: `✅ Đã tải thành công!\n• Nền tảng: ${res.data.platform || "Không rõ"}\n• Tiêu đề: ${res.data.title || "Không có"}`,
      attachment: file,
    }, event.threadID, event.messageID);

  } catch (e) {
    console.error(e);
    api.sendMessage(`❌ Có lỗi khi tải link!`, event.threadID);
  }
};

exports.run = async function({ api, event }) {
  return api.sendMessage("Tính năng tự động tải link mạng xã hội khi phát hiện url trong nhóm.", event.threadID, event.messageID);
};
