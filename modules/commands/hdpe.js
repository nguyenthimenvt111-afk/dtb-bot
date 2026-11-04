module.exports.config = {
  name: "hdpe",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "dtb",
  description: "Đầu tư và rút tiền - Có thể x2 hoặc mất trắng",
  commandCategory: "Kinh tế",
  usages: "/hdpe [dautu|rut] [số tiền]",
  cooldowns: 5,
};

module.exports.run = async ({ event, api, Currencies, args }) => {
  const { threadID, messageID, senderID } = event;
  const action = args[0] ? args[0].toLowerCase() : "";

  if (!action || (action !== "dautu" && action !== "rut")) {
    return api.sendMessage(
      "=== HDPE Investment ===\n\n" +
      "Cách sử dụng:\n" +
      "► /hdpe dautu [số tiền] - Đầu tư và chờ kết quả (15-20s)\n" +
      "► /hdpe rut [số tiền] - Rút tiền về tài khoản\n\n" +
      "Lưu ý: Đầu tư có thể x2 tiền hoặc mất trắng!",
      threadID, messageID
    );
  }

  // XỬ LÝ RÚT TIỀN
  if (action === "rut") {
    const amount = parseInt(args[1]);
    const userData = await Currencies.getData(senderID);
    const currentMoney = userData.money || 0;

    if (isNaN(amount) || amount <= 0) {
      return api.sendMessage("» Vui lòng nhập số tiền hợp lệ!", threadID, messageID);
    }

    if (amount > currentMoney) {
      return api.sendMessage("» Bạn không đủ tiền để rút!", threadID, messageID);
    }

    await Currencies.decreaseMoney(senderID, amount);
    return api.sendMessage(
      `✅ RÚT TIỀN THÀNH CÔNG\n» Số tiền: ${amount}$\n» Số dư còn lại: ${currentMoney - amount}$`,
      threadID, messageID
    );
  }

  // XỬ LÝ ĐẦU TƯ
  if (action === "dautu") {
    const amount = parseInt(args[1]);
    const userData = await Currencies.getData(senderID);
    const currentMoney = userData.money || 0;

    if (isNaN(amount) || amount <= 0) {
      return api.sendMessage("» Vui lòng nhập số tiền đầu tư hợp lệ!", threadID, messageID);
    }

    if (amount > currentMoney) {
      return api.sendMessage("» Bạn không đủ tiền để đầu tư!", threadID, messageID);
    }

    // Trừ tiền
    await Currencies.decreaseMoney(senderID, amount);

    // Gửi thông báo chờ
    const waitMessage = await api.sendMessage(
      `⏳ Đang xử lý đầu tư ${amount}$...\nVui lòng chờ 15-20 giây...`,
      threadID, messageID
    );

    // Random thời gian chờ
    const waitTime = Math.floor(Math.random() * 5000) + 15000;

    // Xử lý bất đồng bộ
    setTimeout(async () => {
      try {
        // Xóa tin nhắn chờ
        api.unsendMessage(waitMessage.messageID);

        // Random kết quả
        const isSuccess = Math.random() >= 0.5;

        if (isSuccess) {
          const winAmount = amount * 2;
          await Currencies.increaseMoney(senderID, winAmount);

          api.sendMessage(
            `🎉 ĐẦU TƯ THÀNH CÔNG!\n\n» Đầu tư: ${amount}$\n» Nhận về: ${winAmount}$\n» Lợi nhuận: +${amount}$`,
            threadID
          );
        } else {
          api.sendMessage(
            `😢 ĐẦU TƯ THẤT BẠI!\n\n» Đầu tư: ${amount}$\n» Kết quả: Mất trắng\n» Hẹn bạn lần sau!`,
            threadID
          );
        }
      } catch (error) {
        console.error(error);
        api.sendMessage("❌ Có lỗi xảy ra, vui lòng thử lại!", threadID);
      }
    }, waitTime);

    return;
  }
};
