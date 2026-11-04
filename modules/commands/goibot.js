/**
 * GENFOR – AI GPT LEVEL CUỐI
 * 1 FILE – TỰ HỌC – TỰ QUẢN LÝ – GPT CORE
 */

const fs = require("fs-extra");
const path = require("path");
let OpenAI;
try {
  OpenAI = require("openai");
} catch {
  OpenAI = class { constructor() {} };
}

/* ================= CONFIG ================= */
const CONFIG = {
  OPENAI_API_KEY: "",
  GPT_MODEL: "gpt-4o-mini", // hoặc gpt-4.1 / gpt-3.5-turbo
  BOT_NAME: "dtb",
  OWNER_IDS: ["61577714247816"], // UID FB của bạn
};

/* ================= PATH ================= */
const BASE_DIR = path.join(__dirname, "genfor_ai");
const FILES = {
  users: path.join(BASE_DIR, "users.json"),
  behavior: path.join(BASE_DIR, "behavior.json"),
  boxes: path.join(BASE_DIR, "boxes.json"),
  memory: path.join(BASE_DIR, "memory.json"),
  logs: path.join(BASE_DIR, "logs.json"),
};

fs.ensureDirSync(BASE_DIR);
Object.values(FILES).forEach(f => {
  if (!fs.existsSync(f)) fs.writeJSONSync(f, {});
});

/* ================= OPENAI ================= */
const openai = new OpenAI({
  apiKey: CONFIG.OPENAI_API_KEY,
});

/* ================= UTILS ================= */
const load = f => fs.readJSONSync(f);
const save = (f, d) => fs.writeJSONSync(f, d, { spaces: 2 });
const now = () => new Date().toISOString();

/* ================= USER ================= */
function getUser(uid) {
  const db = load(FILES.users);
  if (!db[uid]) {
    db[uid] = {
      trust: 50,
      personality: "neutral",
      role: "user",
      createdAt: now(),
      lastActive: now(),
    };
    save(FILES.users, db);
  }
  return db[uid];
}

function updateUser(uid, patch) {
  const db = load(FILES.users);
  db[uid] = { ...getUser(uid), ...patch, lastActive: now() };
  save(FILES.users, db);
}

/* ================= ROLE ================= */
function getRole(uid) {
  if (CONFIG.OWNER_IDS.includes(uid)) return "owner";
  return getUser(uid).role || "user";
}

/* ================= BEHAVIOR ================= */
function recordBehavior(uid, type) {
  const db = load(FILES.behavior);
  if (!db[uid]) db[uid] = { spam: 0, toxic: 0, good: 0 };
  db[uid][type]++;
  save(FILES.behavior, db);
}

function analyzeBehavior(uid) {
  const b = load(FILES.behavior)[uid] || {};
  if (b.toxic >= 6) return "toxic";
  if (b.spam >= 8) return "spam";
  if (b.good >= 5) return "friendly";
  return "normal";
}

/* ================= BOX ================= */
function getBox(tid) {
  const db = load(FILES.boxes);
  if (!db[tid]) {
    db[tid] = {
      antiSpam: true,
      antiToxic: true,
      autoKick: true,
      aiManage: true,
      strict: 1,
      createdAt: now(),
    };
    save(FILES.boxes, db);
  }
  return db[tid];
}

/* ================= MEMORY ================= */
function remember(uid, text) {
  const db = load(FILES.memory);
  if (!db[uid]) db[uid] = [];
  db[uid].push({ time: now(), text });
  if (db[uid].length > 25) db[uid].shift();
  save(FILES.memory, db);
}

/* ================= GPT CORE ================= */
async function gpt(system, user) {
  const res = await openai.chat.completions.create({
    model: CONFIG.GPT_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.7,
  });
  return res.choices[0].message.content;
}

async function gptDecision(text) {
  const res = await openai.chat.completions.create({
    model: CONFIG.GPT_MODEL,
    messages: [
      {
        role: "system",
        content: `Bạn là AI quản lý nhóm. Trả JSON:
{ "action": "chat|kick|mute|rename|change_rule", "args": "" }`,
      },
      { role: "user", content: text },
    ],
    temperature: 0,
  });

  try {
    return JSON.parse(res.choices[0].message.content);
  } catch {
    return { action: "chat" };
  }
}

/* ================= AUTO MOD ================= */
async function autoModerate(api, event) {
  const behavior = analyzeBehavior(event.senderID);
  const box = getBox(event.threadID);
  if (!box.aiManage) return;

  if (behavior === "toxic" && box.autoKick) {
    await api.removeUserFromGroup(event.senderID, event.threadID);
  }
}

/* ================= MAIN ================= */
module.exports = {
  config: {
    name: "genfor",
    version: "GPT-ULTIMATE",
    hasPermssion: 0,
    credits: "dtb",
    description: "AI GPT toàn năng – tự học – quản lý box",
    commandCategory: "AI",
    usages: "genfor",
    cooldowns: 1,
  },

  handleEvent: async function ({ api, event }) {
    if (!event.body || event.senderID === api.getCurrentUserID()) return;

    const body = event.body.toLowerCase();
    const called =
      body.includes("genfor") ||
      body.includes("bot đâu") ||
      (event.mentions && event.mentions[api.getCurrentUserID()]);

    /* LEARN */
    if (body.length < 6) recordBehavior(event.senderID, "spam");
    if (/chó|địt|cặc|lồn|đm/.test(body)) recordBehavior(event.senderID, "toxic");
    if (/cảm ơn|thanks|ok/.test(body)) recordBehavior(event.senderID, "good");

    await autoModerate(api, event);
    if (!called) return;

    const role = getRole(event.senderID);
    const behavior = analyzeBehavior(event.senderID);
    const memory = load(FILES.memory)[event.senderID] || [];

    const system = `
Bạn là ${CONFIG.BOT_NAME}.
Role người nói: ${role}
Hành vi: ${behavior}
Ký ức: ${memory.map(m => m.text).join(" | ")}

Luật:
- Owner nói → làm
- User toxic → cứng
- Có thể đề xuất kick / đổi luật
- Không nói mình là AI
`;

    const decision = await gptDecision(event.body);

    if (decision.action === "kick" && role !== "user") {
      const ids = Object.keys(event.mentions || {});
      for (const id of ids) await api.removeUserFromGroup(id, event.threadID);
      return api.sendMessage("✅ Xong.", event.threadID);
    }

    if (decision.action === "rename" && role === "owner") {
      await api.setTitle(decision.args || "Box dtb", event.threadID);
      return api.sendMessage("✅ Đổi tên box.", event.threadID);
    }

    const reply = await gpt(system, event.body);
    remember(event.senderID, event.body);
    return api.sendMessage(reply, event.threadID, event.messageID);
  },

  run: async function () {},
};
