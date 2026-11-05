const os = require("os");
const moment = require("moment-timezone");
const fs = require("fs-extra");
const { createCanvas } = require("canvas");
const path = require("path");

module.exports.config = {
  name: "upt1",
  version: "3.1.0",
  hasPermission: 0,
  hasPermssion: 0,
  credits: "dtb",
  description: "Bảng đồ họa Canvas thông tin hệ thống bot",
  commandCategory: "Hệ Thống",
  cooldowns: 5
};

function truncateText(ctx, text, maxWidth) {
  let output = text;
  while (ctx.measureText(output).width > maxWidth) {
    output = output.slice(0, -1);
  }
  if (output !== text) output = output.slice(0, -3) + "...";
  return output;
}

module.exports.run = async ({ api, event, Users }) => {
  let name = "Người dùng";
  try { name = await Users.getNameUser(event.senderID) || name; } catch (_) {}

  const uptime = process.uptime();
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);
  const uptimeStr = `${h}h ${m}m ${s}s`;

  const ramUsed = ((os.totalmem() - os.freemem()) / (1024 * 1024 * 1024)).toFixed(1);
  const ramTotal = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1);

  const rows = [
    ["⏰ Bây giờ", moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss - DD/MM/YYYY")],
    ["🕒 Hoạt động", uptimeStr],
    ["⚙️ Prefix", global.config.PREFIX || "/"],
    ["🌐 Mạng", "Kết nối an toàn (HTTPS/WSS)"],
    ["💻 Hệ điều hành", `${os.type()} ${os.release()} (${os.arch()})`],
    ["🖥 CPU", `${os.cpus().length} core(s) - ${os.cpus()[0]?.model ? os.cpus()[0].model.slice(0, 25) : "CPU"}`],
    ["💾 RAM", `${ramUsed}GB / ${ramTotal}GB`],
    ["👤 Yêu cầu bởi", name]
  ];

  const width = 850, rowH = 55, cardX = 40;
  const height = 110 + rows.length * (rowH + 15);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Nền gradient công nghệ
  ctx.fillStyle = "#0a0f1a";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px Arial";
  ctx.fillText("📊 THÔNG TIN HỆ THỐNG DTB BOT", cardX, 55);

  let y = 115;
  for (const [label, val] of rows) {
    ctx.fillStyle = "#101a2e";
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(cardX, y - 30, width - 2 * cardX, rowH, 12);
    } else {
      ctx.rect(cardX, y - 30, width - 2 * cardX, rowH);
    }
    ctx.fill();

    ctx.fillStyle = "#33ccff";
    ctx.font = "bold 20px Arial";
    ctx.fillText(label, cardX + 20, y + 4);

    ctx.fillStyle = "#e6f2ff";
    ctx.font = "600 20px Arial";

    const safeVal = truncateText(ctx, String(val), 460);
    ctx.fillText(safeVal, cardX + 240, y + 4);

    y += rowH + 15;
  }

  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);
  const outPath = path.join(cacheDir, `uptime_${Date.now()}_${event.senderID}.png`);
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

  const stream = fs.createReadStream(outPath);
  stream.on("close", () => {
    try { fs.unlinkSync(outPath); } catch (_) {}
  });

  return api.sendMessage(
    { body: "📊 Thông tin chi tiết hệ thống:", attachment: stream },
    event.threadID,
    event.messageID
  );
};
