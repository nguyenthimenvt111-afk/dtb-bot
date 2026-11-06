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

module.exports.config = {
  name: "doanso",
  version: "1.0.0",
  credits: "dtb",
  hasPermssion: 0,
  hasPermission: 0,
  description: "Trò chơi đấu trí đoán số bí mật 1 - 100 với Bot qua reply (thưởng cược x5)",
  commandCategory: "Trò Chơi",
  usages: "doanso [số tiền cược / để trống]",
  cooldowns: 5
};

module.exports.handleReply = async function ({ api, event, handleReply, Currencies, Users }) {
  const { senderID, body, messageID, threadID } = event;
  if (senderID !== handleReply.author) return;

  const guess = parseInt(body.trim());
  if (isNaN(guess) || guess < 1 || guess > 100) {
    return api.sendMessage("⚠️ Vui lòng chỉ nhập một con số hợp lệ từ 1 đến 100!", threadID, messageID);
  }

  let { secret, attemptsLeft, bet, minRange, maxRange, history } = handleReply;
  attemptsLeft -= 1;
  history.push(guess);

  const userName = await Users.getNameUser(senderID) || "Người chơi";

  // Case 1: ĐOÁN ĐÚNG!
  if (guess === secret) {
    api.unsendMessage(handleReply.messageID);
    const winAmount = bet > 0 ? bet * 5 : 2000;
    await Currencies.increaseMoney(senderID, winAmount);
    const balance = (await Currencies.getData(senderID)).money;

    return api.sendMessage(
`🎉🎉 XUẤT SẮC! BẠN ĐÃ CHIẾN THẮNG! 🎉🎉
══════════════════════════
👤 Người chơi: ${userName}
🎯 Số bí mật chính xác là: 【 ${secret} 】
❤️ Đoán trúng sau: ${7 - attemptsLeft} lượt đoán!
📈 Lịch sử các số đã đoán: ${history.join(" ➔ ")}
──────────────────────────
💰 Thưởng chiến thắng: +${winAmount.toLocaleString()}$ ${bet > 0 ? "(Gấp x5 cược!)" : ""}
💵 Số dư tài khoản: ${balance.toLocaleString()}$
Thiên tài suy luận là đây chứ đâu! 🌟`,
      threadID,
      messageID
    );
  }

  // Case 2: HẾT LƯỢT (THUA)
  if (attemptsLeft <= 0) {
    api.unsendMessage(handleReply.messageID);
    if (bet > 0) {
      await Currencies.decreaseMoney(senderID, bet);
    }
    const balance = (await Currencies.getData(senderID)).money;

    return api.sendMessage(
`💀 HẾT LƯỢT! BẠN ĐÃ THUA CUỘC 💀
══════════════════════════
👤 Người chơi: ${userName}
❌ Rất tiếc, bạn đã dùng hết 7 lượt đoán!
🎯 Số bí mật thực sự là: 【 ${secret} 】
📈 Lịch sử các số đã đoán: ${history.join(" ➔ ")}
──────────────────────────
💸 Bị trừ tiền cược: -${bet.toLocaleString()}$
💵 Số dư tài khoản: ${balance.toLocaleString()}$
Đừng nản lòng, hãy phục thù ở ván sau nhé! 💪`,
      threadID,
      messageID
    );
  }

  // Case 3: ĐOÁN CHƯA ĐÚNG -> GỢI Ý TIẾP
  let hint = "";
  if (guess > secret) {
    hint = `📉 Số bí mật NHỎ HƠN < ${guess} >`;
    if (guess < maxRange) maxRange = guess - 1;
  } else {
    hint = `📈 Số bí mật LỚN HƠN < ${guess} >`;
    if (guess > minRange) minRange = guess + 1;
  }

  api.unsendMessage(handleReply.messageID);

  return api.sendMessage(
`╔═════════════════════════╗
   🎯 THỬ THÁCH ĐOÁN SỐ 🎯
╚═════════════════════════╝
👤 Người chơi: ${userName}
👉 Số vừa đoán: ${guess}
🔍 Gợi ý: ${hint}
──────────────────────────
🎯 Phạm vi khả dĩ hiện tại: [ ${minRange} ➔ ${maxRange} ]
❤️ Lượt đoán còn lại: ${attemptsLeft}/7 lượt
📈 Lịch sử: ${history.join(", ")}
──────────────────────────
👉 Hãy tiếp tục reply tin nhắn này với con số tiếp theo!`,
    threadID,
    (err, info) => {
      if (!err && info) {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          secret,
          attemptsLeft,
          bet,
          minRange,
          maxRange,
          history
        });
      }
    },
    messageID
  );
};

module.exports.run = async function ({ api, event, args, Currencies, Users }) {
  const { threadID, messageID, senderID } = event;
  let bet = 0;

  if (args[0]) {
    bet = parseInt(args[0]);
    if (isNaN(bet) || bet < 0) {
      return api.sendMessage("❌ Số tiền cược không hợp lệ! Hãy nhập một số nguyên dương hoặc để trống để chơi vui.", threadID, messageID);
    }
    const userMoney = (await Currencies.getData(senderID)).money || 0;
    if (userMoney < bet) {
      return api.sendMessage(`💸 Bạn không đủ tiền! Số dư của bạn hiện có ${userMoney.toLocaleString()}$, không đủ để cược ${bet.toLocaleString()}$!`, threadID, messageID);
    }
  }

  const secret = Math.floor(Math.random() * 100) + 1;
  const userName = await Users.getNameUser(senderID) || "Người chơi";

  return api.sendMessage(
`╔═════════════════════════╗
   🎯 THỬ THÁCH ĐOÁN SỐ 🎯
╚═════════════════════════╝
👤 Người chơi: ${userName}
💵 Mức cược: ${bet > 0 ? bet.toLocaleString() + "$ (Thắng x5 = " + (bet * 5).toLocaleString() + "$)" : "Chơi miễn phí (+2,000$ khi thắng)"}
🎯 Phạm vi số bí mật: [ 1 ➔ 100 ]
❤️ Tổng lượt đoán: 7 lượt
──────────────────────────
👉 Hãy REPLY tin nhắn này với con số bạn chọn đầu tiên (từ 1 đến 100) để bắt đầu!`,
    threadID,
    (err, info) => {
      if (!err && info) {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          secret,
          attemptsLeft: 7,
          bet,
          minRange: 1,
          maxRange: 100,
          history: []
        });
      }
    },
    messageID
  );
};
