// listen.js (fixed)
// Replace your existing modules/listen file with this content

module.exports = function ({ api, models }) {
  const fs = require("fs");
  const path = require("path");
  const moment = require("moment-timezone");
  const axios = require("axios");
  const logger = require("../utils/log.js");

  const Users = require("./controllers/users")({ models, api });
  const Threads = require("./controllers/threads")({ models, api });
  const Currencies = require("./controllers/currencies")({ models });

  //======================= THÔNG BÁO MỖI PHÚT =======================
  setInterval(() => {
    if (global.config.NOTIFICATION) {
      try { require("./handle/handleNotification.js")({ api }); } catch (e) { console.error(e); }
    }
  }, 1000 * 60);

  //======================= KIỂM TRA TƯƠNG TÁC HÀNG NGÀY =======================
  const checkttDataPath = path.join(process.cwd(), "modules", "commands", "tuongtac", "checktt");
  let day = moment.tz("Asia/Ho_Chi_Minh").day();

  setInterval(async () => {
    const day_now = moment.tz("Asia/Ho_Chi_Minh").day();
    const _ADMINIDs = [...(global.config.NDH || []), ...(global.config.ADMINBOT || [])];

    try {
      if (day != day_now) {
        day = day_now;
        let checkttData = [];
        try {
          checkttData = fs.readdirSync(checkttDataPath).filter(file => file.endsWith(".json"));
        } catch (e) {
          // folder missing -> skip
          console.warn("checktt folder not found:", checkttDataPath);
          checkttData = [];
        }

        checkttData = checkttData.filter(file => {
          const _ID = file.replace('.json', '');
          return _ADMINIDs.includes(_ID) || global.data.allThreadID.includes(_ID);
        });

        if (checkttData.length === 0) {
          global.client.sending_top = false;
          return;
        }

        console.log('Bắt đầu kiểm tra tương tác ngày mới');

        await Promise.all(checkttData.map(async checkttFile => {
          const filePath = path.join(checkttDataPath, checkttFile);
          let checktt;
          try {
            checktt = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          } catch (e) {
            console.error("Invalid checktt file:", filePath, e);
            return;
          }

          let storageDay = [];
          for (const item of (checktt.day || [])) {
            const userName = await Users.getNameUser(item.id) || 'Tên không tồn tại';
            storageDay.push({ ...item, name: userName });
          }
          storageDay.sort((a, b) => b.count - a.count);

          let dayMsg = '»𝗧𝗢𝗣 𝗧𝗨̛𝗢̛𝗡𝗚 𝗧𝗔́𝗖 𝗡𝗚𝗔̀𝗬«\n\n';
          dayMsg += storageDay.slice(0, 10).map((item, i) => `${i + 1}. ${item.name} (${item.count})`).join('\n');
          api.sendMessage(dayMsg, checkttFile.replace('.json', ''), err => err && console.log(err));

          (checktt.day || []).forEach(e => e.count = 0);
          checktt.time = day_now;
          try { fs.writeFileSync(filePath, JSON.stringify(checktt, null, 4)); } catch (e) { console.error(e); }

          // Kiểm tra tuần mới
          if (day_now == 1) {
            let storageWeek = [];
            for (const item of (checktt.week || [])) {
              const userName = await Users.getNameUser(item.id) || 'Tên không tồn tại';
              storageWeek.push({ ...item, name: userName });
            }
            storageWeek.sort((a, b) => b.count - a.count);

            let weekMsg = '»𝗧𝗢𝗣 𝗧𝗨𝗢̛𝗡𝗚 𝗧𝗔́𝗖 𝗧𝗨𝗔̂̀𝗡«\n\n';
            weekMsg += storageWeek.slice(0, 10).map((item, i) => `${i + 1}. ${item.name} (${item.count})`).join('\n');
            api.sendMessage(weekMsg, checkttFile.replace('.json', ''), err => err && console.log(err));

            (checktt.week || []).forEach(e => e.count = 0);
            try { fs.writeFileSync(filePath, JSON.stringify(checktt, null, 4)); } catch (e) { console.error(e); }
          }
        }));

        global.client.sending_top = false;
      }
    } catch (e) {
      console.error(e);
    }
  }, 1000 * 10);

  //======================= LOAD DỮ LIỆU =======================
  (async function () {
    try {
      logger(global.getText('listen', 'startLoadEnvironment'), '[ Dữ liệu ]');
      let threads = await Threads.getAll(),
          users = await Users.getAll(['userID', 'name', 'data']),
          currencies = await Currencies.getAll(['userID']);

      for (const data of threads) {
        const idThread = String(data.threadID);
        if (!global.data.allThreadID.includes(idThread)) global.data.allThreadID.push(idThread);
        global.data.threadData.set(idThread, data['data'] || {});
        global.data.threadInfo.set(idThread, data.threadInfo || {});
        if (data['data'] && data['data']['banned'])
          global.data.threadBanned.set(idThread, { reason: data['data']['reason'] || '', dateAdded: data['data']['dateAdded'] || '' });
        if (data['data'] && data['data']['commandBanned'] && data['data']['commandBanned']['length'] != 0)
          global.data.commandBanned.set(idThread, data['data']['commandBanned']);
        if (data['data'] && data['data']['NSFW'] && !global.data.threadAllowNSFW.includes(idThread)) global.data.threadAllowNSFW.push(idThread);
      }
      logger.loader(global.getText('listen', 'loadedEnvironmentThread'));

      for (const dataU of users) {
        const idUsers = String(dataU.userID);
        if (!global.data.allUserID.includes(idUsers)) global.data.allUserID.push(idUsers);
        if (dataU.name && dataU.name.length != 0) global.data.userName.set(idUsers, dataU.name);
        if (dataU.data && dataU.data.banned == 1)
          global.data.userBanned.set(idUsers, { reason: dataU.data.reason || '', dateAdded: dataU.data.dateAdded || '' });
        if (dataU.data && dataU.data.commandBanned && dataU.data.commandBanned.length != 0)
          global.data.commandBanned.set(idUsers, dataU.data.commandBanned);
      }

      for (const dataC of currencies) {
        const idC = String(dataC.userID);
        if (!global.data.allCurrenciesID.includes(idC)) global.data.allCurrenciesID.push(idC);
      }
      logger.loader(global.getText('listen', 'loadedEnvironmentUser'));
      logger(global.getText('listen', 'successLoadEnvironment'), '[ Dữ liệu ]');
    } catch (error) {
      return logger.loader(global.getText('listen', 'failLoadEnvironment', error), 'error');
    }
  })();

  logger(`[ ${global.config.PREFIX} ] • ${(!global.config.BOTNAME) ? "RAN BOT" : global.config.BOTNAME}`, "[ Thông tin Bot ]");

  //======================= REQUIRE HANDLES =======================
  const handleCommand = require("./handle/handleCommand")({ api, models, Users, Threads, Currencies });
  const handleCommandEvent = require("./handle/handleCommandEvent")({ api, models, Users, Threads, Currencies });
  const handleReply = require("./handle/handleReply")({ api, models, Users, Threads, Currencies });
  const handleReaction = require("./handle/handleReaction")({ api, models, Users, Threads, Currencies });
  const handleRefresh = require("./handle/handleRefresh")({ api, Threads, Users, Currencies, models });
  const handleEvent = require("./handle/handleEvent")({ api, models, Users, Threads, Currencies });
  const handleCreateDatabase = require("./handle/handleCreateDatabase")({ api, Threads, Users, Currencies, models });

  //======================= FIX KIỂM TRA THUÊ BOT =======================
  async function checkRentBot(event, api, prefix) {
    try {
      if (
        (event.body || "").startsWith(prefix) &&
        event.senderID != api.getCurrentUserID() &&
        !(global.config.ADMINBOT || []).includes(event.senderID)
      ) {
        const rentFilePath = path.join(__dirname, "../modules/commands/cache/rentbot/rents.json");

        let rentList = [];
        try {
          if (fs.existsSync(rentFilePath)) {
            rentList = JSON.parse(fs.readFileSync(rentFilePath, 'utf8')) || [];
          }
        } catch (err) {
          rentList = [];
        }

        // Lấy tất cả record của thread
        const allRecords = rentList.filter(r => String(r.tid) === String(event.threadID));

        // Nếu chưa thuê bot
        if (allRecords.length === 0 && event.body.trim() !== `${prefix}callad`) {
          return api.shareContact(
            `[  Thông Báo Thuê Bot  ]\n─────────────────\n❌ Nhóm của bạn chưa kích hoạt sử dụng bot.\nVui lòng dùng nhắn thuebot để thuê bot.\n─────────────────`,
            (global.config.ADMINBOT && global.config.ADMINBOT[0]) || null,
            event.threadID
          );
        }

        // Chọn record mới nhất theo exp
        const found = allRecords
          .map(r => {
            const expMs = moment.tz(r.exp, "DD/MM/YYYY", "Asia/Ho_Chi_Minh").endOf("day").valueOf();
            return { ...r, expMs };
          })
          .sort((a, b) => b.expMs - a.expMs)[0];

        if (!found) return;

        // Nếu hết hạn
        if (found.expMs <= Date.now() && event.body.trim() !== `${prefix}callad`) {
          return api.shareContact(
            `[  Thông Báo Thuê Bot  ]\n─────────────────\n❌ Thời hạn thuê bot của nhóm đã hết (${found.exp}).\nDùng nhắn thuebot hoặc giahan để gia hạn sử dụng.\n─────────────────`,
            (global.config.ADMINBOT && global.config.ADMINBOT[0]) || null,
            event.threadID
          );
        }

        // =================== AUTO CLEAN EXPIRED RECORD ===================
        try {
          const cleaned = rentList.filter(r => {
            const expMs = moment.tz(r.exp, "DD/MM/YYYY", "Asia/Ho_Chi_Minh").endOf("day").valueOf();
            return expMs > Date.now();
          });

          if (cleaned.length !== rentList.length) {
            fs.writeFileSync(rentFilePath, JSON.stringify(cleaned, null, 2), 'utf8');
            console.log("🧹 Auto clean rentbot: Đã xoá record hết hạn!");
          }
        } catch (e) {
          console.error("Lỗi khi auto clean rentbot:", e);
        }
      }
    } catch (e) {
      console.error("Error in checkRentBot:", e);
    }
  }

  //======================= MAIN =======================
  return async (event) => {
    const prefix = (global.data.threadData.get(event.threadID) || {}).PREFIX || global.config.PREFIX;

    if (event.type === "message" || event.type === "message_reply") {
      try {
        const chalk = require("chalk");
        const moment = require("moment-timezone");
        const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
        const senderName = global.data.userName.get(event.senderID) || (await Users.getNameUser(event.senderID)) || "Người dùng Facebook";
        const threadName = event.threadID == event.senderID ? "Tin nhắn riêng (Inbox)" : ((global.data.threadInfo.get(event.threadID) || {}).threadName || `Nhóm ID: ${event.threadID}`);
        const content = event.body || (event.attachments && event.attachments.length > 0 ? `[Đính kèm ${event.attachments.length} tệp]` : "[Tin nhắn không có văn bản]");

        console.log(
          chalk.cyan("┏━━━━━━━━━━━━━━━━━━━━ [ TIN NHẮN MỚI ] ━━━━━━━━━━━━━━━━━━━━┓") + "\n" +
          chalk.greenBright(`  [ TÊN NGƯỜI GỬI ] : `) + chalk.whiteBright.bold(senderName) + "\n" +
          chalk.yellowBright(`  [ ID NGƯỜI GỬI  ] : `) + chalk.yellow(event.senderID) + "\n" +
          chalk.magentaBright(`  [ NƠI GỬI       ] : `) + chalk.white(threadName) + (event.threadID != event.senderID ? chalk.gray(` (ID: ${event.threadID})`) : "") + "\n" +
          chalk.blueBright(`  [ THỜI GIAN     ] : `) + chalk.gray(time) + "\n" +
          chalk.redBright(`  [ NỘI DUNG      ] : `) + chalk.whiteBright.bold(content) + "\n" +
          chalk.cyan("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛")
        );
      } catch (e) {}
    }

    await checkRentBot(event, api, prefix);

    handleCreateDatabase({ event });
    handleCommand({ event });
    handleReply({ event });
    handleCommandEvent({ event });
    handleReaction({ event });
    handleRefresh({ event });
    handleEvent({ event });
  };
};
