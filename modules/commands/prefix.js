module.exports.config = {
  name: "prefix",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "dtb",
  description: "Xem prefix của BOT",
  commandCategory: "Tiện ích",
  usages: "",
  cooldowns: 5,
};

module.exports.handleEvent = async ({ event, api, Threads }) => {
  var { threadID, messageID, body } = event;
  // verified

  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const dataThread = await Threads.getData(threadID);
  const data = dataThread.data; 
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  const arr = ["mpre","mprefix","prefix","dấu lệnh","prefix của bot là gì","daulenh","dùng sao"];
  for (let i of arr) {
    const cap = i[0].toUpperCase() + i.slice(1);
    if (body === i || body === i.toUpperCase() || body === cap) {
      if (!data.PREFIX)
        return api.sendMessage(
`┏━『 PREFIX HIỆN TẠI 』━┓
→ Nhóm chưa xét prefix riêng
→ Đang dùng mặc định: ${prefix}

Dùng:  setprefix <prefix_mới>
Hoặc:  setprefix reset  (để về mặc định)
┗━━━━━━━━━━━━━━━━━━━┛`, threadID, messageID);

      return api.sendMessage(
`┏━『 PREFIX HIỆN TẠI 』━┓
→ Prefix nhóm: ${data.PREFIX}
→ Prefix mặc định: ${prefix}

Dùng:  setprefix <prefix_mới>
Hoặc:  setprefix reset  (để về mặc định)
┗━━━━━━━━━━━━━━━━━━━┛`, threadID, messageID);
    }
  }
};

module.exports.run = async ({ event, api }) => {
  return api.sendMessage(
`┏━━━━━━━━━━━━━━━━┓
  ( •_• )  ꜱᴇʀᴠᴇʀ ᴏᴘᴇɴ
  Bạn muốn xem prefix BOT không?
  → Chỉ cần nhắn:  prefix
┗━━━━━━━━━━━━━━━━┛`, event.threadID);
};
