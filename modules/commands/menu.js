module.exports.config = {
  name: 'menu',
  version: '3.0.0',
  hasPermssion: 0,
  hasPermission: 0,
  credits: "dtb",
  description: 'Menu lệnh phân loại trực quan, hỗ trợ xem nhanh danh sách minigame giải trí',
  commandCategory: 'Tiện ích',
  usages: '[tên lệnh | game | all]',
  cooldowns: 5,
  envConfig: {
    autoUnsend: { status: true, timeOut: 90 },
    usePrefix: false
  }
};

const { autoUnsend } = module.exports.config.envConfig;
const { findBestMatch } = require('string-similarity');

const CATEGORY_ICONS = {
  'Trò Chơi': '🎮',
  'Game': '🎮',
  'Tiện ích': '🛠️',
  'Nhóm': '👥',
  'Hệ thống': '⚙️',
  'Media': '📷',
  'Tài chính': '💰',
  'Admin': '👑',
  'Khác': '📦'
};

function getCategoryIcon(cat) {
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (cat.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return '📦';
}

function permTxt(p) {
  return ['Thành viên', 'Quản trị viên nhóm', 'Support Bot', 'Admin Bot'][p] || 'Thành viên';
}

function canAccess(cmdP, userP, isGroupAdmin) {
  if (userP === 3) return true;
  if (userP === 2) return cmdP <= 2;
  if (isGroupAdmin) return cmdP <= 1;
  return cmdP === 0;
}

async function getThreadAdminIDs(api, tid) {
  try {
    return (await api.getThreadInfo(tid)).adminIDs.map(e => String(e.id));
  } catch {
    return [];
  }
}

function similar(input, list) {
  if (!list.length) return [];
  return findBestMatch(input, list).ratings
    .filter(r => r.rating > 0.3)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3)
    .map(r => r.target);
}

function cmdInfo(c) {
  const icon = getCategoryIcon(c.commandCategory || '');
  return (
`╭────────────────────────╮
   ${icon} LỆNH: ${c.name.toUpperCase()} ${icon}
╰────────────────────────╯
📝 Mô tả   : ${c.description || 'Không có mô tả'}
👑 Quyền hạn: ${permTxt(c.hasPermssion || c.hasPermission || 0)}
📂 Danh mục : ${c.commandCategory || 'Khác'}
💡 Cách dùng: ${c.usages || c.name}
⏱️ Cooldown : ${c.cooldowns || 1}s
👤 Tác giả  : ${c.credits || 'dtb'}
╰────────────────────────╯`
  );
}

function groupCmds(p, isAdmin) {
  const map = {};
  for (const [n, c] of global.client.commands) {
    const requiredPerm = c.config.hasPermssion !== undefined ? c.config.hasPermssion : (c.config.hasPermission || 0);
    if (!canAccess(requiredPerm, p, isAdmin)) continue;

    let cat = c.config.commandCategory || 'Khác';
    if (/^game$/i.test(cat)) cat = 'Trò Chơi';

    if (!map[cat]) map[cat] = [];
    map[cat].push(n);
  }

  // Ensure 'Trò Chơi' is first or prominent
  const categories = Object.keys(map).sort((a, b) => {
    if (a === 'Trò Chơi') return -1;
    if (b === 'Trò Chơi') return 1;
    return a.localeCompare(b);
  });

  return categories.map(k => ({
    name: k,
    icon: getCategoryIcon(k),
    commands: map[k].sort()
  }));
}

