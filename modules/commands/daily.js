module.exports.config = {
  name: "daily",
  version: "2.0.0",
  hasPermssion: 0,
  hasPermission: 0,
  credits: "dtb",
  description: "Điểm danh hàng ngày nhận 500$ coin miễn phí!",
  commandCategory: "Tiện ích",
  usages: "daily",
  cooldowns: 5,
  envConfig: {
    cooldownTime: 43200000, // 12 tiếng
    rewardCoin: 500
  }
};

module.exports.run = async ({ event, api, Currencies }) => {
  const { daily } = global.configModule || { daily: module.exports.config.envConfig };
  const cooldownTime = daily.cooldownTime || 43200000;
  const rewardCoin = daily.rewardCoin || 500;
  const { senderID, threadID, messageID } = event;

  const userCur = (await Currencies.getData(senderID)) || {};
  let data = userCur.data || {};

  const lastDaily = data.dailyCoolDown || 0;
  const timeDiff = cooldownTime - (Date.now() - lastDaily);

  if (timeDiff > 0) {
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
    const seconds = Math.floor((timeDiff / 1000) % 60);

    return api.sendMessage(
      `⏳ [ ĐIỂM DANH HÀNG NGÀY ]\n` +
      `Bạn đã nhận phần thưởng hôm nay rồi!\n` +
      `Vui lòng quay lại sau: ${hours} giờ ${minutes} phút ${seconds < 10 ? "0" + seconds : seconds} giây nữa nhé!`,
      threadID,
      messageID
    );
  }

  await Currencies.increaseMoney(senderID, rewardCoin);
  data.dailyCoolDown = Date.now();
  await Currencies.setData(senderID, { data });

  return api.sendMessage(
    `🎉 [ ĐIỂM DANH THÀNH CÔNG ]\n` +
    `Bạn vừa nhận được +${rewardCoin}$ vào ví cá nhân!\n` +
    `Hãy chăm chỉ điểm danh mỗi ngày để tích lũy tài sản nhé!`,
    threadID,
    messageID
  );
};
