module.exports.config = {
  name: "adc",
  version: "3.0.1",
  hasPermssion: 3,
  credits: "dtb",
  description: "Áp dụng code từ link/raw hoặc upload code local lên Gist",
  commandCategory: "Khác",
  usages: "adc <tên-file> (reply link/raw hoặc không để up code local lên Gist)",
  cooldowns: 0,
};

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const request = require("request");
const cheerio = require("cheerio");

// ⚠️ Token GitHub mới (chỉ cần quyền gist)
const GITHUB_TOKEN = "";
const GIST_API = "https://api.github.com/gists";

async function createGist(fileName, content) {
  const body = {
    description: `Upload ${fileName}.js`,
    public: false,
    files: { [`${fileName}.js`]: { content } }
  };
  const res = await axios.post(GIST_API, body, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`, // ✅ Fix 404
      "User-Agent": "Mozilla/5.0"
    }
  });
  return res.data.files[`${fileName}.js`].raw_url;
}

async function downloadFile(url, dest) {
  const writer = fs.createWriteStream(dest);
  const res = await axios.get(url, { responseType: "stream" });
  await new Promise((resolve, reject) => {
    res.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, messageReply, type } = event;
  const fileName = args[0];
  let text;
  if (type === "message_reply") text = messageReply.body;

  if (!text && !fileName)
    return api.sendMessage(
      "⚠️ Vui lòng reply link raw hoặc ghi tên file để up code local lên Gist!",
      threadID,
      messageID
    );

  // CASE 1: UP CODE LOCAL LÊN GIST
  if (!text && fileName) {
    return fs.readFile(
      `${__dirname}/${fileName}.js`,
      "utf-8",
      async (err, data) => {
        if (err)
          return api.sendMessage(
            `❎ Không tìm thấy file ${fileName}.js!`,
            threadID,
            messageID
          );

        try {
          const rawLink = await createGist(fileName, data);
          return api.sendMessage(
            `✅ Upload thành công!\n📄 Raw: ${rawLink}`,
            threadID,
            messageID
          );
        } catch (e) {
          return api.sendMessage(
            `❎ Lỗi khi upload lên Gist: ${e.response?.status || ""} ${
              e.response?.data?.message || e.message
            }`,
            threadID,
            messageID
          );
        }
      }
    );
  }

  // CASE 2: REPLY LINK RAW ĐỂ ÁP DỤNG
  const urlR =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const urls = text ? text.match(urlR) : null;
  if (!urls || !urls[0])
    return api.sendMessage("❎ Không tìm thấy link hợp lệ!", threadID, messageID);

  const url = urls[0];
  const filePath = path.join(__dirname, `${fileName}.js`);

  try {
    // buildtool / tinyurl
    if (url.includes("buildtool") || url.includes("tinyurl")) {
      request(url, (err, response, body) => {
        if (err) return api.sendMessage("❎ Lỗi tải link!", threadID, messageID);
        const $ = cheerio.load(body);
        const code = $(".language-js").first().text() || $("pre").first().text();
        fs.writeFileSync(filePath, code, "utf8");
        reloadModule(api, threadID, messageID, fileName);
      });
      return;
    }

    // Google Drive
    if (url.includes("drive.google")) {
      const id = url.match(/[-\w]{25,}/);
      await downloadFile(
        `https://drive.google.com/u/0/uc?id=${id}&export=download`,
        filePath
      );
      return reloadModule(api, threadID, messageID, fileName);
    }

    // Note API
    if (url.includes("/note")) {
      const raw = url.includes("raw=true") ? url : url + "?raw=true";
      const res = await axios.get(raw);
      fs.writeFileSync(filePath, res.data, "utf8");
      return reloadModule(api, threadID, messageID, fileName);
    }

    // Gist / Github / Pastebin / Dpaste (link raw)
    const res = await axios.get(url);
    fs.writeFileSync(filePath, res.data, "utf8");
    return reloadModule(api, threadID, messageID, fileName);
  } catch (e) {
    return api.sendMessage(
      `❎ Lỗi khi áp dụng code: ${e.message}`,
      threadID,
      messageID
    );
  }
};

function reloadModule(api, threadID, messageID, fileName) {
  try {
    const dir = path.join(__dirname, `${fileName}.js`);
    delete require.cache[require.resolve(dir)];
    global.client.commands.delete(fileName);
    const newCommand = require(dir);
    global.client.commands.set(newCommand.config.name, newCommand);

    api.sendMessage(
      `☑️ Đã áp dụng & load lại module "${fileName}.js" thành công!`,
      threadID,
      messageID
    );
  } catch (e) {
    api.sendMessage(
      `⚠️ Code đã ghi nhưng lỗi khi load lại module: ${e.message}`,
      threadID,
      messageID
    );
  }
}