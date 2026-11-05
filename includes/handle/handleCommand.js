module.exports = function ({ api, models, Users, Threads, Currencies }) {
   const stringSimilarity = require('string-similarity');
   const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
   const logger = require("../../utils/log.js");
   const axios = require('axios');
   const moment = require("moment-timezone");
   return async function ({ event }) {
    const dateNow = Date.now();
    const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
    const times = process.uptime(), hours = Math.floor(times / (60 * 60)), minutes = Math.floor((times % (60 * 60)) / 60), seconds = Math.floor(times % 60);
    const { allowInbox, PREFIX, ADMINBOT, NDH, DeveloperMode, adminOnly, keyAdminOnly, ndhOnly, adminPaseOnly } = global.config;
    const { userBanned, threadBanned, threadInfo, threadData, commandBanned } = global.data;
    const { commands, cooldowns } = global.client;
    var { body, senderID, threadID, messageID } = event;
    senderID = String(senderID);
    threadID = String(threadID);
    const threadSetting = threadData.get(threadID) || {};
    const prefixRegex = new RegExp(`^(<@!?${senderID}>|${escapeRegex((threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : PREFIX)})\\s*`);
    if (!prefixRegex.test(body)) return;
    const adminbot = global.config || require('./../../config.json');

    if (!global.data.allThreadID.includes(threadID) && !ADMINBOT.includes(senderID) && adminbot.adminPaseOnly == true) {
      return api.sendMessage("➜ Chỉ Admin Bot mới được dùng bot trong tin nhắn riêng!", threadID, messageID);
    }
    if (!ADMINBOT.includes(senderID) && adminbot.adminOnly == true) {
      return api.sendMessage("➜ Hiện đang bật chế độ chỉ Admin Bot mới sử dụng được bot!", threadID, messageID);
    }
    if (!NDH.includes(senderID) && !ADMINBOT.includes(senderID) && adminbot.ndhOnly == true) { 
      return api.sendMessage("➜ Hiện đang bật chế độ chỉ Support/Admin Bot mới sử dụng được bot!", threadID, messageID);
    }

    let dataAdbox = {};
    try {
      const dataAdboxPath = require('path').resolve(__dirname, '../../modules/commands/cache/data.json');
      if (require('fs').existsSync(dataAdboxPath)) {
        dataAdbox = require(dataAdboxPath);
      }
    } catch (_) {}

    var threadInf = (threadInfo.get(threadID) || await Threads.getInfo(threadID)) || {};
    const findd = (threadInf && Array.isArray(threadInf.adminIDs)) ? threadInf.adminIDs.find(el => String(el.id) === String(senderID)) : null;
    if (event.isGroup == true && dataAdbox && dataAdbox.adminbox && dataAdbox.adminbox[threadID] == true && !ADMINBOT.includes(senderID) && !findd && !NDH.includes(senderID)) {
      return api.sendMessage("➜ Nhóm này đang bật chế độ chỉ Quản trị viên nhóm mới dùng được bot!", event.threadID, event.messageID);
    }

    if (userBanned.has(senderID) || threadBanned.has(threadID) || (allowInbox === false && senderID == threadID)) {
      if (!ADMINBOT.includes(senderID.toString()) && !NDH.includes(senderID.toString())) {
        if (userBanned.has(senderID)) {
          const { reason, dateAdded } = userBanned.get(senderID) || {};
          return api.sendMessage(global.getText("handleCommand", "userBanned", reason, dateAdded), threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }, messageID);
        } else {
          if (threadBanned.has(threadID)) {
            const { reason, dateAdded } = threadBanned.get(threadID) || {};
            return api.sendMessage(global.getText("handleCommand", "threadBanned", reason, dateAdded), threadID, async (err, info) => {
              await new Promise(resolve => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            }, messageID);
          }
        }
      }
    }

    const [matchedPrefix] = body.match(prefixRegex);
    const args = body.slice(matchedPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    var command = commands.get(commandName);

    if (!command) {
      var allCommandName = [];
      const commandValues = commands.keys();
      for (const cmd of commandValues) allCommandName.push(cmd);
      const checker = stringSimilarity.findBestMatch(commandName, allCommandName);
      if (checker.bestMatch.rating >= 0.5) {
        command = client.commands.get(checker.bestMatch.target);
      } else { 
        return api.sendMessage(
          global.getText("handleCommand", "commandNotExist", checker.bestMatch.target),
          event.threadID,
          event.messageID
        );
      }
    }

    if (commandBanned.get(threadID) || commandBanned.get(senderID)) {
      if (!ADMINBOT.includes(senderID)) {
        const banThreads = commandBanned.get(threadID) || [],
          banUsers = commandBanned.get(senderID) || [];
        if (banThreads.includes(command.config.name))
          return api.sendMessage(global.getText("handleCommand", "commandThreadBanned", command.config.name), threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }, messageID);
        if (banUsers.includes(command.config.name))
          return api.sendMessage(global.getText("handleCommand", "commandUserBanned", command.config.name), threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }, messageID);
      }
    }

    if (command.config.commandCategory && command.config.commandCategory.toLowerCase() == 'nsfw' && !global.data.threadAllowNSFW.includes(threadID) && !ADMINBOT.includes(senderID)) {
      return api.sendMessage(global.getText("handleCommand", "threadNotAllowNSFW"), threadID, async (err, info) => {
        await new Promise(resolve => setTimeout(resolve, 5 * 1000));
        return api.unsendMessage(info.messageID);
      }, messageID);
    }

    var permssion = 0;
    var threadInfoo = (threadInfo.get(threadID) || await Threads.getInfo(threadID)) || {};
    const find = (threadInfoo && Array.isArray(threadInfoo.adminIDs)) ? threadInfoo.adminIDs.find(el => String(el.id) === String(senderID)) : null;

    if (ADMINBOT.includes(senderID.toString())) permssion = 3;
    else if (NDH.includes(senderID.toString())) permssion = 2;
    else if (!ADMINBOT.includes(senderID) && find) permssion = 1;

    // Check both hasPermssion and hasPermission safely
    const requiredPerm = command.config.hasPermssion !== undefined 
      ? command.config.hasPermssion 
      : (command.config.hasPermission !== undefined ? command.config.hasPermission : 0);

    var quyenhan = "";
    if (requiredPerm == 1) {
      quyenhan = "Quản Trị Viên Nhóm";
    } else if (requiredPerm == 2) {
      quyenhan = "SUPPORTBOT";
    } else if (requiredPerm >= 3) {
      quyenhan = "ADMINBOT";
    } 

    if (requiredPerm > permssion) {
      return api.sendMessage(`⚠️ Lệnh "${command.config.name}" yêu cầu quyền hạn: ${quyenhan}`, event.threadID, event.messageID);
    }

    if (!client.cooldowns.has(command.config.name)) client.cooldowns.set(command.config.name, new Map());
    const timestamps = client.cooldowns.get(command.config.name);
    const expirationTime = (command.config.cooldowns || 1) * 1000;
    if (timestamps.has(senderID) && dateNow < timestamps.get(senderID) + expirationTime) {
      return api.setMessageReaction('😼', event.messageID, err => (err) ? logger('Đã có lỗi xảy ra khi thực thi setMessageReaction', 2) : '', !![]);
    }

    var getText2;
    if (command.languages && typeof command.languages == 'object' && command.languages.hasOwnProperty(global.config.language)) {
      getText2 = (...values) => {
        var lang = command.languages[global.config.language][values[0]] || '';
        for (var i = values.length; i > 0; i--) {
          const expReg = RegExp('%' + i, 'g');
          lang = lang.replace(expReg, values[i]);
        }
        return lang;
      };
    } else {
      getText2 = () => { };
    }

    try {
      const Obj = {
        api,
        event,
        args,
        models,
        Users,
        Threads,
        Currencies,
        permssion,
        getText: getText2
      };
      command.run(Obj);
      timestamps.set(senderID, dateNow);
      if (DeveloperMode == true) {
        logger(global.getText("handleCommand", "executeCommand", time, commandName, senderID, threadID, args.join(" "), (Date.now()) - dateNow), "[ DEV MODE ]");
      }
      return;
    } catch (e) {
      return api.sendMessage(global.getText("handleCommand", "commandError", commandName, e), threadID);
    }
  };
};
