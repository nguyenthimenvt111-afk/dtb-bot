const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");
const crypto = require("crypto");

module.exports.config = {
  name: "rent",
  version: "4.0.0",
  hasPermssion: 0,
  hasPermission: 0,
  credits: "dtb",
  description: "Hệ thống quản lý thuê bot thông minh và kích hoạt bằng key",
  commandCategory: "Hệ Thống",
  usages: "[key / info / nhap / check / all / add / set / del / delrent]",
  cooldowns: 2
};

const dataDir = path.join(__dirname, "cache", "rentbot");
fs.ensureDirSync(dataDir);
const dataPath = path.join(dataDir, "rents.json");
const keyPath = path.join(dataDir, "keys.json");

function getRents() {
  try {
    return fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, "utf8")) : [];
  } catch (_) {
    return [];
  }
}

function getKeys() {
  try {
    return fs.existsSync(keyPath) ? JSON.parse(fs.readFileSync(keyPath, "utf8")) : [];
  } catch (_) {
    return [];
  }
}

function saveData(rents, keys) {
  try {
    if (rents) fs.writeFileSync(dataPath, JSON.stringify(rents, null, 2), "utf8");
    if (keys) fs.writeFileSync(keyPath, JSON.stringify(keys, null, 2), "utf8");
  } catch (e) {
    console.error("Lỗi lưu dữ liệu rent:", e);
  }
}

