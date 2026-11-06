module.exports.config = {
  name: "setmoney",
  version: "2.0.0",
  hasPermssion: 2,
  hasPermission: 2,
  credits: "dtb",
  description: "Lệnh Admin: Điều chỉnh số tiền trong ví của người dùng",
  commandCategory: "Hệ Thống",
  usages: "setmoney [add / set / clean / all / uid] [số tiền] [tag/reply/uid]",
  cooldowns: 2
};

module.exports.run = async function ({ event, api, Currencies, args, Users }) {
  const { threadID, messageID, senderID, messageReply, mentions } = event;
  const prefix = (global.data.threadData.get(String(threadID)) || {}).PREFIX || global.config.PREFIX || "/";

  if (!args[0]) {
    return api.sendMessage(
      `╔═════════════════════════╗\n` +
      `     👑 QUẢN LÝ TIỀN TỆ ADMIN 👑\n` +
      `╚═════════════════════════╝\n` +
      `📌 Hướng dẫn sử dụng:\n` +
      `  • ${prefix}setmoney add <tiền> [tag/reply] : Cộng thêm tiền\n` +
      `  • ${prefix}setmoney set <tiền> [tag/reply] : Đặt lại số dư ví\n` +
      `  • ${prefix}setmoney clean [tag/reply]      : Đưa số dư về 0$\n` +
      `  • ${prefix}setmoney all <tiền>             : Phát tiền cho cả nhóm\n` +
      `  • ${prefix}setmoney uid <uid> <tiền>       : Cộng tiền theo UID\n` +
      `─────────────────────────\n` +
      `⚠️ Lệnh chỉ dành cho Admin Bot!`,
      threadID,
      messageID
    );
  }

  const sub = args[0].toLowerCase();
  const money = parseInt(args[1]);
  const mentionIDs = mentions ? Object.keys(mentions) : [];

  switch (sub) {
    case "add": {
      if (isNaN(money)) return api.sendMessage("⚠️ Vui lòng nhập số tiền hợp lệ!", threadID, messageID);

      if (event.type === "message_reply") {
        const targetID = messageReply.senderID;
        const name = (await Users.getNameUser(targetID)) || targetID;
        await Currencies.increaseMoney(targetID, money);
        return api.sendMessage(`✅ Đã cộng +${money.toLocaleString("vi-VN")}$ vào tài khoản của ${name}!`, threadID, messageID);
      } else if (mentionIDs.length > 0) {
        for (const uid of mentionIDs) {
          await Currencies.increaseMoney(uid, money);
        }
        return api.sendMessage(`✅ Đã cộng +${money.toLocaleString("vi-VN")}$ cho ${mentionIDs.length} người được tag!`, threadID, messageID);
      } else {
        await Currencies.increaseMoney(senderID, money);
        return api.sendMessage(`✅ Đã cộng +${money.toLocaleString("vi-VN")}$ vào tài khoản của chính bạn!`, threadID, messageID);
      }
    }

    case "set": {
      if (isNaN(money) || money < 0) return api.sendMessage("⚠️ Vui lòng nhập số tiền hợp lệ!", threadID, messageID);

      if (event.type === "message_reply") {
        const targetID = messageReply.senderID;
        const name = (await Users.getNameUser(targetID)) || targetID;
        await Currencies.setData(targetID, { money });
        return api.sendMessage(`✅ Đã đặt số dư tài khoản của ${name} thành ${money.toLocaleString("vi-VN")}$!`, threadID, messageID);
      } else if (mentionIDs.length > 0) {
        for (const uid of mentionIDs) {
          await Currencies.setData(uid, { money });
        }
        return api.sendMessage(`✅ Đã đặt số dư cho ${mentionIDs.length} người được tag thành ${money.toLocaleString("vi-VN")}$!`, threadID, messageID);
      } else {
        await Currencies.setData(senderID, { money });
        return api.sendMessage(`✅ Đã đặt số dư tài khoản của bạn thành ${money.toLocaleString("vi-VN")}$!`, threadID, messageID);
      }
    }

    case "clean": {
      if (event.type === "message_reply") {
        const targetID = messageReply.senderID;
        const name = (await Users.getNameUser(targetID)) || targetID;
        await Currencies.setData(targetID, { money: 0 });
        return api.sendMessage(`🧹 Đã reset số dư tài khoản của ${name} về 0$!`, threadID, messageID);
      } else if (mentionIDs.length > 0) {
        for (const uid of mentionIDs) {
          await Currencies.setData(uid, { money: 0 });
        }
        return api.sendMessage(`🧹 Đã reset số dư của ${mentionIDs.length} người được tag về 0$!`, threadID, messageID);
      } else {
        await Currencies.setData(senderID, { money: 0 });
        return api.sendMessage(`🧹 Đã reset số dư của chính bạn về 0$!`, threadID, messageID);
      }
    }

    case "all": {
      if (isNaN(money) || money <= 0) return api.sendMessage("⚠️ Vui lòng nhập số tiền hợp lệ!", threadID, messageID);
      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs || [];

      for (const uid of participantIDs) {
        try {
          await Currencies.increaseMoney(uid, money);
        } catch (_) {}
      }
      return api.sendMessage(`🎁 Admin vừa phát thưởng +${money.toLocaleString("vi-VN")}$ cho toàn bộ ${participantIDs.length} thành viên trong nhóm!`, threadID, messageID);
    }

    case "uid": {
      const targetUID = args[1];
      const addMoney = parseInt(args[2]);
      if (!targetUID || isNaN(addMoney)) {
        return api.sendMessage(`⚠️ Cú pháp: ${prefix}setmoney uid <UID> <số tiền>`, threadID, messageID);
      }
      const name = (await Users.getNameUser(targetUID)) || targetUID;
      await Currencies.increaseMoney(targetUID, addMoney);
      return api.sendMessage(`✅ Đã cộng +${addMoney.toLocaleString("vi-VN")}$ cho người dùng [${name}] (UID: ${targetUID})!`, threadID, messageID);
    }

    default:
      return api.sendMessage(`❌ Cú pháp không hợp lệ! Gõ "${prefix}setmoney" để xem hướng dẫn chi tiết.`, threadID, messageID);
  }
};
