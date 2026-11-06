const fs = require("fs-extra");
const path = require("path");

let Canvas = null;
try {
  Canvas = require("@napi-rs/canvas");
} catch (_) {
  try {
    Canvas = require("canvas");
  } catch (_) {}
}

const cacheDir = path.join(__dirname, "cache");
fs.ensureDirSync(cacheDir);

const dataPath = path.join(cacheDir, "fishing_data.json");
function loadData() {
  try {
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, "utf8"));
    }
  } catch (_) {}
  return { users: {} };
}
function saveData(data) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("[cauca] Lỗi lưu fishing_data:", e);
  }
}

// Cấu hình các loại cần câu
const RODS = {
  truc: { name: "Cần Trúc Cổ Truyền 🎋", price: 0, luckBonus: 0, desc: "Cần câu tân thủ, tỷ lệ bắt cá phổ thông cao" },
  carbon: { name: "Cần Carbon Thể Thao 🎣", price: 10000, luckBonus: 15, desc: "Tăng 15% tỷ lệ cá hiếm" },
  titan: { name: "Cần Hợp Kim Titan ⚡", price: 50000, luckBonus: 35, desc: "Tăng 35% tỷ lệ cá cực phẩm & rương vàng" },
  dragon: { name: "Cần Long Vương Thần Khí 🐉", price: 200000, luckBonus: 65, desc: "Đỉnh cao câu cá, mở khóa thủy quái huyền thoại" }
};

// Danh sách các loài cá & vật phẩm
const FISH_TABLE = [
  // Rác / Đồ linh tinh (Weight 20)
  { name: "Chiếc Giày Rách 👟", rarity: "Phế liệu", minKg: 0.3, maxKg: 1.2, value: 10, weight: 15, color: "#9ca3af" },
  { name: "Túi Rong Biển 🌿", rarity: "Phế liệu", minKg: 0.1, maxKg: 0.8, value: 20, weight: 15, color: "#9ca3af" },
  { name: "Vỏ Lon Cũ Rỉ Sét 🥫", rarity: "Phế liệu", minKg: 0.1, maxKg: 0.3, value: 15, weight: 10, color: "#9ca3af" },

  // Phổ thông (Common - Weight 35)
  { name: "Cá Rô Đồng 🐟", rarity: "Phổ thông", minKg: 0.3, maxKg: 1.5, value: 80, weight: 25, color: "#38bdf8" },
  { name: "Cá Chép Vàng 🐟", rarity: "Phổ thông", minKg: 1.0, maxKg: 4.5, value: 180, weight: 20, color: "#38bdf8" },
  { name: "Cá Lóc Bông 🐟", rarity: "Phổ thông", minKg: 1.2, maxKg: 5.0, value: 250, weight: 20, color: "#38bdf8" },
  { name: "Tôm Càng Xanh 🦐", rarity: "Phổ thông", minKg: 0.2, maxKg: 0.8, value: 150, weight: 15, color: "#38bdf8" },
  { name: "Cua Cà Mau 🦀", rarity: "Phổ thông", minKg: 0.5, maxKg: 2.0, value: 300, weight: 15, color: "#38bdf8" },

  // Hiếm (Rare - Weight 20)
  { name: "Cá Hồi Đại Tây Dương 🐠", rarity: "Hiếm", minKg: 3.5, maxKg: 12.0, value: 1200, weight: 12, color: "#a855f7" },
  { name: "Cá Ngừ Đại Dương 🐟", rarity: "Hiếm", minKg: 15.0, maxKg: 65.0, value: 2500, weight: 10, color: "#a855f7" },
  { name: "Bạch Tuộc Khổng Lồ 🐙", rarity: "Hiếm", minKg: 8.0, maxKg: 30.0, value: 3200, weight: 8, color: "#a855f7" },

  // Cực phẩm (Epic - Weight 8)
  { name: "Cá Mập Trắng Đại Dương 🦈", rarity: "Cực phẩm", minKg: 150.0, maxKg: 600.0, value: 12000, weight: 5, color: "#fb923c" },
  { name: "Cá Voi Sát Thủ Orca 🐋", rarity: "Cực phẩm", minKg: 500.0, maxKg: 2000.0, value: 25000, weight: 4, color: "#fb923c" },
  { name: "Rương Kho Báu Hải Tặc 💰", rarity: "Cực phẩm", minKg: 20.0, maxKg: 80.0, value: 35000, weight: 3, color: "#fbbf24" },

  // Huyền thoại (Legendary - Weight 2)
  { name: "Thủy Quái Kraken Cổ Đại 🦑", rarity: "Huyền thoại", minKg: 2500.0, maxKg: 8000.0, value: 90000, weight: 1.5, color: "#ef4444" },
  { name: "Rồng Biển Leviathan 🌊", rarity: "Huyền thoại", minKg: 5000.0, maxKg: 15000.0, value: 150000, weight: 1.0, color: "#ef4444" },
  { name: "Nàng Tiên Cá Thần Bí 🧜‍♀️", rarity: "Thần thoại", minKg: 45.0, maxKg: 60.0, value: 300000, weight: 0.5, color: "#ec4899" }
];