function generateKeyString() {
  const p1 = crypto.randomBytes(3).toString("hex").toUpperCase();
  const p2 = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `DTB-${p1}-${p2}`;
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const send = (msg, cb) => api.sendMessage(msg, threadID, cb, messageID);
  const prefix = (global.data.threadData.get(String(threadID)) || {}).PREFIX || global.config.PREFIX || "/";
  const isBotAdmin = (global.config.ADMINBOT || []).includes(String(senderID));

  let rents = getRents();
  let keys = getKeys();

  if (!args[0]) {
    return send(
`╔═════════════════════════╗
   🔑 HỆ THỐNG THUÊ BOT DTB 🔑
╚═════════════════════════╝
👉 DÀNH CHO THÀNH VIÊN & NHÓM:
  • ${prefix}rent <mã_key>        : Nhập key kích hoạt / gia hạn nhóm
  • ${prefix}rent info           : Xem thời hạn thuê của nhóm hiện tại
  • ${prefix}rent update         : Cập nhật tên nhóm vào hệ thống

👑 DÀNH CHO ADMIN BOT:
  • ${prefix}rent key <ngày> [số lượng] : Tạo mã key thuê bot mới
  • ${prefix}rent check [trang]         : Xem danh sách key đã tạo
  • ${prefix}rent all [trang]           : Xem tất cả các nhóm đang thuê
  • ${prefix}rent add <TID> <số ngày>   : Cộng ngày trực tiếp cho nhóm
  • ${prefix}rent set <TID> <ngày hết>  : Đặt ngày hết hạn (DD/MM/YYYY)
  • ${prefix}rent del <mã_key>          : Xóa key chưa kích hoạt
  • ${prefix}rent delrent <TID>         : Hủy hạn thuê của nhóm
─────────────────────────
💡 Ví dụ: Nhập key "${prefix}rent DTB-A1B2C3-D4E5F6"`
    );
  }

  const sub = args[0].toLowerCase();

  // 1. TẠO KEY (ADMIN)
  if (sub === "key" || sub === "create" || sub === "gen") {
    if (!isBotAdmin) {
      return send("⚠️ Quyền hạn không đủ! Chỉ Admin Bot mới có quyền tạo key thuê bot.");
    }

    const days = parseInt(args[1]);
    const count = parseInt(args[2]) || 1;

    if (isNaN(days) || days <= 0 || isNaN(count) || count <= 0) {
      return send(`❌ Cú pháp không hợp lệ!\n💡 Ví dụ: ${prefix}rent key 30 5 (Tạo 5 key, mỗi key 30 ngày)`);
    }

    const created = [];
    const nowStr = moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

    for (let i = 0; i < count; i++) {
      const newKey = generateKeyString();
      keys.push({
        key: newKey,
        days: days,
        used: false,
        group: null,
        user: null,
        createdAt: nowStr
      });
      created.push(newKey);
    }

    saveData(rents, keys);
    return send(
`✅ TẠO KEY THÀNH CÔNG!
✨ Số lượng: ${count} key
⏱️ Thời hạn: ${days} ngày / key
─────────────────────────
${created.map((k, i) => `${i + 1}. ${k}`).join("\n")}
─────────────────────────
👉 Gửi key cho khách hàng dùng cú pháp: ${prefix}rent <mã_key>`
    );
  }

  // 2. XEM THÔNG TIN THUÊ CỦA NHÓM (RENT INFO)
  if (sub === "info") {
    const targetTID = args[1] && isBotAdmin ? String(args[1]) : String(threadID);
    const rent = rents.find(r => String(r.tid) === targetTID);

    if (!rent) {
      return send(
`╔═════════════════════════╗
   📋 THÔNG TIN THUÊ BOT 📋
╚═════════════════════════╝
❌ Nhóm này hiện CHƯA KÍCH HOẠT thuê bot hoặc đã hết hạn!
🆔 ID Nhóm: ${targetTID}
─────────────────────────
💡 Nhập key thuê bot: ${prefix}rent <mã_key>
📞 Liên hệ Admin để nhận key kích hoạt: fb.com/dtb`
      );
    }

    const now = moment().tz("Asia/Ho_Chi_Minh");
    const exp = moment.tz(rent.exp, "DD/MM/YYYY", "Asia/Ho_Chi_Minh");
    const diffDays = exp.clone().startOf("day").diff(now.clone().startOf("day"), "days");

    let statusText = "";
    if (diffDays > 5) {
      statusText = `🟢 Đang hoạt động (Còn ${diffDays} ngày)`;
    } else if (diffDays >= 0) {
      statusText = `🟡 Sắp hết hạn (Còn ${diffDays} ngày - Hãy gia hạn!)`;
    } else {
      statusText = `🔴 Đã hết hạn (${Math.abs(diffDays)} ngày trước)`;
    }

    return send(
`╔═════════════════════════╗
   📋 THÔNG TIN THUÊ BOT 📋
╚═════════════════════════╝
🏠 Tên nhóm : ${rent.name || "Nhóm chat"}
🆔 ID Nhóm  : ${rent.tid}
📊 Trạng thái: ${statusText}
📅 Ngày kích hoạt: ${rent.start || "N/A"}
⏳ Hạn kết thúc : ${rent.exp}
🔑 Key gần nhất : ${rent.key || "N/A"}
─────────────────────────
💡 Dùng "${prefix}rent <mã_key>" để gia hạn thêm ngày sử dụng!`
    );
  }

  // 3. KIỂM TRA DANH SÁCH KEY (ADMIN)
  if (sub === "check" || sub === "keys") {
    if (!isBotAdmin) {
      return send("⚠️ Quyền hạn không đủ! Chỉ Admin Bot mới được kiểm tra danh sách key.");
    }

    const filterUnused = args[1] === "unused";
    const displayList = filterUnused ? keys.filter(k => !k.used) : keys;

    if (displayList.length === 0) {
      return send("⚠️ Hiện tại không có key nào trong hệ thống.");
    }

    const page = parseInt(filterUnused ? args[2] : args[1]) || 1;
    const limit = 10;
    const totalPages = Math.ceil(displayList.length / limit) || 1;
    const p = Math.max(1, Math.min(page, totalPages));
    const slice = displayList.slice((p - 1) * limit, p * limit);

    let msg =
`╔═════════════════════════╗
   🔑 DANH SÁCH KEY (${p}/${totalPages})
╚═════════════════════════╝\n`;

    slice.forEach((k, idx) => {
      const num = (p - 1) * limit + idx + 1;
      const status = k.used ? `🔴 Đã dùng (Nhóm: ${k.group || "N/A"})` : "🟢 Chưa dùng";
      msg += ` ${String(num).padStart(2, "0")}. [${k.key}]\n     Thời hạn: ${k.days || 30} ngày | ${status}\n`;
    });

    msg += `─────────────────────────\n👉 Trang ${p}/${totalPages}. Gõ "${prefix}rent check ${p + 1}" để xem tiếp.`;
    return send(msg);
  }

  // 4. DANH SÁCH TẤT CẢ CÁC NHÓM THUÊ BOT (ADMIN)
  if (sub === "all" || sub === "list") {
    if (!isBotAdmin) {
      return send("⚠️ Quyền hạn không đủ! Chỉ Admin Bot mới được xem danh sách nhóm thuê.");
    }

    if (rents.length === 0) {
      return send("⚠️ Hiện tại chưa có nhóm nào kích hoạt thuê bot.");
    }

    const page = parseInt(args[1]) || 1;
    const limit = 8;
    const totalPages = Math.ceil(rents.length / limit) || 1;
    const p = Math.max(1, Math.min(page, totalPages));
    const slice = rents.slice((p - 1) * limit, p * limit);

    const now = moment().tz("Asia/Ho_Chi_Minh");
    let msg =
`╔═════════════════════════╗
   👥 NHÓM THUÊ BOT (${p}/${totalPages})
╚═════════════════════════╝\n`;

    slice.forEach((r, idx) => {
      const num = (p - 1) * limit + idx + 1;
      const exp = moment.tz(r.exp, "DD/MM/YYYY", "Asia/Ho_Chi_Minh");
      const diff = exp.clone().startOf("day").diff(now.clone().startOf("day"), "days");
      const status = diff > 0 ? `còn ${diff} ngày` : `HẾT HẠN`;
      msg += ` ${String(num).padStart(2, "0")}. ${r.name || "Nhóm chat"}\n     ID: ${r.tid}\n     Hạn: ${r.exp} (${status})\n`;
    });

    msg += `─────────────────────────\n✨ Tổng cộng: ${rents.length} nhóm. Gõ "${prefix}rent all ${p + 1}" để xem tiếp.`;
    return send(msg);
  }

  // 5. CỘNG NGÀY TRỰC TIẾP CHO NHÓM (ADMIN)
  if (sub === "add") {
    if (!isBotAdmin) return send("⚠️ Chỉ Admin Bot mới có thể cộng ngày thuê trực tiếp.");

    const targetTID = String(args[1] || threadID);
    const addDays = parseInt(args[2]);

    if (isNaN(addDays) || addDays <= 0) {
      return send(`❌ Cú pháp: ${prefix}rent add <ID nhóm> <số ngày> (Ví dụ: ${prefix}rent add ${threadID} 30)`);
    }

    let threadName = "Nhóm chat";
    try {
      const info = await api.getThreadInfo(targetTID);
      threadName = info.threadName || threadName;
    } catch (_) {}

    const now = moment().tz("Asia/Ho_Chi_Minh");
    const existingIdx = rents.findIndex(r => String(r.tid) === targetTID);
    let newExpDate = "";

    if (existingIdx !== -1) {
      const currentExp = moment.tz(rents[existingIdx].exp, "DD/MM/YYYY", "Asia/Ho_Chi_Minh").endOf("day");
      const baseMoment = currentExp.isAfter(now) ? currentExp : now;
      newExpDate = baseMoment.clone().add(addDays, "days").format("DD/MM/YYYY");
      rents[existingIdx].name = threadName;
      rents[existingIdx].exp = newExpDate;
    } else {
      newExpDate = now.clone().add(addDays, "days").format("DD/MM/YYYY");
      rents.push({
        tid: targetTID,
        name: threadName,
        key: "ADMIN-GIFT",
        start: now.format("DD/MM/YYYY"),
        exp: newExpDate
      });
    }

    saveData(rents, keys);
    api.sendMessage(
      `🎉 NHÓM BẠN ĐÃ ĐƯỢC ADMIN CỘNG HẠN SỬ DỤNG!\n` +
      `⏱️ Cộng thêm: +${addDays} ngày\n` +
      `📅 Hạn dùng mới: ${newExpDate}\n` +
      `Chúc các bạn có những trải nghiệm tuyệt vời cùng DTB Bot!`,
      targetTID
    );
    return send(`✅ Đã cộng thành công ${addDays} ngày cho nhóm [${threadName}] (ID: ${targetTID})!\n📅 Hạn mới: ${newExpDate}`);
  }

  // 6. ĐẶT HẠN DÙNG CỤ THỂ CHO NHÓM (ADMIN)
  if (sub === "set") {
    if (!isBotAdmin) return send("⚠️ Chỉ Admin Bot mới có quyền đặt ngày hết hạn.");

    const targetTID = String(args[1] || threadID);
    const targetDateStr = args[2];

    if (!targetDateStr || !moment(targetDateStr, "DD/MM/YYYY", true).isValid()) {
      return send(`❌ Vui lòng nhập ngày hợp lệ định dạng DD/MM/YYYY!\nVí dụ: ${prefix}rent set ${threadID} 31/12/2026`);
    }

    let threadName = "Nhóm chat";
    try {
      const info = await api.getThreadInfo(targetTID);
      threadName = info.threadName || threadName;
    } catch (_) {}

    const now = moment().tz("Asia/Ho_Chi_Minh");
    const existingIdx = rents.findIndex(r => String(r.tid) === targetTID);

    if (existingIdx !== -1) {
      rents[existingIdx].name = threadName;
      rents[existingIdx].exp = targetDateStr;
    } else {
      rents.push({
        tid: targetTID,
        name: threadName,
        key: "ADMIN-SET",
        start: now.format("DD/MM/YYYY"),
        exp: targetDateStr
      });
    }

    saveData(rents, keys);
    return send(`✅ Đã đặt hạn dùng cho nhóm [${threadName}] (ID: ${targetTID}) đến ngày: ${targetDateStr}!`);
  }

  // 7. XÓA KEY (ADMIN)
  if (sub === "del" || sub === "delete") {
    if (!isBotAdmin) return send("⚠️ Chỉ Admin Bot mới có quyền xóa key.");
    const keyToDel = (args[1] || "").trim().toUpperCase();
    if (!keyToDel) return send(`❌ Cú pháp: ${prefix}rent del <mã_key>`);

    const idx = keys.findIndex(k => k.key.toUpperCase() === keyToDel);
    if (idx === -1) return send(`❌ Không tìm thấy key [${keyToDel}] trong hệ thống!`);

    keys.splice(idx, 1);
    saveData(rents, keys);
    return send(`✅ Đã xóa thành công key [${keyToDel}] khỏi hệ thống!`);
  }

  // 8. HỦY THUÊ CỦA NHÓM (ADMIN)
  if (sub === "delrent" || sub === "cancelrent") {
    if (!isBotAdmin) return send("⚠️ Chỉ Admin Bot mới có quyền hủy trạng thái thuê bot.");
    const targetTID = String(args[1] || threadID);

    const idx = rents.findIndex(r => String(r.tid) === targetTID);
    if (idx === -1) return send(`❌ Nhóm có ID [${targetTID}] không nằm trong danh sách thuê.`);

    const removed = rents.splice(idx, 1)[0];
    saveData(rents, keys);
    return send(`✅ Đã hủy trạng thái thuê bot của nhóm: ${removed.name || targetTID}!`);
  }

  // 9. CẬP NHẬT TÊN NHÓM VÀO DATABASE
  if (sub === "update") {
    const rent = rents.find(r => String(r.tid) === String(threadID));
    if (!rent) return send("⚠️ Nhóm này chưa kích hoạt thuê bot.");
    try {
      const info = await api.getThreadInfo(threadID);
      rent.name = info.threadName || "Nhóm chat";
      saveData(rents, keys);
      return send(`✅ Đã cập nhật tên nhóm trong hệ thống thuê bot: "${rent.name}"`);
    } catch (_) {
      return send("❌ Không thể lấy tên nhóm từ Facebook API.");
    }
  }

  // 10. NHẬP KEY KÍCH HOẠT THUÊ BOT (HOẶC GIA HẠN)
  // Cú pháp: /rent <mã_key> hoặc /rent nhap <mã_key> hoặc /rent use <mã_key>
  let inputKey = sub === "nhap" || sub === "use" || sub === "active" ? (args[1] || "") : args[0];
  inputKey = inputKey.trim().toUpperCase();

  const foundKey = keys.find(k => k.key.toUpperCase() === inputKey);

  if (foundKey) {
    if (foundKey.used) {
      return send(`❌ Mã key [${inputKey}] đã được kích hoạt trước đó vào ngày ${foundKey.usedAt || "N/A"}!`);
    }

    let threadName = "Nhóm chat";
    try {
      const info = await api.getThreadInfo(threadID);
      threadName = info.threadName || threadName;
    } catch (_) {}

    const now = moment().tz("Asia/Ho_Chi_Minh");
    let daysToAdd = 30;

    if (foundKey.days && Number(foundKey.days) > 0) {
      daysToAdd = Number(foundKey.days);
    } else if (foundKey.exp && moment(foundKey.exp, "DD/MM/YYYY", true).isValid()) {
      const keyExp = moment.tz(foundKey.exp, "DD/MM/YYYY", "Asia/Ho_Chi_Minh").endOf("day");
      daysToAdd = Math.max(1, Math.ceil(keyExp.diff(now, "days", true)));
    }

    const existingIdx = rents.findIndex(r => String(r.tid) === String(threadID));
    let newExpDate = "";

    if (existingIdx !== -1) {
      // Nhóm đã từng thuê: cộng dồn nếu còn hạn, hoặc tính từ hôm nay nếu đã hết hạn
      const currentExp = moment.tz(rents[existingIdx].exp, "DD/MM/YYYY", "Asia/Ho_Chi_Minh").endOf("day");
      const baseMoment = currentExp.isAfter(now) ? currentExp : now;
      newExpDate = baseMoment.clone().add(daysToAdd, "days").format("DD/MM/YYYY");

      rents[existingIdx].name = threadName;
      rents[existingIdx].key = inputKey;
      rents[existingIdx].exp = newExpDate;
    } else {
      // Nhóm mới kích hoạt lần đầu
      newExpDate = now.clone().add(daysToAdd, "days").format("DD/MM/YYYY");
      rents.push({
        tid: String(threadID),
        name: threadName,
        key: inputKey,
        start: now.format("DD/MM/YYYY"),
        exp: newExpDate
      });
    }

    foundKey.used = true;
    foundKey.group = String(threadID);
    foundKey.user = String(senderID);
    foundKey.usedAt = now.format("HH:mm:ss DD/MM/YYYY");

    saveData(rents, keys);

    return send(
`╔═════════════════════════╗
   🎉 KÍCH HOẠT THÀNH CÔNG 🎉
╚═════════════════════════╝
🔑 Mã Key       : ${inputKey}
🏠 Nhóm áp dụng : ${threadName}
⏱️ Thời hạn cộng: +${daysToAdd} ngày
📅 Hạn dùng mới : ${newExpDate}
─────────────────────────
✨ Cảm ơn bạn đã tin tưởng và đồng hành cùng DTB Bot!`
    );
  }

  return send(
    `❌ Mã key hoặc lệnh không hợp lệ!\n` +
    `💡 Nếu bạn muốn kích hoạt key, hãy gõ: ${prefix}rent <mã_key>\n` +
    `💡 Gõ "${prefix}rent" để xem toàn bộ danh sách cú pháp hướng dẫn.`
  );
};
