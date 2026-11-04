// modules/commands/dungeon.js
// Dungeon Explorer – Canvas Animation + Mini-Boss (full)
// Credits: genfor

const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

const dataDir  = path.join(__dirname, "..", "dungeonData");
const dataPath = path.join(dataDir, "players.json");
const bossPath = path.join(dataDir, "boss.json");

// ====== FILE DATA ======
function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}, null, 2));
  if (!fs.existsSync(bossPath)) {
    const initBoss = { level: 1, hp: 200, maxHp: 200 };
    fs.writeFileSync(bossPath, JSON.stringify(initBoss, null, 2));
  }
}
function loadPlayers() { ensureDataFiles(); return JSON.parse(fs.readFileSync(dataPath)); }
function savePlayers(db) { ensureDataFiles(); fs.writeFileSync(dataPath, JSON.stringify(db, null, 2)); }
function loadBoss() { ensureDataFiles(); return JSON.parse(fs.readFileSync(bossPath)); }
function saveBoss(boss) { ensureDataFiles(); fs.writeFileSync(bossPath, JSON.stringify(boss, null, 2)); }

function getPlayer(uid) {
  const db = loadPlayers();
  if (!db[uid]) {
    db[uid] = {
      ten: "Người Thám Hiểm",
      level: 1,
      exp: 0,
      hp: 100,
      maxHp: 100,
      weapon: null,
      items: [],
      dungeonLevel: 1,
      lastOffline: Date.now()
    };
    savePlayers(db);
  }
  return db[uid];
}
function savePlayer(uid, player) {
  const db = loadPlayers();
  db[uid] = player;
  savePlayers(db);
}

// ====== ITEMS & WEAPONS ======
const weapons = [
  { name: "Kiếm Sắt", atk: 10, rare: false, img: "https://i.imgur.com/4M7IWwP.png" },
  { name: "Rìu Thép", atk: 12, rare: false, img: "https://i.imgur.com/4M7IWwP.png" },
  { name: "Cung Gỗ", atk: 9,  rare: false, img: "https://i.imgur.com/4M7IWwP.png" },
  { name: "Kiếm Bạc", atk: 20, rare: true,  img: "https://i.imgur.com/4M7IWwP.png" },
  { name: "Đao Rồng", atk: 25, rare: true,  img: "https://i.imgur.com/4M7IWwP.png" }
];
const lootItems = [
  { name: "Potion HP",  effect: 20, type: "hp",  rare: false },
  { name: "Thuốc EXP",  effect: 30, type: "exp", rare: false },
  { name: "Vật Phẩm Hiếm", effect: 0, type: "rare", rare: true },
  { name: "Vũ Khí Vàng", atk: 50, type: "weapon", rare: true, img: "https://i.imgur.com/4M7IWwP.png" }
];
const rand = arr => arr[Math.floor(Math.random() * arr.length)];

