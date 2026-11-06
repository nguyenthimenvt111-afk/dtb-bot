const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "dapchuot",
  version: "1.0.0",
  credits: "dtb",
  hasPermssion: 0,
  hasPermission: 0,
  description: "Trò chơi đập chuột chũi phản xạ nhanh: quan sát hang chuột và reply số hang để đập trúng",
  commandCategory: "Trò Chơi",
  usages: "dapchuot [số tiền cược / để trống]",
  cooldowns: 5
};

module.exports.handleReply = async function ({ api, event, handleReply, Currencies, Users }) {
  const { senderID, body, messageID, threadID } = event;
  if (senderID !== handleReply.author) return;

  const hitPosition = parseInt(body.trim());
  if (isNaN(hitPosition) || hitPosition < 1 || hitPosition > 9) {
    return api.sendMessage("⚠️ Vui lòng chỉ reply số hang từ 1 đến 9!", threadID, messageID);
  }

  const { molePosition, bet, startTime } = handleReply;
  const timeTaken = ((Date.now() - startTime) / 1000).toFixed(1);
  const userName = await Users.getNameUser(senderID) || "Người chơi";

  api.unsendMessage(handleReply.messageID);

  // ĐẬP TRÚNG!
  if (hitPosition === molePosition) {
    const reward = bet > 0 ? bet * 2 : 1500;
    await Currencies.increaseMoney(senderID, reward);
    const balance = (await Currencies.getData(senderID)).money;

    return api.sendMessage(
`💥💥 BỐP!! ĐẬP TRÚNG CHUỘT CHŨI! 💥💥
══════════════════════════
👤 Cần thủ: ${userName}
🔨 Vị trí đập: Hang số [ ${hitPosition} ] ✅
⚡ Tốc độ phản xạ: ${timeTaken} giây!
──────────────────────────
💰 Tiền thưởng: +${reward.toLocaleString()}$ ${bet > 0 ? "(Gấp đôi x2 tiền cược!)" : ""}
💵 Số dư tài khoản: ${balance.toLocaleString()}$
Phản xạ nhanh như chớp! Chuột chũi đã bị hạ gục! 🐹💥`,
      threadID,
      messageID
    );
  }

  // ĐẬP HỤT!
  if (bet > 0) {
    await Currencies.decreaseMoney(senderID, bet);
  }
  const balance = (await Currencies.getData(senderID)).money;

  return api.sendMessage(
`💨 HỤT RỒI! CHUỘT ĐÃ TRỐN THOÁT! 💨
══════════════════════════
👤 Người chơi: ${userName}
❌ Bạn đã đập vào: Hang số [ ${hitPosition} ]
🐹 Vị trí thực sự của chuột: Hang số [ ${molePosition} ]
⏱️ Thời gian phản xạ: ${timeTaken} giây
──────────────────────────
💸 Bị trừ tiền cược: -${bet.toLocaleString()}$
💵 Số dư tài khoản: ${balance.toLocaleString()}$
Chuột chũi: "Lêu lêu đập hụt rồi nhé!" 😜`,
    threadID,
    messageID
  );
};

module.exports.run = async function ({ api, event, args, Currencies, Users }) {
  const { threadID, messageID, senderID } = event;
  let bet = 0;

  if (args[0]) {
    bet = parseInt(args[0]);
    if (isNaN(bet) || bet < 0) {
      return api.sendMessage("❌ Số tiền cược không hợp lệ! Hãy nhập số nguyên dương hoặc để trống để chơi vui.", threadID, messageID);
    }
    const userMoney = (await Currencies.getData(senderID)).money || 0;
    if (userMoney < bet) {
      return api.sendMessage(`💸 Bạn không đủ tiền! Số dư của bạn có ${userMoney.toLocaleString()}$, không đủ cược ${bet.toLocaleString()}$!`, threadID, messageID);
    }
  }

  // Chọn ngẫu nhiên vị trí chuột từ 1 đến 9
  const molePosition = Math.floor(Math.random() * 9) + 1;
  const userName = await Users.getNameUser(senderID) || "Người chơi";

  // Tạo ma trận hang
  let board = [];
  for (let i = 1; i <= 9; i++) {
    if (i === molePosition) {
      board.push(`[ 🐹 ${i} ]`);
    } else {
      board.push(`[ 🕳️ ${i} ]`);
    }
  }

  const boardDisplay = 
`    ${board[0]}   ${board[1]}   ${board[2]}
    ${board[3]}   ${board[4]}   ${board[5]}
    ${board[6]}   ${board[7]}   ${board[8]}`;

  const msg = 
`╔═════════════════════════╗
   🔨 ĐẬP CHUỘT PHẢN XẠ 🔨
╚═════════════════════════╝
👤 Người chơi: ${userName}
💵 Mức cược: ${bet > 0 ? bet.toLocaleString() + "$ (Thắng x2 = " + (bet * 2).toLocaleString() + "$)" : "Chơi vui (+1,500$ khi đập trúng)"}
──────────────────────────
${boardDisplay}
──────────────────────────
⚡ CHUỘT VỪA NGOI LÊN!
👉 Hãy REPLY ngay con số của hang có chuột [ 🐹 ] để đập!
(Hạn phản xạ: 20 giây)`;

  return api.sendMessage(
    msg,
    threadID,
    (err, info) => {
      if (!err && info) {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          molePosition,
          bet,
          startTime: Date.now()
        });
      }
    },
    messageID
  );
};
