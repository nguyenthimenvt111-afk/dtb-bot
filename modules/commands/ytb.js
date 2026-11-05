const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const dns = require("dns");
const moment = require("moment-timezone");

try {
  dns.setDefaultResultOrder("ipv4first");
} catch (_) {}

let scdl;
try {
  scdl = require("soundcloud-downloader").default;
} catch (_) {}

module.exports.config = {
  name: "ytb",
  version: "1.1.0",
  hasPermission: 0,
  credits: "dtb",
  description: "Phát nhạc hoặc video thông qua link YouTube hoặc từ khoá tìm kiếm",
  commandCategory: "Nhạc",
  usages: "ytb <từ khoá hoặc link YouTube>",
  cooldowns: 5,
};

module.exports.onLoad = () => {
  const dirMaterial = path.join(__dirname, "noprefix");
  fs.ensureDirSync(dirMaterial);
};

const mediaSavePath = path.join(__dirname, "cache", "Youtube");
const key = "AIzaSyDjmV7xLLXZZvEA6GCwuggVUaIVcPK-SDE";

const prettyTime = (time) => {
  if (!time) return "00:00";
  let newTimeArray = [];
  time = time.slice(2);

  if (time.includes("H")) {
    newTimeArray.push(time.split("H")[0]);
    time = time.split("H")[1];
  } else newTimeArray.push(0);
  if (time.includes("M")) {
    newTimeArray.push(time.split("M")[0]);
    time = time.split("M")[1];
  } else newTimeArray.push(0);
  if (time.includes("S")) {
    newTimeArray.push(time.split("S")[0]);
  } else newTimeArray.push(0);

  newTimeArray = newTimeArray.map((item) => {
    return parseInt(item) < 10 ? "0" + parseInt(item) : String(item);
  });

  return newTimeArray.join(":");
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, body, senderID } = event;
  const { author, videoID, IDs, type: reply_type } = handleReply;
  if (senderID != author) return;

  fs.ensureDirSync(mediaSavePath);

  switch (reply_type) {
    case "download": {
      const isVideo = body == "1";
      const ext = isVideo ? "mp4" : "mp3";
      const filePath = path.join(mediaSavePath, `${Date.now()}_${senderID}.${ext}`);

      try {
        let mediaTitle = "YouTube Media";
        let mediaDuration = "N/A";

        try {
          const detailRes = await axios.get(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoID}&key=${key}`
          );
          if (detailRes.data?.items?.length) {
            mediaTitle = detailRes.data.items[0].snippet.title;
            mediaDuration = prettyTime(detailRes.data.items[0].contentDetails.duration);
          }
        } catch (_) {}

        api.sendMessage(`⏳ Đang xử lý tải ${isVideo ? "video" : "âm thanh"} "${mediaTitle}"...`, threadID, messageID);

        let downloaded = false;

        if (!isVideo && scdl) {
          try {
            const clean = mediaTitle.replace(/\[.*?\]|\(.*?\)|official|audio|mv|video|lyrics/gi, "").trim();
            const scRes = await scdl.search({ query: clean || mediaTitle, limit: 1, resourceType: "tracks" });
            if (scRes?.collection?.length > 0) {
              const stream = await scdl.download(scRes.collection[0].permalink_url);
              await new Promise((resolve, reject) => {
                const w = fs.createWriteStream(filePath);
                stream.pipe(w);
                w.on("finish", () => { downloaded = true; resolve(); });
                w.on("error", reject);
                stream.on("error", reject);
              });
            }
          } catch (_) {}
        }

        if (!downloaded) {
          try {
            let ytdl;
            try { ytdl = require("@distube/ytdl-core"); } catch { ytdl = require("ytdl-core"); }
            const ytdlOptions = isVideo ? { quality: "18" } : { filter: "audioonly", quality: "highestaudio" };
            const stream = ytdl(`https://www.youtube.com/watch?v=${videoID}`, ytdlOptions);
            await new Promise((resolve, reject) => {
              const w = fs.createWriteStream(filePath);
              stream.pipe(w);
              w.on("finish", () => { downloaded = true; resolve(); });
              w.on("error", reject);
              stream.on("error", reject);
            });
          } catch (e) {
            console.error("Ytdl error:", e.message);
          }
        }

        if (!downloaded || !fs.existsSync(filePath)) {
          return api.sendMessage("❌ Không thể tải được nội dung này từ YouTube.", threadID, messageID);
        }

        const stats = fs.statSync(filePath);
        if (stats.size > 26214400) {
          try { fs.unlinkSync(filePath); } catch {}
          return api.sendMessage("⚠️ Tệp tin vượt quá dung lượng cho phép của Facebook (25MB).", threadID, messageID);
        }

        api.unsendMessage(handleReply.messageID);
        api.sendMessage(
          {
            body: `=====『 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 』=====\n➜ 𝗧𝗶𝗲̂𝘂 đ𝗲̂̀: ${mediaTitle}\n➜ 𝗧𝗵𝗼̛̀𝗶 𝗴𝗶𝗮𝗻: ${mediaDuration}\n✨ Phát bởi dtb Bot System`,
            attachment: fs.createReadStream(filePath),
          },
          threadID,
          () => {
            try { fs.unlinkSync(filePath); } catch {}
          },
          messageID
        );

      } catch (err) {
        console.error(err);
        try { fs.unlinkSync(filePath); } catch {}
        api.sendMessage("❌ Đã có lỗi xảy ra khi xử lý tệp.", threadID, messageID);
      }
      break;
    }

    case "list": {
      if (isNaN(body) || body < 1 || body > IDs.length) {
        return api.sendMessage(`➜ Vui lòng chọn số từ 1 đến ${IDs.length}`, threadID, messageID);
      }
      api.unsendMessage(handleReply.messageID);
      const chosenIndex = parseInt(body) - 1;
      const chosenID = IDs[chosenIndex];

      api.sendMessage(
        "====『 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 𝗟𝗨̛̣𝗔 𝗖𝗛𝗢̣𝗡 』====\n➜ Phản hồi tin nhắn này với lựa chọn:\n\n1. Tải video\n2. Tải âm thanh (MP3)",
        threadID,
        (error, info) => {
          if (!error) {
            global.client.handleReply.push({
              type: "download",
              name: module.exports.config.name,
              messageID: info.messageID,
              author: senderID,
              videoID: chosenID,
            });
          }
        },
        messageID
      );
      break;
    }
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (args.length === 0) return api.sendMessage("➜ Vui lòng nhập từ khóa hoặc link YouTube.", threadID, messageID);
  const input = args.join(" ").trim();
  const urlPattern = /^(http(s)?:\/\/)?((w){3}\.)?youtu(be|\.be)?(\.com)?\/.+/i;
  const isValidUrl = urlPattern.test(input);

  try {
    if (isValidUrl) {
      let videoID = input.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
      videoID = videoID[2] !== undefined ? videoID[2].split(/[^0-9a-z_\-]/i)[0] : videoID[0];

      api.sendMessage(
        "====『 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 𝗟𝗨̛̣𝗔 𝗖𝗛𝗢̣𝗡 』====\n➜ Phản hồi tin nhắn này với lựa chọn:\n\n1. Tải video\n2. Tải âm thanh (MP3)",
        threadID,
        (error, info) => {
          if (!error) {
            global.client.handleReply.push({
              type: "download",
              name: module.exports.config.name,
              messageID: info.messageID,
              author: senderID,
              videoID,
            });
          }
        },
        messageID
      );
    } else {
      let IDs = [];
      let msg = "";
      const searchRes = await axios.get(
        encodeURI(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${input}&type=video&key=${key}`)
      );
      const result = searchRes.data.items || [];

      if (result.length === 0) {
        return api.sendMessage("❌ Không tìm thấy kết quả phù hợp trên YouTube.", threadID, messageID);
      }

      for (let i = 0; i < result.length; i++) {
        const id = result[i].id?.videoId;
        if (id) {
          IDs.push(id);
          msg += `\n━━━━━━━━━━━━━━━━━━\n${IDs.length}. ${result[i].snippet.title}\n👤 Kênh: ${result[i].snippet.channelTitle}`;
        }
      }

      msg = `➜ 𝗖𝗼́ ${IDs.length} 𝗸𝗲̂́𝘁 𝗾𝘂𝗮̉ 𝘁𝗿𝘂̀𝗻𝗴 𝘃𝗼̛́𝗶 𝘁𝘂̛̀ 𝗸𝗵𝗼́𝗮 𝘁𝗶̀𝗺 𝗸𝗶𝗲̂́𝗺:${msg}\n━━━━━━━━━━━━━━━━━━\n➜ Hãy phản hồi tin nhắn này với số (1-${IDs.length}) để chọn`;

      api.sendMessage(
        msg,
        threadID,
        (error, info) => {
          if (!error) {
            global.client.handleReply.push({
              type: "list",
              name: module.exports.config.name,
              messageID: info.messageID,
              author: senderID,
              IDs,
            });
          }
        },
        messageID
      );
    }
  } catch (e) {
    console.error(e);
    api.sendMessage("➜ Đã xảy ra lỗi khi tìm kiếm YouTube: " + e.message, threadID, messageID);
  }
};
