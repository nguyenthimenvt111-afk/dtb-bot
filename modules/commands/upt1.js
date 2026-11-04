const os = require("os");
const moment = require("moment-timezone");
const fs = require("fs-extra");
const { createCanvas } = require("canvas");
const path = require("path");

module.exports.config = {
  name: "upt1",
  version: "3.0.0",
  hasPermission: 0,
  credits: "dtb",
  description: "Thông tin hệ thống bot",
  commandCategory: "Hệ Thống",
  cooldowns: 5
};

function getPrimaryIP() {
  const nets = os.networkInterfaces();
  for (const net of Object.values(nets)) {
    for (const n of net) {
      if (n.family === "IPv4" && !n.internal) return n.address;
    }
  }
  return "127.0.0.1";
}

function truncateText(ctx, text, maxWidth) {
  let output = text;
  while (ctx.measureText(output).width > maxWidth) {
    output = output.slice(0, -1);
  }
  if (output !== text) output = output.slice(0, -3) + "...";
  return output;
}

module.exports.run = async ({ api, event, Users }) => {
  const name = await Users.getNameUser(event.senderID);
  const uptime = process.uptime();
  const uptimeStr = new Date(uptime * 1000).toISOString().substr(11, 8);

  const rows = [
    ["⏰ Bây giờ", moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss - DD/MM/YYYY")],
    ["🕒 Hoạt động", uptimeStr],
    ["⚙️ Prefix", global.config.PREFIX],
    ["🌐 IP", getPrimaryIP()],
    ["💻 OS", `${os.type()} ${os.release()} (${os.arch()})`],
    ["🖥 CPU", `${os.cpus().length} core`],
    ["💾 RAM", `${(os.totalmem()-os.freemem())/1073741824|0}GB/${(os.totalmem()/1073741824).toFixed(1)}GB`],
    ["👤 Yêu cầu bởi", name]
  ];

  const width = 850, rowH = 55, cardX = 40;
  const height = 100 + rows.length * (rowH + 15);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0a0f1a";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 32px Arial";
  ctx.fillText("📊 Thông tin hệ thống Bot", cardX, 50);

  let y = 110;
  for (const [label, val] of rows) {
    ctx.fillStyle = "#101a2e";
    ctx.beginPath();
    ctx.roundRect(cardX, y - 30, width - 2*cardX, rowH, 12);
    ctx.fill();

    ctx.fillStyle = "#33ccff";
    ctx.font = "600 22px Arial";
    ctx.fillText(label, cardX + 20, y);

    ctx.fillStyle = "#fff";
    ctx.font = "700 22px Arial";

    const safeVal = truncateText(ctx, String(val), 450);
    ctx.fillText(safeVal, cardX + 250, y);

    y += rowH + 15;
  }

  const outPath = path.join(__dirname, "uptime.png");
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

  api.sendMessage(
    { body: "", attachment: fs.createReadStream(outPath) },
    event.threadID,
    () => fs.unlinkSync(outPath),
    event.messageID
  );
};
