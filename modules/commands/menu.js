module.exports.config = {
  name: 'menu',
  version: '2.3.0',
  hasPermssion: 0,
  credits: "dtb",
  description: 'Menu đẹp, gọn, dễ nhìn',
  commandCategory: 'Tiện ích',
  usages: '[tên lệnh | all]',
  cooldowns: 5,
  envConfig: {
    autoUnsend: { status: true, timeOut: 90 },
    usePrefix: false
  }
};

const { autoUnsend } = module.exports.config.envConfig;
const { findBestMatch } = require('string-similarity');

module.exports.run = async function ({ api, event, args, permssion }) {
  const { sendMessage, unsendMessage } = api;
  const { threadID, messageID, senderID } = event;
  const cmds = global.client.commands;

  const adminIDs = await getThreadAdminIDs(api, threadID);
  const isGroupAdmin = adminIDs.includes(senderID);

  if (args[0]) {
    if (args[0].toLowerCase() === 'all') {
      return sendAll(sendMessage, threadID, permssion, isGroupAdmin, api);
    }

    const name = args.join(' ').toLowerCase();
    const cmd = cmds.get(name);
    if (cmd && canAccess(cmd.config.hasPermssion, permssion, isGroupAdmin)) {
      return sendMessage(cmdInfo(cmd.config), threadID, messageID);
    }

    const list = [...cmds.keys()].filter(n =>
      canAccess(cmds.get(n).config.hasPermssion, permssion, isGroupAdmin)
    );
    const sim = similar(name, list);
    return sendMessage(
      sim.length
        ? `❓ Không có lệnh **${name}**\n🔎 Có phải bạn muốn:\n${sim.map((v,i)=>` ${i+1}. ${v}`).join('\n')}`
        : `❌ Không tìm thấy lệnh **${name}**`,
      threadID,
      messageID
    );
  }

  const groups = groupCmds(permssion, isGroupAdmin);
  let msg =
`╭━━━━━━━━━━━ ✦ MENU BOT ✦ ━━━━━━━━━━━╮
│ 👤 Người dùng : ${senderID}
│ ⚙️ Tổng lệnh : ${groups.reduce((a,b)=>a+b.commands.length,0)}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`;

  groups.forEach((g, i) => {
    msg += `\n${icon(i)} ${g.name} 〔 ${g.commands.length} 〕`;
  });

  msg += `
────────────────────────
📌 Reply **số thứ tự** để xem lệnh
📚 Gõ **menu all** xem toàn bộ
⏱️ Auto gỡ sau ${autoUnsend.timeOut}s
`;

  sendMessage(msg, threadID, (e, info) => {
    global.client.handleReply.push({
      name: 'menu',
      messageID: info.messageID,
      author: senderID,
      type: 'group',
      data: groups,
      permssion,
      isGroupAdmin
    });
    if (autoUnsend.status)
      setTimeout(() => unsendMessage(info.messageID), autoUnsend.timeOut * 1000);
  });
};

module.exports.handleReply = async function ({ handleReply, api, event }) {
  const { sendMessage, unsendMessage } = api;
  if (event.senderID != handleReply.author)
    return sendMessage('🚫 Không phải menu của bạn', event.threadID);

  if (handleReply.type === 'group') {
    const g = handleReply.data[event.args[0] - 1];
    if (!g) return sendMessage('❌ Số không hợp lệ', event.threadID);

    unsendMessage(handleReply.messageID);

    let msg =
`╭━━━━━━ 📂 ${g.name.toUpperCase()} 📂 ━━━━━━╮
`;

    g.commands.forEach((c,i)=>{
      msg += `│ ${String(i+1).padStart(2,'0')} • ${c}\n`;
    });

    msg += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
📌 Reply số để xem chi tiết`;

    sendMessage(msg, event.threadID);
  }
};

/* ================== HÀM PHỤ ================== */

function cmdInfo(c) {
  return `
╭━━━━━━ ℹ️ ${c.name.toUpperCase()} ℹ️ ━━━━━━╮
│ 🧠 Mô tả   : ${c.description}
│ 👤 Quyền  : ${permTxt(c.hasPermssion)}
│ 🧩 Nhóm   : ${c.commandCategory}
│ 📌 Dùng   : ${c.usages}
│ ⏱️ Cool   : ${c.cooldowns}s
│ ✍️ Tác giả: ${c.credits}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
}

function groupCmds(p, isAdmin) {
  const map = {};
  for (const [n,c] of global.client.commands) {
    if (!canAccess(c.config.hasPermssion, p, isAdmin)) continue;
    const k = c.config.commandCategory || 'Khác';
    if (!map[k]) map[k] = [];
    map[k].push(n);
  }
  return Object.keys(map).map(k=>({name:k,commands:map[k]}));
}

function icon(i){
  return ['🌟','⚙️','🎮','📌','🛠️','🔐','🎵','📥'][i%8];
}

function permTxt(p){
  return ['Member','Admin nhóm','Bot Admin','ADMINBOT'][p] || 'Unknown';
}

function similar(input, list){
  return findBestMatch(input, list).ratings
    .filter(r=>r.rating>0.3)
    .slice(0,3)
    .map(r=>r.target);
}

async function getThreadAdminIDs(api, tid){
  try{
    return (await api.getThreadInfo(tid)).adminIDs.map(e=>e.id);
  }catch{ return []; }
}

function canAccess(cmdP, userP, isGroupAdmin){
  if (userP === 3) return true;
  if (userP === 2) return cmdP <= 2;
  if (isGroupAdmin) return cmdP <= 1;
  return cmdP === 0;
}

function sendAll(send, tid, p, isAdmin, api){
  let msg = '╭━━━ 📚 ALL COMMANDS 📚 ━━━╮\n';
  [...global.client.commands.values()]
    .filter(c=>canAccess(c.config.hasPermssion,p,isAdmin))
    .forEach((c,i)=>msg+=`│ ${i+1}. ${c.config.name}\n`);
  msg+='╰━━━━━━━━━━━━━━━━━━━━━━╯';
  send(msg, tid);
}