// Hàm câu ngẫu nhiên có tính bonus cần câu
function pickCatch(luckBonus = 0) {
  const adjustedTable = FISH_TABLE.map(item => {
    let w = item.weight;
    if (["Hiếm", "Cực phẩm", "Huyền thoại", "Thần thoại"].includes(item.rarity)) {
      w = w * (1 + luckBonus / 100);
    }
    return { ...item, calcWeight: w };
  });

  const totalWeight = adjustedTable.reduce((sum, i) => sum + i.calcWeight, 0);
  let randomVal = Math.random() * totalWeight;

  for (const f of adjustedTable) {
    if (randomVal < f.calcWeight) {
      const kg = +(Math.random() * (f.maxKg - f.minKg) + f.minKg).toFixed(1);
      const earned = Math.round(f.value * (kg / f.minKg));
      return {
        name: f.name,
        rarity: f.rarity,
        kg,
        value: earned,
        color: f.color
      };
    }
    randomVal -= f.calcWeight;
  }
  return adjustedTable[0];
}

// Vẽ thẻ chiến lợi phẩm Canvas
async function renderFishCard(userName, fish, rodName) {
  if (!Canvas || !Canvas.createCanvas) return null;
  const width = 720;
  const height = 400;
  const cvs = Canvas.createCanvas(width, height);
  const ctx = cvs.getContext("2d");

  // Nền đại dương huyền ảo
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#03071e");
  grad.addColorStop(0.5, "#0b1d3a");
  grad.addColorStop(1, "#021226");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Khung viền Neon theo độ hiếm
  ctx.strokeStyle = fish.color;
  ctx.lineWidth = 4;
  ctx.shadowColor = fish.color;
  ctx.shadowBlur = 18;
  ctx.strokeRect(18, 18, width - 36, height - 36);
  ctx.shadowBlur = 0;

  // Header Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🎣 CHIẾN LỢI PHẨM CÂU CÁ 🎣", width / 2, 60);

  // Tên cần câu
  ctx.fillStyle = "#94a3b8";
  ctx.font = "16px sans-serif";
  ctx.fillText(`Cần câu: ${rodName}`, width / 2, 95);

  // Tên cá to nổi bật
  ctx.fillStyle = fish.color;
  ctx.font = "bold 36px sans-serif";
  ctx.shadowColor = fish.color;
  ctx.shadowBlur = 15;
  ctx.fillText(fish.name, width / 2, 170);
  ctx.shadowBlur = 0;

  // Box thông số
  const boxY = 220;
  const bW = 190, bH = 80;
  const boxes = [
    { title: "PHẨM CẤP", val: fish.rarity, col: fish.color },
    { title: "CÂN NẶNG", val: `${fish.kg} KG`, col: "#38bdf8" },
    { title: "GIÁ TRỊ", val: `+${fish.value.toLocaleString()}$`, col: "#4ade80" }
  ];

  boxes.forEach((b, idx) => {
    const bx = 55 + idx * (bW + 35);
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.5;
    ctx.fillRect(bx, boxY, bW, bH);
    ctx.strokeRect(bx, boxY, bW, bH);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(b.title, bx + bW / 2, boxY + 28);

    ctx.fillStyle = b.col;
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(b.val, bx + bW / 2, boxY + 60);
  });

  // Footer Người câu
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "italic 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Người câu: ${userName}`, width / 2, height - 35);

  const cardPath = path.join(cacheDir, `fish_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`);
  fs.writeFileSync(cardPath, cvs.toBuffer("image/png"));
  return cardPath;
}

