module.exports.config = {
  name: "cmd",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "dtb",
  description: "Quản lý/Kiểm soát toàn bộ module của bot",
  commandCategory: "Hệ Thống",
  usages: "[load/unload/loadAll/unloadAll/info] [tên module]",
  cooldowns: 5,
  dependencies: {
      "fs-extra": "",
      "child_process": "",
      "path": ""
  }
};

const loadCommand = function ({ moduleList, threadID, messageID }) {

  const { execSync } = global.nodemodule['child_process'];
  const { writeFileSync, unlinkSync, readFileSync } = global.nodemodule['fs-extra'];
  const { join } = global.nodemodule['path'];
  const { configPath, mainPath, api } = global.client;
  const logger = require(mainPath + '/utils/log');

  var errorList = [];
  delete require['resolve'][require['resolve'](configPath)];
  var configValue = require(configPath);
  writeFileSync(configPath + '.temp', JSON.stringify(configValue, null, 2), 'utf8');
  for (const nameModule of moduleList) {
      try {
          const dirModule = __dirname + '/' + nameModule + '.js';
          delete require['cache'][require['resolve'](dirModule)];
          const command = require(dirModule);
          global.client.commands.delete(nameModule);
          if (!command.config || !command.run || !command.config.commandCategory) 
              throw new Error('𝐌𝐨𝐝𝐮𝐥𝐞 𝐤𝐡𝐨̂𝐧𝐠 𝐝𝐮́𝐧𝐠 𝐝𝐢̣𝐧𝐡 𝐝𝐚̣𝐧𝐠!');
          global.client['eventRegistered'] = global.client['eventRegistered']['filter'](info => info != command.config.name);
          if (command.config.dependencies && typeof command.config.dependencies == 'object') {
              const listPackage = JSON.parse(readFileSync('./package.json')).dependencies,
                  listbuiltinModules = require('module')['builtinModules'];
              for (const packageName in command.config.dependencies) {
                  var tryLoadCount = 0,
                      loadSuccess = ![],
                      error;
                  const moduleDir = join(global.client.mainPath, 'nodemodules', 'node_modules', packageName);
                  try {
                      if (listPackage.hasOwnProperty(packageName) || listbuiltinModules.includes(packageName)) global.nodemodule[packageName] = require(packageName);
                      else global.nodemodule[packageName] = require(moduleDir);
                  } catch {
                      logger.loader('𝐊𝐡𝐨̂𝐧𝐠 𝐭𝐢̀𝐦 𝐭𝐡𝐚̂́𝐲 𝐏𝐚𝐜𝐤𝐚𝐠𝐞 ' + packageName + ' 𝐡𝐨̂̃ 𝐭𝐫𝐨̛̣ 𝐜𝐡𝐨 𝐥𝐞̣̂𝐧𝐡 ' + command.config.name+ '𝐭𝐢𝐞̂́𝐧 𝐡𝐚̀𝐧𝐡 𝐜𝐚̀𝐢 𝐝𝐚̣̆𝐭...', 'warn');
                      const insPack = {};
                      insPack.stdio = 'inherit';
                      insPack.env = process.env ;
                      insPack.shell = !![];
                      insPack.cwd = join(global.client.mainPath,'nodemodules')
                      execSync('npm --package-lock false --save install ' + packageName + (command.config.dependencies[packageName] == '*' || command.config.dependencies[packageName] == '' ? '' : '@' + command.config.dependencies[packageName]), insPack);
                      for (tryLoadCount = 1; tryLoadCount <= 3; tryLoadCount++) {
                          require['cache'] = {};
                          try {
                              if (listPackage.hasOwnProperty(packageName) || listbuiltinModules.includes(packageName)) global.nodemodule[packageName] = require(packageName);
                              else global.nodemodule[packageName] = require(moduleDir);
                              loadSuccess = !![];
                              break;
                          } catch (erorr) {
                              error = erorr;
                          }
                          if (loadSuccess || !error) break;
                      }
                      if (!loadSuccess || error) throw '𝐊𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐭𝐚̉𝐢 𝐏𝐚𝐜𝐤𝐚𝐠𝐞 ' + packageName + (' 𝐜𝐡𝐨 𝐥𝐞̣̂𝐧𝐡 ') + command.config.name +', 𝐄𝐫𝐫𝐨𝐫: ' + error + ' ' + error['stack'];
                  }
              }
              logger.loader(' 𝐃𝐚̃ 𝐭𝐚̉𝐢 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 𝐭𝐨𝐚̀𝐧 𝐛𝐨̣̂ 𝐏𝐚𝐜𝐤𝐚𝐠𝐞 𝐜𝐡𝐨 𝐥𝐞̣̂𝐧𝐡' + command.config.name);
          }
          if (command.config.envConfig && typeof command.config.envConfig == 'Object') try {
              for (const [key, value] of Object['entries'](command.config.envConfig)) {
                  if (typeof global.configModule[command.config.name] == undefined) 
                      global.configModule[command.config.name] = {};
                  if (typeof configValue[command.config.name] == undefined) 
                      configValue[command.config.name] = {};
                  if (typeof configValue[command.config.name][key] !== undefined) 
                      global.configModule[command.config.name][key] = configValue[command.config.name][key];
                  else global.configModule[command.config.name][key] = value || '';
                  if (typeof configValue[command.config.name][key] == undefined) 
                      configValue[command.config.name][key] = value || '';
              }
              logger.loader('Loaded config' + ' ' + command.config.name);
          } catch (error) {
              throw new Error('» 𝐊𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐭𝐚̉𝐢 𝐜𝐨𝐧𝐟𝐢𝐠 𝐜𝐡𝐨 𝐦𝐨𝐝𝐮𝐥𝐞, 𝐄𝐫𝐫𝐨𝐫: ' + JSON.stringify(error));
          }
          if (command['onLoad']) try {
              const onLoads = {};
              onLoads['configValue'] = configValue;
              command['onLoad'](onLoads);
          } catch (error) {
              throw new Error('» 𝐊𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐎𝐧𝐥𝐨𝐚𝐝 𝐦𝐨𝐝𝐮𝐥𝐞, 𝐄𝐫𝐫𝐨𝐫: ' + JSON.stringify(error), 'error');
          }
          if (command.handleEvent) global.client.eventRegistered.push(command.config.name);
          (global.config.commandDisabled.includes(nameModule + '.js') || configValue.commandDisabled.includes(nameModule + '.js')) 
          && (configValue.commandDisabled.splice(configValue.commandDisabled.indexOf(nameModule + '.js'), 1),
          global.config.commandDisabled.splice(global.config.commandDisabled.indexOf(nameModule + '.js'), 1))
          global.client.commands.set(command.config.name, command)
          logger.loader('Loaded command ' + command.config.name + '!');
      } catch (error) {
          errorList.push('- ' + nameModule + ' reason:' + error + ' at ' + error['stack']);
      };
  }
  if (errorList.length != 0) api.sendMessage('» 𝐍𝐡𝐮̛̃𝐧𝐠 𝐥𝐞̣̂𝐧𝐡 𝐛𝐢̣ 𝐥𝐨̂̃𝐢 𝐤𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐭𝐚̉𝐢 ' + errorList.join(' '), threadID, messageID);
  api.sendMessage('» 𝐕𝐮̛̀𝐚 𝐭𝐚̉𝐢 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 ' + (moduleList.length - errorList.length) + ' 𝐥𝐞̣̂𝐧𝐡 💕', threadID, messageID) 
  writeFileSync(configPath, JSON.stringify(configValue, null, 4), 'utf8')
  unlinkSync(configPath + '.temp');
  return;
}