// ====== CANVAS (ANIMATION FRAME) ======
async function drawScene({ player, boss, msg, opts = {} }) {
  const W = 800, H = 500;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // BG
  ctx.fillStyle = "#0d0f13";
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = "#00ff99";
  ctx.fillRect(0, 0, W, 44);
  ctx.fillStyle = "#00110b";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(player.ten, 12, 28);

  // Player info
  ctx.fillStyle = "#fff";
  ctx.font = "16px sans-serif";
  ctx.fillText(`Level: ${player.level} | HP: ${player.hp}/${player.maxHp} | Dungeon: ${player.dungeonLevel}`, 12, 72);
  if (player.weapon) ctx.fillText(`Weapon: ${player.weapon.name} (ATK: ${player.weapon.atk})`, 12, 98);
  ctx.fillText(`Sự kiện: ${msg}`, 12, 126);

  // HP bars
  function bar(x, y, w, h, ratio, color) {
    ctx.fillStyle = "#2a2f3a"; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color; ctx.fillRect(x, y, Math.max(0, w * Math.max(0, Math.min(1, ratio))), h);
    ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  }
  bar(12, 150, 300, 16, player.hp / player.maxHp, "#2ecc71");
  if (boss) {
    ctx.fillStyle = "#fff"; ctx.fillText(`Boss Lv.${boss.level} HP: ${boss.hp}/${boss.maxHp}`, 12, 190);
    bar(12, 200, 300, 16, boss.hp / boss.maxHp, "#e74c3c");
  }

  // Player sprite
  try {
    const img = await loadImage(player.weapon ? player.weapon.img : "https://i.imgur.com/4M7IWwP.png");
    const wobble = opts.action ? Math.sin(Date.now() / 100) * 10 : 0;
    ctx.drawImage(img, 580, 70 + wobble, 160, 160);
  } catch {}

  // Boss sprite (animated)
  if (boss) {
    ctx.fillStyle = "#b51717";
    const bx = 220 + Math.sin(Date.now() / 150) * 40;
    const by = 260 + Math.cos(Date.now() / 200) * 20;
    ctx.beginPath(); ctx.arc(bx, by, 55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 16px sans-serif";
    ctx.fillText("Mini-Boss", bx - 42, by + 80);

    // Fight beams
    if (opts.fight) {
      ctx.strokeStyle = "yellow"; ctx.lineWidth = 5;
      const fx = 580 + Math.sin(Date.now() / 100) * 10, fy = 120;
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(bx, by); ctx.stroke();

      ctx.strokeStyle = "orange"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(fx, fy); ctx.stroke();

      // Explosion flash near boss
      ctx.fillStyle = "rgba(255,180,0,0.35)";
      for (let r = 70; r >= 20; r -= 10) {
        ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // Chest glow
  if (opts.chest) {
    const cx = 380 + Math.sin(Date.now() / 150) * 20;
    const cy = 240 + Math.cos(Date.now() / 210) * 15;
    ctx.fillStyle = "gold";
    ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000"; ctx.font = "14px sans-serif";
    ctx.fillText("Rương Kho Báu", cx - 50, cy + 46);
  }

  return canvas.toBuffer();
}

// ====== CONFIG ======
module.exports.config = {
  name: "dungeon",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "dtb",
  description: "Dungeon Explorer – Canvas Animation + Mini-Boss",
  commandCategory: "Game",
  usages: "[start/explore/fight/loot/stats/leaderboard/boss]",
  cooldowns: 5
};

// ====== HELPERS ======
function gainExpLevelUp(player, expGain) {
  player.exp += expGain;
  // Cực đơn giản: mỗi 100 exp lên 1 level, tăng maxHp
  while (player.exp >= 100) {
    player.exp -= 100;
    player.level += 1;
    player.maxHp += 10;
    player.hp = Math.min(player.maxHp, player.hp + 10);
  }
}

// ====== MAIN RUN ======
module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, mentions } = event;
  let player = getPlayer(senderID);
  let boss = loadBoss();

  // Offline progress
  const now = Date.now();
  const last = player.lastOffline || now;
  const hours = Math.floor((now - last) / 3600000);
  if (hours > 0) {
    const expGain = hours * 5; // bế quan kiểu off
    gainExpLevelUp(player, expGain);
    player.lastOffline = now;
    savePlayer(senderID, player);
  }

  const sub = (args[0] || "").toLowerCase();

  // START
  if (sub === "start") {
    return api.sendMessage(
      "✅ Bắt đầu Dungeon Explorer! Dùng:\n" +
      "• /dungeon explore – Khám phá\n" +
      "• /dungeon boss – Đánh mini-boss\n" +
      "• /dungeon loot – Nhận rương\n" +
      "• /dungeon fight <@người> – PvP\n" +
      "• /dungeon stats – Thông tin\n" +
      "• /dungeon leaderboard – Bảng xếp hạng",
      threadID
    );
  }

  // EXPLORE
  if (sub === "explore") {
    let msg = "";
    let opts = { action: true };
    const roll = Math.random();
    if (roll < 0.4) {
      // gặp quái
      const dmg = Math.floor(Math.random() * 20) + 5;
      player.hp = Math.max(0, player.hp - dmg);
      msg = `Bạn gặp quái vật và mất ${dmg} HP!`;
      gainExpLevelUp(player, 6);
      opts.fight = true;
    } else if (roll < 0.7) {
      // rương
      const loot = rand(lootItems);
      if (loot.type === "hp") player.hp = Math.min(player.maxHp, player.hp + loot.effect);
      if (loot.type === "exp") gainExpLevelUp(player, loot.effect);
      if (loot.type === "rare") player.items.push(loot);
      if (loot.type === "weapon") player.weapon = { name: loot.name, atk: loot.atk, rare: loot.rare, img: loot.img };
      msg = `Bạn tìm thấy rương: ${loot.name}${loot.rare ? " ⭐" : ""}!`;
      opts.chest = true;
    } else {
      // vũ khí
      const w = rand(weapons);
      player.weapon = w;
      gainExpLevelUp(player, 8);
      msg = `Bạn nhặt được vũ khí: ${w.name}${w.rare ? " ⭐" : ""}!`;
      opts.chest = true;
    }
    savePlayer(senderID, player);
    const buf = await drawScene({ player, boss, msg, opts });
    return api.sendMessage({ body: msg, attachment: buf }, threadID);
  }

  // FIGHT (PvP)
  if (sub === "fight") {
    if (!mentions || Object.keys(mentions).length === 0)
      return api.sendMessage("⚠️ Tag người muốn PvP: /dungeon fight <@người>", threadID);
    const targetID = Object.keys(mentions)[0];
    const foe = getPlayer(targetID);

    const atk1 = (player.weapon ? player.weapon.atk : 5) + Math.random() * 10;
    const atk2 = (foe.weapon ? foe.weapon.atk : 5) + Math.random() * 10;

    let winner = player, loser = foe;
    if (atk2 > atk1) { winner = foe; loser = player; }

    gainExpLevelUp(winner, 12);
    loser.hp = Math.max(0, loser.hp - 25);

    savePlayer(senderID, player);
    savePlayer(targetID, foe);

    const msg = `⚔️ PvP Dungeon!\n🏆 Thắng: ${winner.ten}\n💀 Thua: ${loser.ten}`;
    const buf = await drawScene({ player, boss, msg, opts: { fight: true, action: true } });
    return api.sendMessage({ body: msg, attachment: buf }, threadID);
  }

  // LOOT
  if (sub === "loot") {
    const loot = rand(lootItems);
    let msg = "";
    if (loot.type === "hp") {
      player.hp = Math.min(player.maxHp, player.hp + loot.effect);
      msg = `🎁 Potion HP +${loot.effect} HP!`;
    } else if (loot.type === "exp") {
      gainExpLevelUp(player, loot.effect);
      msg = `🎁 Thuốc EXP +${loot.effect} EXP!`;
    } else if (loot.type === "weapon") {
      player.weapon = { name: loot.name, atk: loot.atk, rare: loot.rare, img: loot.img };
      gainExpLevelUp(player, 10);
      msg = `🎁 Bạn nhận: ${loot.name} ⭐ (ATK ${loot.atk})!`;
    } else {
      player.items.push(loot);
      gainExpLevelUp(player, 5);
      msg = `🎁 Bạn nhận: ${loot.name} ⭐!`;
    }
    savePlayer(senderID, player);
    const buf = await drawScene({ player, boss, msg, opts: { chest: true, action: true } });
    return api.sendMessage({ body: msg, attachment: buf }, threadID);
  }

  // BOSS
  if (sub === "boss") {
    // Tấn công boss
    const playerAtk = (player.weapon ? player.weapon.atk : 5) + Math.random() * 15;
    boss.hp -= Math.floor(playerAtk);

    let msg = `Bạn tấn công Boss và gây ${Math.floor(playerAtk)} sát thương!`;
    let opts = { fight: true, action: true };

    if (boss.hp <= 0) {
      // Boss chết: thưởng & tăng cấp boss
      const loot = rand(lootItems);
      if (loot.type === "hp") player.hp = Math.min(player.maxHp, player.hp + loot.effect);
      else if (loot.type === "exp") gainExpLevelUp(player, 50 + loot.effect);
      else if (loot.type === "weapon") player.weapon = { name: loot.name, atk: loot.atk, rare: loot.rare, img: loot.img };
      else player.items.push(loot);

      // EXP khi hạ boss
      gainExpLevelUp(player, 50);

      // Tăng độ khó boss
      boss.level += 1;
      boss.maxHp = 200 + boss.level * 50;
      boss.hp = boss.maxHp;

      // Tăng tầng dungeon cho người chơi
      player.dungeonLevel += 1;

      msg += `\n🏆 Boss bị đánh bại! Nhận thưởng: ${loot.name}${loot.rare ? " ⭐" : ""} + EXP lớn!`;
      opts.chest = true;
    }

    savePlayer(senderID, player);
    saveBoss(boss);

    const buf = await drawScene({ player, boss, msg, opts });
    return api.sendMessage({ body: msg, attachment: buf }, threadID);
  }

  // STATS
  if (sub === "stats") {
    const msg =
      `👤 ${player.ten}\n` +
      `💀 HP: ${player.hp}/${player.maxHp}\n` +
      `✨ Level: ${player.level} (EXP: ${player.exp}/100)\n` +
      `🗡 Vũ khí: ${player.weapon ? `${player.weapon.name} (ATK ${player.weapon.atk})` : "Không"}\n` +
      `📦 Kho: ${player.items.length ? player.items.map(i => i.name + (i.rare ? "⭐" : "")).join(", ") : "Trống"}\n` +
      `🏰 Dungeon Lv: ${player.dungeonLevel}`;
    return api.sendMessage(msg, threadID);
  }

  // LEADERBOARD
  if (sub === "leaderboard") {
    const db = loadPlayers();
    const rank = Object.entries(db).map(([id, p]) => ({
      id, name: p.ten, exp: p.exp, level: p.level
    }));
    rank.sort((a, b) => (b.level === a.level ? b.exp - a.exp : b.level - a.level));
    let msg = "🏆 Dungeon Leaderboard (Top 10):\n";
    rank.slice(0, 10).forEach((p, i) => {
      msg += `${i + 1}. ${p.name} – Lv ${p.level} (EXP ${p.exp})\n`;
    });
    return api.sendMessage(msg, threadID);
  }

  // HELP
  return api.sendMessage(
    "📖 Lệnh Dungeon Explorer:\n" +
    "• /dungeon start\n" +
    "• /dungeon explore\n" +
    "• /dungeon boss\n" +
    "• /dungeon loot\n" +
    "• /dungeon fight <@người>\n" +
    "• /dungeon stats\n" +
    "• /dungeon leaderboard",
    threadID
  );
};