module.exports.config = {
  name: "cauca",
  version: "1.0.0",
  credits: "dtb",
  hasPermssion: 0,
  hasPermission: 0,
  description: "Minigame câu cá giải trí đỉnh cao: mua cần, thả câu, săn thủy quái, bán cá kiếm tiền",
  commandCategory: "Trò Chơi",
  usages: "cauca [cau/tui/ban/shop/mua]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args, Currencies, Users }) {
  const { threadID, messageID, senderID } = event;
  const db = loadData();
  if (!db.users[senderID]) {
    db.users[senderID] = {
      rod: "truc",
      bag: [],
      totalCatch: 0,
      totalEarned: 0
    };
    saveData(db);
  }

  const userGame = db.users[senderID];
  const prefix = (global.data.threadData.get(String(threadID)) || {}).PREFIX || global.config.PREFIX;
  const action = (args[0] || "").toLowerCase();

  // 1. Xem hướng dẫn nếu không có tham số
  if (!action) {
    const currentRod = RODS[userGame.rod] || RODS.truc;
    return api.sendMessage(
`╔═════════════════════════╗
   🎣 KHU CÂU CÁ ĐẠI DƯƠNG 🎣
╚═════════════════════════╝
▸ Cần hiện tại: ${currentRod.name}
▸ Cá trong túi: ${userGame.bag.length}/30 con
──────────────────────────
👉 Cú pháp điều khiển:
▸ ${prefix}cauca cau : Thả cần câu cá
▸ ${prefix}cauca tui : Xem giỏ cá đang có
▸ ${prefix}cauca ban [all] : Bán toàn bộ cá trong giỏ
▸ ${prefix}cauca shop : Xem cửa hàng cần câu xịn
▸ ${prefix}cauca mua [tên cần] : Mua cần câu mới`,
      threadID,
      messageID
    );
  }

  // 2. Thả câu (câu cá)
  if (action === "cau" || action === "start") {
    if (userGame.bag.length >= 30) {
      return api.sendMessage("🎒 Giỏ cá của bạn đã đầy (30/30 con)! Hãy dùng `cauca ban all` để bán bớt lấy tiền.", threadID, messageID);
    }

    const currentRod = RODS[userGame.rod] || RODS.truc;
    const caught = pickCatch(currentRod.luckBonus);
    userGame.bag.push(caught);
    userGame.totalCatch = (userGame.totalCatch || 0) + 1;
    saveData(db);

    const userName = await Users.getNameUser(senderID) || "Cần thủ";

    let cardPath = null;
    try {
      cardPath = await renderFishCard(userName, caught, currentRod.name);
    } catch (e) {
      console.error("[cauca] Lỗi vẽ card:", e);
    }

    const msg = 
`🎣 [ CÂU CÁ THÀNH CÔNG ]
👤 Cần thủ: ${userName}
🎋 Trang bị: ${currentRod.name}
──────────────────────────
🐟 Chiến lợi phẩm: ${caught.name}
⚖️ Trọng lượng: ${caught.kg} KG
⭐ Phẩm cấp: ${caught.rarity}
💰 Giá trị dự kiến: +${caught.value.toLocaleString()}$
──────────────────────────
👉 Dùng "${prefix}cauca ban all" để bán lấy tiền mặt!`;

    const payload = { body: msg };
    if (cardPath && fs.existsSync(cardPath)) {
      payload.attachment = fs.createReadStream(cardPath);
    }

    return api.sendMessage(payload, threadID, (err) => {
      setTimeout(() => {
        try { if (cardPath && fs.existsSync(cardPath)) fs.unlinkSync(cardPath); } catch (_) {}
      }, 15000);
    }, messageID);
  }

  // 3. Xem túi cá
  if (action === "tui" || action === "bag") {
    if (userGame.bag.length === 0) {
      return api.sendMessage("🎒 Giỏ của bạn đang trống rỗng! Hãy dùng `cauca cau` để bắt đầu câu cá.", threadID, messageID);
    }

    let totalEst = 0;
    let listText = userGame.bag.map((f, i) => {
      totalEst += f.value;
      return `${i + 1}. ${f.name} - ${f.kg}kg (${f.rarity}) → +${f.value.toLocaleString()}$`;
    }).slice(-15).join("\n");

    if (userGame.bag.length > 15) {
      listText = `... (và ${userGame.bag.length - 15} con cá khác)\n` + listText;
    }

    return api.sendMessage(
`╔═════════════════════════╗
     🎒 GIỎ CÁ CỦA BẠN 🎒
╚═════════════════════════╝
${listText}
──────────────────────────
📦 Tổng số lượng: ${userGame.bag.length}/30 con
💰 Tổng giá trị giỏ: ${totalEst.toLocaleString()}$
👉 Dùng "${prefix}cauca ban all" để nhận tiền ngay!`,
      threadID,
      messageID
    );
  }

  // 4. Bán cá
  if (action === "ban" || action === "sell") {
    if (userGame.bag.length === 0) {
      return api.sendMessage("🎒 Giỏ của bạn không có cá nào để bán!", threadID, messageID);
    }

    let totalEarned = 0;
    const count = userGame.bag.length;
    for (const f of userGame.bag) {
      totalEarned += f.value;
    }

    userGame.bag = [];
    userGame.totalEarned = (userGame.totalEarned || 0) + totalEarned;
    saveData(db);

    await Currencies.increaseMoney(senderID, totalEarned);
    const balance = (await Currencies.getData(senderID)).money;

    return api.sendMessage(
`🏪 [ THƯƠNG CẢNG BÁN CÁ ]
──────────────────────────
✅ Đã bán toàn bộ: ${count} chiến lợi phẩm
💰 Thu về: +${totalEarned.toLocaleString()}$
💵 Số dư tài khoản hiện tại: ${balance.toLocaleString()}$
Chúc bạn câu được nhiều cá lớn hơn nữa!`,
      threadID,
      messageID
    );
  }

  // 5. Cửa hàng cần câu
  if (action === "shop") {
    let shopText = Object.entries(RODS).map(([key, r]) => {
      const owned = userGame.rod === key ? "【ĐANG DÙNG ✅】" : "";
      return `▸ Mã mua: "${key}"\n${r.name} ${owned}\n💵 Giá: ${r.price === 0 ? "Miễn phí" : r.price.toLocaleString() + "$"}\n✨ Hiệu quả: ${r.desc}\n`;
    }).join("\n──────────────────────────\n");

    return api.sendMessage(
`╔═════════════════════════╗
    🏪 CỬA HÀNG CẦN CÂU 🏪
╚═════════════════════════╝
${shopText}
──────────────────────────
👉 Mua cần: "${prefix}cauca mua [mã mua]"
Ví dụ: "${prefix}cauca mua carbon"`,
      threadID,
      messageID
    );
  }

  // 6. Mua cần câu
  if (action === "mua" || action === "buy") {
    const rodKey = (args[1] || "").toLowerCase();
    if (!RODS[rodKey]) {
      return api.sendMessage(`❌ Cần câu không tồn tại! Dùng "${prefix}cauca shop" để xem mã cần.`, threadID, messageID);
    }

    const targetRod = RODS[rodKey];
    if (userGame.rod === rodKey) {
      return api.sendMessage("⚠️ Bạn đang sở hữu và trang bị cần câu này rồi!", threadID, messageID);
    }

    const userMoney = (await Currencies.getData(senderID)).money || 0;
    if (userMoney < targetRod.price) {
      return api.sendMessage(`💸 Bạn không đủ tiền! Cần câu giá ${targetRod.price.toLocaleString()}$, bạn còn thiếu ${(targetRod.price - userMoney).toLocaleString()}$!`, threadID, messageID);
    }

    if (targetRod.price > 0) {
      await Currencies.decreaseMoney(senderID, targetRod.price);
    }

    userGame.rod = rodKey;
    saveData(db);

    return api.sendMessage(
`🎉 [ CHÚC MỪNG MUA CẦN MỚI ]
──────────────────────────
✅ Bạn đã trang bị thành công: ${targetRod.name}
✨ Thuộc tính: ${targetRod.desc}
Chúc bạn bắt được thật nhiều Thủy Quái & Rương Vàng!`,
      threadID,
      messageID
    );
  }

  return api.sendMessage(`❌ Lệnh không hợp lệ! Dùng "${prefix}cauca" để xem hướng dẫn.`, threadID, messageID);
};