const unloadModule = function ({ moduleList, threadID, messageID }) {
  const { writeFileSync, unlinkSync } = global.nodemodule["fs-extra"];
  const { configPath, mainPath, api } = global.client;
  const logger = require(mainPath + "/utils/log").loader;

  delete require.cache[require.resolve(configPath)];
  var configValue = require(configPath);
  writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 4), 'utf8');

  for (const nameModule of moduleList) {
      global.client.commands.delete(nameModule);
      global.client.eventRegistered = global.client.eventRegistered.filter(item => item !== nameModule);
      configValue["commandDisabled"].push(`${nameModule}.js`);
      global.config["commandDisabled"].push(`${nameModule}.js`);
      logger(`Unloaded command ${nameModule}!`);
  }

  writeFileSync(configPath, JSON.stringify(configValue, null, 4), 'utf8');
  unlinkSync(configPath + ".temp");

  return api.sendMessage(`» 𝐓𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 𝐡𝐮̉𝐲 ${moduleList.length} 𝐥𝐞̣̂𝐧𝐡 ✨`, threadID, messageID);
}

module.exports.run = function ({ event, args, api }) {

  if (event.senderID != 100040472494187) return api.sendMessage(`» 𝐁𝐚̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐜𝐨́ 𝐪𝐮𝐲𝐞̂̀𝐧`, event.threadID, event.messageID)

  const { readdirSync } = global.nodemodule["fs-extra"];
  const { threadID, messageID } = event;

  var moduleList = args.splice(1, args.length);

  switch (args[0]) {
    case "count": {
    let commands = client.commands.values();
    let infoCommand = "";
    api.sendMessage("» 𝐇𝐢𝐞𝐧 𝐭𝐚𝐢 𝐜𝐨 " + client.commands.size + " 𝐋𝐞̣̂𝐧𝐡 𝐜𝐨́ 𝐭𝐡𝐞̂̉ 𝐬𝐮̛̉ 𝐝𝐮̣𝐧𝐠 💌"+ infoCommand, event.threadID, event.messageID);
    break;
  }
      case "load": {
          if (moduleList.length == 0) return api.sendMessage("» 𝐓𝐞̂𝐧 𝐦𝐨𝐝𝐮𝐥𝐞 𝐤𝐡𝐨̂𝐧𝐠 𝐝𝐮̛𝐨̛̣𝐜 𝐩𝐡𝐞́𝐩 𝐛𝐢̣ 𝐭𝐫𝐮̀𝐧𝐠 ⚠️", threadID, messageID);
          else return loadCommand({ moduleList, threadID, messageID });
      }
      case "unload": {
          if (moduleList.length == 0) return api.sendMessage("» 𝐓𝐞̂𝐧 𝐦𝐨𝐝𝐮𝐥𝐞 𝐤𝐡𝐨̂𝐧𝐠 𝐝𝐮̛𝐨̛̣𝐜 𝐩𝐡𝐞́𝐩 𝐛𝐢̣ 𝐭𝐫𝐮̀𝐧𝐠 ⚠️", threadID, messageID);
          else return unloadModule({ moduleList, threadID, messageID });
      }
      case "loadAll": {
          moduleList = readdirSync(__dirname).filter((file) => file.endsWith(".js") && !file.includes('example'));
          moduleList = moduleList.map(item => item.replace(/\.js/g, ""));
          return loadCommand({ moduleList, threadID, messageID });
      }
      case "unloadAll": {
          moduleList = readdirSync(__dirname).filter((file) => file.endsWith(".js") && !file.includes('example') && !file.includes("command"));
          moduleList = moduleList.map(item => item.replace(/\.js/g, ""));
          return unloadModule({ moduleList, threadID, messageID });
      }
      case "info": {
          const command = global.client.commands.get(moduleList.join("") || "");

          if (!command) return api.sendMessage("» 𝐌𝐨𝐝𝐮𝐥𝐞 𝐛𝐚̣𝐧 𝐧𝐡𝐚̣̂𝐩 𝐤𝐡𝐨̂𝐧𝐠 𝐭𝐨̂̀𝐧 𝐭𝐚̣𝐢 ⚠️", threadID, messageID);

          const { name, version, hasPermssion, credits, cooldowns, dependencies } = command.config;

          return api.sendMessage(
              "=== " + name.toUpperCase() + " ===\n" +
              "- Được code bởi: " + credits + "\n" +
              "- Phiên bản: " + version + "\n" +
              "- Yêu cầu quyền hạn: " + ((hasPermssion == 0) ? "Người dùng" : (hasPermssion == 1) ? "Quản trị viên" : "Người vận hành bot" ) + "\n" +
              "- Thời gian chờ: " + cooldowns + " giây(s)\n" +
              `- Các package yêu cầu: ${(Object.keys(dependencies || {})).join(", ") || "Không có"}`,
              threadID, messageID
          );
      }
      default: {
          return global.utils.throwError(this.config.name, threadID, messageID);
      }
  }
                                     }
