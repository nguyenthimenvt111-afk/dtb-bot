const fs = require("fs");
const axios = require("axios");
const path = require("path");
const { createCanvas } = require("canvas");

const USERS_FILE = path.join(__dirname, "../cache/gtf-users.json");
const CHECK_INTERVAL = 60 * 1000;

if (!fs.existsSync(path.dirname(USERS_FILE))) fs.mkdirSync(path.dirname(USERS_FILE));
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({}));

let userDB = JSON.parse(fs.readFileSync(USERS_FILE));

// Save DB
function saveDB() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(userDB, null, 2));
}

// Tạo ảnh neon có viền sáng
async function makeNeon(text, options = {}) {
  const {
    bgColor = "#000",
    glowColor = "#00ffff",
    width = 600,
    height = 150,
    border = true,
  } = options;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Nền
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Viền
  if (border) {
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, width, height);
  }

  // Chữ
  const bright = (hex) => {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 186;
  };
  const textColor = bright(bgColor) ? "#000" : "#fff";

  ctx.font = "bold 36px Sans";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 30;
  ctx.fillStyle = textColor;
  ctx.fillText(text, width / 2, height / 2);

  return canvas.toBuffer();
}

// Lấy danh sách giao dịch từ cookie
async function getTransactions(cookie) {
  try {
    const res = await axios.get("https://gachthefast.com/wallet/transfer", {
      headers: {
        cookie,
        "user-agent": "Mozilla/5.0",
        referer: "https://gachthefast.com/"
      }
    });

    const html = res.data;
    if (html.includes("Đăng nhập") || html.includes("Login")) {
      return { status: "die" };
    }

    const regex = /<tr>(.*?)<\/tr>/g;
    const matches = html.match(regex)?.slice(1, 6) || []; // lấy 5 dòng gần nhất

    const transactions = matches.map(tr => {
      const td = [...tr.matchAll(/<td[^>]*>(.*?)<\/td>/g)].map(m => m[1]);
      const amountRaw = td[1].match(/[\+\-]?[0-9,.]+/g)?.[0] || "0";
      const amount = parseInt(amountRaw.replace(/[^\d]/g, ""));
      const type = amountRaw.includes("+") ? "IN" : "OUT";
      const username = td[2].match(/<p[^>]*>(.*?)<\/p>/g)?.[1]?.replace(/<[^>]+>/g, "") || "Ẩn danh";
      return {
        transId: td[0],
        amount,
        type,
        username,
        time: td[3],
        description: td[5]?.replace(/<[^>]+>/g, "").trim()
      };
    });

    return { status: "success", data: transactions };
  } catch (e) {
    return { status: "error", message: e.message };
  }
}

module.exports = {
  config: {
    name: "gtf",
    version: "2.0",
    credits: "dtb",
    description: "Giao dịch GachTheFast",
    commandCategory: "Tiện ích",
    usages: "/gtf login <tên> <cookie>\n/gtf check",
    cooldowns: 5,
    cooldown: 5
  },

  run: async function ({ api, event, args }) {
    const { threadID, senderID } = event;
    const sub = args[0];

    if (sub === "login") {
      const name = args[1];
      const cookie = args[2];
      if (!name || !cookie)
        return api.sendMessage("⚠️ Dùng: /gtf login <tên> <cookie>", threadID);

      userDB[senderID] = {
        username: name,
        cookie,
        lastNotified: [],
        threadID
      };
      saveDB();
      return api.sendMessage(`✅ Đăng nhập thành công cho ${name}`, threadID);
    }

    if (sub === "check") {
      const user = userDB[senderID];
      if (!user) return api.sendMessage("⚠️ Bạn chưa login!", threadID);

      const res = await getTransactions(user.cookie);
      if (res.status === "die") {
        const img = await makeNeon("Cookie của bạn đã die rồi", { bgColor: "#fff" });
        const file = path.join(__dirname, "../cache/cookie_die.png");
        fs.writeFileSync(file, img);
        return api.sendMessage({ attachment: fs.createReadStream(file) }, threadID);
      }

      const msg = res.data.map((t, i) => 
        `${i + 1}. ${t.type === "IN" ? "➕" : "➖"} ${t.amount}đ từ ${t.username}\n⏰ ${t.time}\n📝 ${t.description}`
      ).join("\n\n");

      const img = await makeNeon("Lịch sử giao dịch gần đây", { glowColor: "#0ff" });
      const file = path.join(__dirname, "../cache/gtf_5gd.png");
      fs.writeFileSync(file, img);

      return api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(file)
      }, threadID);
    }

    return api.sendMessage("⚠️ Sai cú pháp. Dùng: /gtf login <tên> <cookie> hoặc /gtf check", threadID);
  },

    onLoad: function () {
    setInterval(async () => {
      try {
        for (const [uid, info] of Object.entries(userDB)) {
          const res = await getTransactions(info.cookie);
          if (!res || res.status !== "success" || !Array.isArray(res.data)) continue;

          for (const t of res.data) {
            if (t.type !== "IN") continue;
          }
        }
      } catch (e) {
        // ignore background poll error
      }
    }, CHECK_INTERVAL);
  }
};
