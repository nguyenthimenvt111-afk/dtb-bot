const fs = require('fs');
const path = require('path');
const Threads = global.Threads; 
const databanuserFolderPath = path.join(__dirname, '../../modules/commands/cache/data/databanuser');
if (!fs.existsSync(databanuserFolderPath)) {
  fs.mkdirSync(databanuserFolderPath, { recursive: true });
}
async function createIfNotExist(filePath) {
  if (!fs.existsSync(filePath)) {
    await fs.promises.writeFile(filePath, JSON.stringify([]), 'utf8');
  }
}
async function initialize() {
  const allThreads = await Threads.getAll(); 
  allThreads.forEach(async (thread) => {
    const threadFilePath = path.join(databanuserFolderPath, `${thread.threadID}.json`);
    await createIfNotExist(threadFilePath);
  });
}
initialize();

module.exports.config = {
  name: "autokick",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "dtb",
  description: "Tự động kick người dùng theo ID.",
  commandCategory: "Quản Lí Box",
  usages: "[ID người dùng]",
  cooldowns: 5,
  dependencies: {
    "fs-extra": ""
  }
};
module.exports.run = async ({ event, api, args }) => {
  const threadID = event.threadID;
  if (args.length === 0) {
    return api.sendMessage('[𝐂𝐚́𝐜𝐡 𝐬𝐮̛̉ 𝐝𝐮̣𝐧𝐠]\n' +
                           '- 𝐓𝐡𝐞̂𝐦 𝐈𝐃 𝐯𝐚̀𝐨 𝐝𝐚𝐧𝐡 𝐬𝐚́𝐜𝐡 𝐜𝐚̂́𝐦: #𝐚𝐮𝐭𝐨𝐤𝐢𝐜𝐤 𝐚𝐝𝐝 <𝐈𝐃𝟏>|<𝐈𝐃𝟐>|...\n' +
                           '- 𝐗𝐨́𝐚 𝐈𝐃 𝐤𝐡𝐨̉𝐢 𝐝𝐚𝐧𝐡 𝐬𝐚́𝐜𝐡 𝐜𝐚̂́𝐦: #𝐚𝐮𝐭𝐨𝐤𝐢𝐜𝐤 𝐫𝐞𝐦𝐨𝐯𝐞 <𝐈𝐃𝟏>|<𝐈𝐃𝟐>|...\n' +
                           '- 𝐋𝐢𝐞̣̂𝐭 𝐤𝐞̂ 𝐝𝐚𝐧𝐡 𝐬𝐚́𝐜𝐡 𝐜𝐚̂́𝐦: #𝐚𝐮𝐭𝐨𝐤𝐢𝐜𝐤 𝐥𝐢𝐬𝐭', threadID);
  }
  const threadFilePath = path.join(databanuserFolderPath, `${threadID}.json`);
  await createIfNotExist(threadFilePath);
  let data = JSON.parse(await fs.promises.readFile(threadFilePath));
  const action = args[0];
  switch (action) {
    case "add": {
      args.shift();
      const userIDsToAdd = args.join(" ").split('|').map(id => id.trim());
      const addedIDs = []; 
      const addedInfos = []; 
      for (const userID of userIDsToAdd) {
        if (!data.includes(userID)) {
          data.push(userID);
          addedIDs.push(userID); 
          try {
            const userInfo = await api.getUserInfo(userID);
            const userName = userInfo[userID] ? userInfo[userID].name : "𝐊𝐡𝐨̂𝐧𝐠 𝐓𝐢̀𝐦 𝐓𝐡𝐚̂́𝐲";
            addedInfos.push(`${userName} (ID: ${userID})\n`);
          } catch (error) {
            console.error(`𝐊𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐥𝐚̂́𝐲 𝐭𝐡𝐨̂𝐧𝐠 𝐭𝐢𝐧 𝐜𝐮̉𝐚 𝐈𝐃: ${userID}`, error);
            addedInfos.push(`𝐋𝐨̂̃𝐢 𝐊𝐡𝐢 𝐋𝐚̂́𝐲 𝐓𝐡𝐨̂𝐧𝐠 𝐓𝐢𝐧 (𝐈𝐃: ${userID})`);
          }
        }
      }
      await fs.promises.writeFile(threadFilePath, JSON.stringify(data, null, 2));
      if (addedIDs.length > 0) {
        api.sendMessage(`𝐃𝐚̃ 𝐭𝐡𝐞̂𝐦 𝐯𝐚̀𝐨 𝐝𝐚𝐧𝐡 𝐬𝐚́𝐜𝐡 𝐜𝐚̂́𝐦:\n\n ${addedInfos.join(', ')}.`, threadID);
      } else {
        api.sendMessage(`𝐊𝐡𝐨̂𝐧𝐠 𝐜𝐨́ 𝐈𝐃 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐝𝐮̀𝐧𝐠 𝐦𝐨̛́𝐢 𝐧𝐚̀𝐨 𝐝𝐮̛𝐨̛̣𝐜 𝐭𝐡𝐞̂𝐦 𝐯𝐚̀𝐨.`, threadID);
      }
      break;
    }
    case "remove": {
      args.shift();
      const userIDsToRemove = args.join(" ").split('|').map(id => id.trim());
      const removedIDs = [];
      data = data.filter(userID => {
        if (!userIDsToRemove.includes(userID)) {
          return true;
        } else {
          removedIDs.push(userID);
          return false;
        }
      });
      await fs.promises.writeFile(threadFilePath, JSON.stringify(data, null, 2));
      api.sendMessage(`𝐃𝐚̃ 𝐱𝐨́𝐚 𝐤𝐡𝐨̉𝐢 𝐝𝐚𝐧𝐡 𝐬𝐚́𝐜𝐡 𝐜𝐚̂́𝐦: ${removedIDs.join(', ')}.`, threadID);
      break;
    }
    case "list": {
      const bannedIDs = JSON.parse(await fs.promises.readFile(threadFilePath));
      const userInfoPromises = bannedIDs.map(async userID => {
        try {
          const userInfo = await api.getUserInfo(userID);
          return userInfo[userID] ? userInfo[userID].name : "𝐊𝐡𝐨̂𝐧𝐠 𝐓𝐢̀𝐦 𝐓𝐡𝐚̂́𝐲";
        } catch (error) {
          console.error(`𝐊𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐥𝐚̂́𝐲 𝐭𝐡𝐨̂𝐧𝐠 𝐭𝐢𝐧 𝐜𝐮̉𝐚 𝐈𝐃: ${userID}`, error);
          return "𝐋𝐨̂̃𝐢 𝐊𝐡𝐢 𝐋𝐚̂́𝐲 𝐓𝐡𝐨̂𝐧𝐠 𝐓𝐢𝐧";
        }
      });
      const userInfos = await Promise.all(userInfoPromises);
      let listMessage = '𝐃𝐚𝐧𝐡 𝐬𝐚́𝐜𝐡 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐝𝐮̀𝐧𝐠 𝐛𝐢̣ 𝐜𝐚̂́𝐦:\n';
      if (userInfos.length === 0) {
        listMessage += '𝐇𝐢𝐞̣̂𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐜𝐨́ 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐝𝐮̀𝐧𝐠 𝐧𝐚̀𝐨 𝐭𝐫𝐨𝐧𝐠 𝐝𝐚𝐧𝐡 𝐬𝐚́𝐜𝐡 𝐜𝐚̂́𝐦.';
      } else {
        listMessage += userInfos.map((name, index) => `${index + 1}. ${name} (ID: ${bannedIDs[index]})`).join('\n');
      }
      api.sendMessage(listMessage, threadID);
      break;
    }
    default: {
      return api.sendMessage('𝐋𝐞̣̂𝐧𝐡 𝐬𝐚𝐢! 𝐬𝐮̛̉ 𝐬𝐮̣𝐧𝐠 #𝐚𝐮𝐭𝐨𝐤𝐢𝐜𝐤 𝐝𝐞̂̉ 𝐱𝐞𝐦 𝐜𝐚́𝐜𝐡 𝐬𝐮̛̉ 𝐝𝐮̣𝐧𝐠.', threadID);
    }
  }
};
module.exports.handleEvent = async ({ api, event }) => {
  const { senderID, threadID } = event;
  const threadFilePath = path.join(databanuserFolderPath, `${threadID}.json`);
  await createIfNotExist(threadFilePath);
  const bannedUsers = JSON.parse(await fs.promises.readFile(threadFilePath, 'utf8'));
  if (bannedUsers.includes(senderID)) {
    await api.removeUserFromGroup(senderID, threadID).catch(console.error);
    api.sendMessage(`𝐃𝐚̃ 𝐭𝐮̛̣ 𝐝𝐨̣̂𝐧𝐠 𝐤𝐢𝐜𝐤 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐝𝐮̀𝐧𝐠 𝐜𝐨́ 𝐈𝐃: ${senderID} 𝐯𝐢̀ 𝐧𝐚̆̀𝐦 𝐭𝐫𝐨𝐧𝐠 𝐝𝐚𝐧𝐡 𝐬𝐚́𝐜𝐡 𝐜𝐚̂́𝐦.`, threadID);
  }
};