module.exports.run = async function ({ api, event, args, permssion }) {
  const { sendMessage, unsendMessage } = api;
  const { threadID, messageID, senderID } = event;
  const cmds = global.client.commands;

  const adminIDs = await getThreadAdminIDs(api, threadID);
  const isGroupAdmin = adminIDs.includes(String(senderID));

  // Quick view: /menu game or /menu trochoi
  if (args[0] && ['game', 'games', 'trochoi', 'minigame'].includes(args[0].toLowerCase())) {
    const groups = groupCmds(permssion, isGroupAdmin);
    const gameGroup = groups.find(g => g.name.toLowerCase() === 'trò chơi');
    if (!gameGroup || !gameGroup.commands.length) {
      return sendMessage('⚠️ Hiện tại chưa có minigame nào sẵn sàng!', threadID, messageID);
    }

    let msg =
`╔═════════════════════════╗
   🎮 DANH SÁCH TRÒ CHƠI HOT 🎮
╚═════════════════════════╝
✨ Tổng cộng: ${gameGroup.commands.length} minigame giải trí đỉnh cao:\n\n`;

    gameGroup.commands.forEach((cName, idx) => {
      const c = cmds.get(cName);
      const desc = c && c.config && c.config.description ? c.config.description.split('\n')[0] : '';
      msg += `  ${String(idx + 1).padStart(2, '0')}. /${cName}${desc ? ` » ${desc}` : ''}\n`;
    });

    msg += `\n📌 Gõ /<tên game> để bắt đầu chơi ngay!
💡 Ví dụ: /cauca | /vongquay | /dapchuot | /doanso | /taixiu`;

    return sendMessage(msg, threadID, (err, info) => {
      if (!err && autoUnsend.status) {
        setTimeout(() => unsendMessage(info.messageID), autoUnsend.timeOut * 1000);
      }
    }, messageID);
  }

  // Quick view: /menu all
  if (args[0] && args[0].toLowerCase() === 'all') {
    let msg = `╔═════════════════════════╗\n   📋 TẤT CẢ LỆNH BOT DTB 📋\n╚═════════════════════════╝\n`;
    let count = 0;
    [...cmds.values()]
      .filter(c => {
        const p = c.config.hasPermssion !== undefined ? c.config.hasPermssion : (c.config.hasPermission || 0);
        return canAccess(p, permssion, isGroupAdmin);
      })
      .sort((a, b) => a.config.name.localeCompare(b.config.name))
      .forEach(c => {
        count++;
        msg += ` ${String(count).padStart(2, '0')}. /${c.config.name}\n`;
      });
    msg += `\n✨ Tổng cộng: ${count} lệnh hoạt động.`;
    return sendMessage(msg, threadID, messageID);
  }

  // Search or specific command: /menu <name>
  if (args[0]) {
    const name = args.join(' ').toLowerCase();
    const cmd = cmds.get(name);
    if (cmd) {
      const p = cmd.config.hasPermssion !== undefined ? cmd.config.hasPermssion : (cmd.config.hasPermission || 0);
      if (canAccess(p, permssion, isGroupAdmin)) {
        return sendMessage(cmdInfo(cmd.config), threadID, messageID);
      }
    }

    const list = [...cmds.keys()].filter(n => {
      const c = cmds.get(n);
      const p = c.config.hasPermssion !== undefined ? c.config.hasPermssion : (c.config.hasPermission || 0);
      return canAccess(p, permssion, isGroupAdmin);
    });
    const sim = similar(name, list);
    return sendMessage(
      sim.length
        ? `⚠️ Không có lệnh "${name}"!\n💡 Có phải bạn muốn dùng:\n${sim.map((v, i) => `  ${i + 1}. /${v}`).join('\n')}`
        : `❌ Không tìm thấy lệnh "${name}"!`,
      threadID,
      messageID
    );
  }

  // Main Category Menu
  const groups = groupCmds(permssion, isGroupAdmin);
  const totalCmds = groups.reduce((a, b) => a + b.commands.length, 0);

  let msg =
`╔═════════════════════════╗
       ⚡ MENU BOT DTB ⚡
╚═════════════════════════╝
👤 Người dùng: ${senderID}
📦 Tổng lệnh : ${totalCmds} lệnh sẵn sàng
─────────────────────────\n`;

  groups.forEach((g, i) => {
    msg += `  ${String(i + 1).padStart(2, '0')}. ${g.icon} ${g.name} » ${g.commands.length} lệnh\n`;
  });

  msg +=
`─────────────────────────
👉 Reply [Số thứ tự] để xem chi tiết nhóm lệnh
🎮 Gõ "menu game" để mở nhanh danh sách trò chơi
📋 Gõ "menu all" để xem tất cả lệnh
⏱️ Tự động gỡ sau ${autoUnsend.timeOut}s`;

  sendMessage(msg, threadID, (e, info) => {
    if (e) return;
    global.client.handleReply.push({
      name: 'menu',
      messageID: info.messageID,
      author: senderID,
      type: 'group',
      data: groups,
      permssion,
      isGroupAdmin
    });
    if (autoUnsend.status) {
      setTimeout(() => unsendMessage(info.messageID), autoUnsend.timeOut * 1000);
    }
  }, messageID);
};

module.exports.handleReply = async function ({ handleReply, api, event }) {
  const { sendMessage, unsendMessage } = api;
  const { threadID, messageID, senderID, body } = event;
  const cmds = global.client.commands;

  if (String(senderID) !== String(handleReply.author)) {
    return sendMessage('⚠️ Vui lòng gõ /menu để mở menu của riêng bạn!', threadID, messageID);
  }

  const choice = parseInt(body.trim());
  if (isNaN(choice) || choice < 1) {
    return sendMessage('❌ Vui lòng nhập số thứ tự hợp lệ!', threadID, messageID);
  }

  // Level 1: Choosing a category
  if (handleReply.type === 'group') {
    const g = handleReply.data[choice - 1];
    if (!g) return sendMessage('❌ Số thứ tự danh mục không tồn tại!', threadID, messageID);

    unsendMessage(handleReply.messageID);

    let msg =
`╭────────────────────────╮
   ${g.icon} DANH MỤC: ${g.name.toUpperCase()}
╰────────────────────────╯
✨ Tổng cộng: ${g.commands.length} lệnh:\n\n`;

    g.commands.forEach((cName, i) => {
      const c = cmds.get(cName);
      const desc = c && c.config && c.config.description ? ` » ${c.config.description.split('\n')[0]}` : '';
      msg += `  ${String(i + 1).padStart(2, '0')}. /${cName}${desc}\n`;
    });

    msg += `\n─────────────────────────
👉 Reply [Số thứ tự] để xem thông tin chi tiết lệnh
⏱️ Tự động gỡ sau ${autoUnsend.timeOut}s`;

    sendMessage(msg, threadID, (err, info) => {
      if (err) return;
      global.client.handleReply.push({
        name: 'menu',
        messageID: info.messageID,
        author: senderID,
        type: 'command',
        commands: g.commands,
        permssion: handleReply.permssion,
        isGroupAdmin: handleReply.isGroupAdmin
      });
      if (autoUnsend.status) {
        setTimeout(() => unsendMessage(info.messageID), autoUnsend.timeOut * 1000);
      }
    });
    return;
  }

  // Level 2: Choosing a specific command from category
  if (handleReply.type === 'command') {
    const cmdName = handleReply.commands[choice - 1];
    if (!cmdName) return sendMessage('❌ Số thứ tự lệnh không tồn tại!', threadID, messageID);

    const cmd = cmds.get(cmdName);
    if (!cmd) return sendMessage('❌ Lệnh không tìm thấy!', threadID, messageID);

    unsendMessage(handleReply.messageID);
    return sendMessage(cmdInfo(cmd.config), threadID, messageID);
  }
};
