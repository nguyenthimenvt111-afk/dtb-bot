const moment = require("moment-timezone");
const os = require('os');
const fs = require('fs');

module.exports.config = {
  name: "upt2",
  version: "1.1.0",
  hasPermssion: 0,
  hasPermission: 0,
  credits: "dtb",
  description: "Báo cáo chi tiết chỉ số hoạt động của máy chủ và bot",
  commandCategory: "Hệ Thống",
  cooldowns: 3
};

module.exports.run = async ({ api, event, Users, Threads }) => {
  const timeStart = Date.now();
  try {
    let dependencies = 0;
    let devDependencies = 0;
    try {
      const pack = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      dependencies = pack.dependencies ? Object.keys(pack.dependencies).length : 0;
      devDependencies = pack.devDependencies ? Object.keys(pack.devDependencies).length : 0;
    } catch (_) {}

    const threadSetting = (await Threads.getData(String(event.threadID))).data || {};
    const prefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : global.config.PREFIX;
    const platform = os.platform();
    const arch = os.arch();
    const cpu_model = os.cpus()[0]?.model || "Unknown CPU";
    const core = os.cpus().length;
    const speed = os.cpus()[0]?.speed || 0;
    const byte_fm = os.freemem();
    const byte_tm = os.totalmem();
    const gb_fm = (byte_fm / (1024 * 1024 * 1024)).toFixed(2);
    const gb_tm = (byte_tm / (1024 * 1024 * 1024)).toFixed(2);
    const u_mem = ((byte_tm - byte_fm) / (1024 * 1024 * 1024)).toFixed(2);
    const gio = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || DD/MM/YYYY");
    const time = process.uptime();
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    let name = "Người dùng";
    try { if (Users && typeof Users.getNameUser === "function") name = await Users.getNameUser(event.senderID) || name; } catch (_) {}
    let threadName = "Cuộc trò chuyện";
    try {
      let tInfo = await api.getThreadInfo(event.threadID);
      threadName = tInfo.threadName || threadName;
    } catch (_) {}

    const ping = Date.now() - timeStart;
    const statusText = ping < 150 ? 'Rất mượt mà' : ping < 400 ? 'Ổn định' : 'Hơi chậm';

    const uptimeMessage = 
`══════╗ ⇲  UPTIME SYSTEM  ⇱ ╚══════

☍ · Bây giờ là: ${gio}
☍ · Thời gian hoạt động: ${hours} giờ ${minutes} phút ${seconds} giây
☍ · Dấu lệnh (Prefix): ${prefix}
☍ · Phiên bản: v1.2.14
☍ · Tổng nhóm quản lý: ${(global.data.allThreadID || []).length}
☍ · Tổng người dùng: ${(global.data.allUserID || []).length}
☍ · Thông tin phần cứng:
  - Hệ điều hành: ${platform} (${arch})
  - Vi xử lý: ${core} core(s) | ${cpu_model} (${speed}MHz)
  - Packages hỗ trợ: ${dependencies} chính, ${devDependencies} dev
  - Bộ nhớ RAM: Đã dùng ${u_mem}GB / ${gb_tm}GB (Trống: ${gb_fm}GB)
☍ · Độ trễ (Ping): ${ping}ms
☍ · Trạng thái mạng: ${statusText}
☍ · Yêu cầu bởi: ${name}
☍ · Nhóm: ${threadName}
══════════════════════════════`;

    return api.sendMessage(uptimeMessage, event.threadID, event.messageID);
  } catch (error) {
    return api.sendMessage(`❌ Lỗi hiển thị Uptime: ${error.message}`, event.threadID, event.messageID);
  }
};
