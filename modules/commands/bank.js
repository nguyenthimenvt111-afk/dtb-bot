const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "bank",
  version: "2.0.0",
  hasPermssion: 0,
  hasPermission: 0,
  credits: "dtb",
  description: "Ngân hàng ảo DTB Bank: gửi tiết kiệm sinh lãi, rút tiền, kiểm tra số dư",
  commandCategory: "Tiện ích",
  usages: "bank [register / check / send / rut] [số tiền]",
  cooldowns: 2
};

const bankDataPath = path.join(__dirname, "data", "bank.json");

function loadBankData() {
  fs.ensureDirSync(path.join(__dirname, "data"));
  if (!fs.existsSync(bankDataPath)) {
    fs.writeFileSync(bankDataPath, "[]", "utf8");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(bankDataPath, "utf8"));
  } catch (_) {
    return [];
  }
}

function saveBankData(data) {
  fs.writeFileSync(bankDataPath, JSON.stringify(data, null, 2), "utf8");
}

function formatNumber(num) {
  return Math.floor(Number(num) || 0).toLocaleString("vi-VN");
}

module.exports.run = async function ({ api, event, args, Currencies, Users }) {
  const { threadID, messageID, senderID } = event;
  const bankUsers = loadBankData();
  const sub = (args[0] || "").toLowerCase();
  const prefix = (global.data.threadData.get(String(threadID)) || {}).PREFIX || global.config.PREFIX || "/";

  const laisuat = 0.05; // 5% lãi
  const timeInterest = 60; // 60 phút

  // 1. Đăng ký tài khoản
  if (["register", "-r", "dangky", "đăngký"].includes(sub)) {
    if (bankUsers.some(u => String(u.senderID) === String(senderID))) {
      return api.sendMessage("⚠️ Bạn đã có tài khoản tại DTB Bank rồi!", threadID, messageID);
    }
    bankUsers.push({
      senderID: String(senderID),
      money: "0",
      lastInterest: Date.now()
    });
    saveBankData(bankUsers);
    return api.sendMessage(
      "✅ ĐĂNG KÝ THÀNH CÔNG!\n" +
      "🏦 Chào mừng bạn đến với DTB Bank!\n" +
      `💡 Hãy dùng "${prefix}bank send 10000" để gửi tiết kiệm và nhận lãi +5% mỗi giờ nhé!`,
      threadID,
      messageID
    );
  }

  // Tìm tài khoản
  const userAccount = bankUsers.find(u => String(u.senderID) === String(senderID));

  // 2. Kiểm tra số dư ngân hàng
  if (["check", "coins", "sodu", "info"].includes(sub)) {
    if (!userAccount) {
      return api.sendMessage(`⚠️ Bạn chưa có tài khoản ngân hàng! Gõ "${prefix}bank register" để mở tài khoản miễn phí.`, threadID, messageID);
    }

    // Tính lãi tự động nếu đủ thời gian
    const now = Date.now();
    const lastTime = userAccount.lastInterest || now;
    const hoursPassed = Math.floor((now - lastTime) / (3600 * 1000));
    let bonusInterest = 0;
    if (hoursPassed > 0 && BigInt(userAccount.money) > 0n) {
      bonusInterest = Math.floor(Number(userAccount.money) * laisuat * hoursPassed);
      userAccount.money = String(BigInt(userAccount.money) + BigInt(bonusInterest));
      userAccount.lastInterest = now;
      saveBankData(bankUsers);
    }

    return api.sendMessage(
      `╔═════════════════════════╗\n` +
      `       🏦 DTB BANKING 🏦\n` +
      `╚═════════════════════════╝\n` +
      `💳 Tài khoản: ${senderID}\n` +
      `💰 Tiền gửi : ${formatNumber(userAccount.money)} $\n` +
      `📈 Lãi suất : +${laisuat * 100}% / giờ\n` +
      (bonusInterest > 0 ? `✨ Lãi nhận được gần nhất: +${formatNumber(bonusInterest)}$\n` : "") +
      `─────────────────────────\n` +
      `💡 Dùng "${prefix}bank send <tiền>" để gửi thêm hoặc "${prefix}bank rut <tiền>" để rút tiền về ví!`,
      threadID,
      messageID
    );
  }

  // 3. Gửi tiền vào ngân hàng
  if (["send", "gửi", "gui", "nap"].includes(sub)) {
    if (!userAccount) {
      return api.sendMessage(`⚠️ Bạn chưa đăng ký tài khoản! Gõ "${prefix}bank register" để đăng ký.`, threadID, messageID);
    }

    const currentWallet = (await Currencies.getData(senderID)).money || 0;
    let sendAmount = 0;

    if (args[1] === "all") {
      sendAmount = currentWallet;
    } else {
      sendAmount = parseInt(args[1]);
    }

    if (isNaN(sendAmount) || sendAmount < 10000) {
      return api.sendMessage("⚠️ Số tiền gửi tối thiểu vào ngân hàng là 10,000$!", threadID, messageID);
    }

    if (sendAmount > currentWallet) {
      return api.sendMessage(`❌ Số dư ví của bạn không đủ! Hiện tại bạn chỉ có ${formatNumber(currentWallet)}$.`, threadID, messageID);
    }

    await Currencies.decreaseMoney(senderID, sendAmount);
    userAccount.money = String(BigInt(userAccount.money) + BigInt(sendAmount));
    if (!userAccount.lastInterest) userAccount.lastInterest = Date.now();
    saveBankData(bankUsers);

    return api.sendMessage(
      `✅ GỬI TIỀN THÀNH CÔNG!\n` +
      `💵 Đã gửi: ${formatNumber(sendAmount)}$ vào DTB Bank\n` +
      `💰 Tổng tiền trong tài khoản: ${formatNumber(userAccount.money)}$\n` +
      `📈 Lãi suất: +${laisuat * 100}% mỗi giờ`,
      threadID,
      messageID
    );
  }

  // 4. Rút tiền từ ngân hàng về ví
  if (["rut", "rút", "lay", "lấy", "withdraw"].includes(sub)) {
    if (!userAccount) {
      return api.sendMessage(`⚠️ Bạn chưa đăng ký tài khoản! Gõ "${prefix}bank register" để đăng ký.`, threadID, messageID);
    }

    let withdrawAmount = 0;
    if (args[1] === "all") {
      withdrawAmount = Number(userAccount.money);
    } else {
      withdrawAmount = parseInt(args[1]);
    }

    if (isNaN(withdrawAmount) || withdrawAmount < 1000) {
      return api.sendMessage("⚠️ Số tiền rút tối thiểu là 1,000$!", threadID, messageID);
    }

    if (BigInt(withdrawAmount) > BigInt(userAccount.money)) {
      return api.sendMessage(`❌ Số dư ngân hàng của bạn không đủ! Bạn chỉ có ${formatNumber(userAccount.money)}$ trong ngân hàng.`, threadID, messageID);
    }

    userAccount.money = String(BigInt(userAccount.money) - BigInt(withdrawAmount));
    saveBankData(bankUsers);
    await Currencies.increaseMoney(senderID, withdrawAmount);

    return api.sendMessage(
      `✅ RÚT TIỀN THÀNH CÔNG!\n` +
      `💵 Đã rút: ${formatNumber(withdrawAmount)}$ về ví cá nhân\n` +
      `💰 Số dư ngân hàng còn lại: ${formatNumber(userAccount.money)}$`,
      threadID,
      messageID
    );
  }

  // Menu hướng dẫn mặc định
  return api.sendMessage(
    `╔═════════════════════════╗\n` +
    `       🏦 DTB BANKING 🏦\n` +
    `╚═════════════════════════╝\n` +
    `📌 Hướng dẫn sử dụng:\n` +
    `  • ${prefix}bank register : Mở tài khoản ngân hàng\n` +
    `  • ${prefix}bank check    : Kiểm tra số dư & lãi suất\n` +
    `  • ${prefix}bank send <tiền|all> : Gửi tiền tiết kiệm\n` +
    `  • ${prefix}bank rut <tiền|all>  : Rút tiền về ví\n` +
    `─────────────────────────\n` +
    `📈 Lãi suất cố định: +5% mỗi giờ cho mọi khoản tiền gửi!`,
    threadID,
    messageID
  );
};
