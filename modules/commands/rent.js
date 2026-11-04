const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");
const crypto = require("crypto");

module.exports.config = {
  name: "rent",
  version: "3.0.0",
  hasPermission: 0,
  credits: "dtb",
  description: "Hệ thống thuê bot bằng key, dùng được trên Mirai",
  commandCategory: "Hệ thống",
  usages: "[subcommand]",
  cooldowns: 3
};

const dataDir = path.join(__dirname, "cache", "rentbot");
fs.ensureDirSync(dataDir);
const dataPath = path.join(dataDir, "rents.json");
const keyPath = path.join(dataDir, "keys.json");

let rents = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath)) : [];
let keys = fs.existsSync(keyPath) ? JSON.parse(fs.readFileSync(keyPath)) : [];

const save = () => {
  fs.writeFileSync(dataPath, JSON.stringify(rents, null, 2));
  fs.writeFileSync(keyPath, JSON.stringify(keys, null, 2));
};

// ========== LỆNH CHÍNH ==========
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const send = msg => api.sendMessage(msg, threadID, messageID);
  const prefix = (global.data.threadData.get(threadID) || {}).PREFIX || global.config.PREFIX;

  if (!args[0]) {
    return send(
`📜 Lệnh thuê bot:
────────────────────
${prefix}rent key [ngày] [số lượng] → Tạo key
${prefix}rent info → Xem thông tin nhóm
${prefix}rent check → Xem danh sách key
${prefix}rent update → Cập nhật tên nhóm
────────────────────
Nhập key thuê bot trực tiếp để kích hoạt.`
    );
  }

  const sub = args[0].toLowerCase();
  if (sub === "key") {
    if (senderID != global.config.ADMINBOT[0])
      return send("⚠️ Chỉ admin mới được tạo key.");

    const days = parseInt(args[1]);
    const count = parseInt(args[2]);
    if (isNaN(days) || isNaN(count))
      return send("❎ Sai cú pháp. Dùng: rent key [ngày] [số lượng]");

    const created = [];
    for (let i = 0; i < count; i++) {
      const key = crypto.randomBytes(8).toString("hex");
      const exp = moment().tz("Asia/Ho_Chi_Minh").add(days, "days").format("DD/MM/YYYY");
      keys.push({
        key,
        exp,
        used: false,
        group: null,
        user: null
      });
      created.push(key);
    }
    save();
    return send(`✅ Đã tạo ${count} key (hết hạn sau ${days} ngày):\n${created.join("\n")}`);
  }

  if (sub === "info") {
    const rent = rents.find(r => r.tid === threadID);
    if (!rent) return send("❎ Nhóm này chưa kích hoạt thuê bot.");

    const now = moment().tz("Asia/Ho_Chi_Minh");
    const exp = moment(rent.exp, "DD/MM/YYYY");
    const diff = exp.diff(now, "days");
    return send(
`📘 Thông tin thuê bot
─────────────────
🔑 Key: ${rent.key}
📆 Bắt đầu: ${rent.start}
⏳ Hết hạn: ${rent.exp}
⌚ Còn lại: ${diff} ngày`
    );
  }

  if (sub === "check") {
    if (senderID != global.config.ADMINBOT[0])
      return send("⚠️ Chỉ admin mới được dùng lệnh này.");

    const page = parseInt(args[1]) || 1;
    const limit = 10;
    const total = Math.ceil(keys.length / limit);
    const slice = keys.slice((page - 1) * limit, page * limit);
    const list = slice.map((k, i) => 
      `${(page - 1) * limit + i + 1}. ${k.key} | ${k.used ? "Đã dùng" : "Chưa"} | Hết hạn: ${k.exp}\n🏠 ${k.group || "?"} | 👤 ${k.user || "?"}`
    ).join("\n\n");

    return api.sendMessage(
      `📋 Danh sách key (${page}/${total}):\n\n${list}\n\nReply "del số" để xóa hoặc "gia số ngày" để gia hạn.`,
      threadID,
      (err, info) => {
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID,
          page,
          list: slice
        });
      },
      messageID
    );
  }

  if (sub === "update") {
    if (senderID != global.config.ADMINBOT[0])
      return send("⚠️ Chỉ admin mới được dùng lệnh này.");

    const all = await Promise.all(keys.map(async k => {
      if (!k.group) return;
      try {
        const info = await api.getThreadInfo(k.group);
        k.groupName = info.threadName;
      } catch {}
    }));
    save();
    return send("🔄 Đã cập nhật tên nhóm cho các key!");
  }
};

// ========== XỬ LÝ TRẢ LỜI ==========
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { author, list } = handleReply;
  if (event.senderID != author) return;

  const [action, num, day] = event.body.split(" ");
  const index = parseInt(num) - 1;
  const key = list[index];
  if (!key) return api.sendMessage("❎ Số thứ tự không hợp lệ.", event.threadID);

  if (action === "del") {
    keys = keys.filter(k => k.key !== key.key);
    rents = rents.filter(r => r.key !== key.key);
    save();
    return api.sendMessage(`🗑 Đã xóa key ${key.key}`, event.threadID);
  }

  if (action === "gia") {
    const add = parseInt(day);
    if (isNaN(add)) return api.sendMessage("❎ Nhập sai số ngày.", event.threadID);

    const exp = moment(key.exp, "DD/MM/YYYY").add(add, "days").format("DD/MM/YYYY");
    key.exp = exp;
    const rent = rents.find(r => r.key === key.key);
    if (rent) rent.exp = exp;
    save();

    api.sendMessage(`✅ Gia hạn thêm ${add} ngày cho key ${key.key}`, event.threadID);
    if (key.group)
      api.sendMessage(`🔔 Nhóm của bạn được gia hạn thêm ${add} ngày.`, key.group);
  }
};

// ========== NHẬN SỰ KIỆN: NHẬP KEY ==========
module.exports.handleEvent = async function({ api, event }) {
  if (!event.body) return;
  const msg = event.body.trim();
  const key = keys.find(k => k.key === msg);
  if (!key) return;

  if (key.used) return api.sendMessage("❎ Key này đã được dùng.", event.threadID);
  const now = moment().tz("Asia/Ho_Chi_Minh");
  const exp = moment(key.exp, "DD/MM/YYYY");
  if (exp.isBefore(now)) return api.sendMessage("❎ Key đã hết hạn.", event.threadID);

  const info = await api.getThreadInfo(event.threadID);
  key.used = true;
  key.group = event.threadID;
  key.user = event.senderID;
  key.groupName = info.threadName;

  rents.push({
    tid: event.threadID,
    key: key.key,
    start: now.format("DD/MM/YYYY"),
    exp: key.exp
  });
  save();

  api.sendMessage(
`✅ Kích hoạt thành công!
🏘 Nhóm: ${info.threadName}
🔑 Key: ${key.key}
📅 Hết hạn: ${key.exp}`,
    event.threadID
  );

  const admin = global.config.ADMINBOT[0];
  api.sendMessage(
`🔔 Key mới kích hoạt:
👤 ${event.senderID}
🏘 ${info.threadName}
🔑 ${key.key}
⏳ ${key.exp}`,
    admin
  );
};
