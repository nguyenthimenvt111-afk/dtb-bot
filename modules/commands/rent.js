const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");
const crypto = require("crypto");

module.exports.config = {
    name: "rent",
    version: "3.1.0",
    hasPermssion: 0,
    hasPermission: 0,
    credits: "dtb",
    description: "Hệ thống thuê bot bằng key",
    commandCategory: "Hệ Thống",
    usages: "[subcommand]",
    cooldowns: 3
};

const dataDir = path.join(__dirname, "cache", "rentbot");
fs.ensureDirSync(dataDir);
const dataPath = path.join(dataDir, "rents.json");
const keyPath = path.join(dataDir, "keys.json");

let rents = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, "utf8")) : [];
let keys = fs.existsSync(keyPath) ? JSON.parse(fs.readFileSync(keyPath, "utf8")) : [];

const save = () => {
    fs.writeFileSync(dataPath, JSON.stringify(rents, null, 2));
    fs.writeFileSync(keyPath, JSON.stringify(keys, null, 2));
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const send = msg => api.sendMessage(msg, threadID, messageID);
    const prefix = (global.data.threadData.get(String(threadID)) || {}).PREFIX || global.config.PREFIX;
    const isBotAdmin = (global.config.ADMINBOT || []).includes(String(senderID));

    if (!args[0]) {
        return send(
`📜 LỆNH THUÊ BOT:
────────────────────
${prefix}rent key [ngày] [số lượng] → Tạo key
${prefix}rent info → Xem thông tin thuê nhóm
${prefix}rent check → Xem danh sách key
${prefix}rent update → Cập nhật tên nhóm
────────────────────
Nhập key thuê bot trực tiếp để kích hoạt.`
        );
    }

    const sub = args[0].toLowerCase();
    if (sub === "key") {
        if (!isBotAdmin) return send("⚠️ Chỉ Admin Bot mới được tạo key.");

        const days = parseInt(args[1]);
        const count = parseInt(args[2]);
        if (isNaN(days) || isNaN(count)) return send("❎ Sai cú pháp. Dùng: rent key [ngày] [số lượng]");

        const created = [];
        for (let i = 0; i < count; i++) {
            const key = crypto.randomBytes(8).toString("hex");
            const exp = moment().tz("Asia/Ho_Chi_Minh").add(days, "days").format("DD/MM/YYYY");
            keys.push({ key, exp, used: false, group: null, user: null });
            created.push(key);
        }
        save();
        return send(`✅ Đã tạo ${count} key (hết hạn sau ${days} ngày):\n${created.join("\n")}`);
    }

    if (sub === "info") {
        const rent = rents.find(r => String(r.tid) === String(threadID));
        if (!rent) return send("❎ Nhóm này chưa kích hoạt thuê bot.");

        const now = moment().tz("Asia/Ho_Chi_Minh");
        const exp = moment(rent.exp, "DD/MM/YYYY");
        const diff = exp.diff(now, "days");
        return send(
`📘 THÔNG TIN THUÊ BOT
─────────────────
🔑 Key: ${rent.key}
📆 Bắt đầu: ${rent.start}
⏳ Hết hạn: ${rent.exp}
⌚ Còn lại: ${diff} ngày`
        );
    }

    if (sub === "check") {
        if (!isBotAdmin) return send("⚠️ Chỉ Admin Bot mới được dùng lệnh này.");

        const page = parseInt(args[1]) || 1;
        const limit = 10;
        const total = Math.ceil(keys.length / limit) || 1;
        const slice = keys.slice((page - 1) * limit, page * limit);

        if (slice.length === 0) return send("⚠️ Không có key nào.");

        let msg = `🔑 Danh sách key (Trang ${page}/${total}):\n`;
        slice.forEach((k, idx) => {
            msg += `${(page - 1) * limit + idx + 1}. ${k.key} | Hạn: ${k.exp} | ${k.used ? "Đã dùng" : "Chưa dùng"}\n`;
        });
        return send(msg);
    }

    if (sub === "update") {
        const rent = rents.find(r => String(r.tid) === String(threadID));
        if (!rent) return send("❎ Nhóm này chưa thuê bot.");
        try {
            const info = await api.getThreadInfo(threadID);
            rent.name = info.threadName || "Nhóm chat";
            save();
            return send("✅ Đã cập nhật thông tin nhóm thuê bot.");
        } catch (_) {
            return send("❎ Không thể cập nhật thông tin nhóm.");
        }
    }

    // Check if args[0] is an activation key
    const inputKey = args[0].trim();
    const foundKey = keys.find(k => k.key === inputKey);
    if (foundKey) {
        if (foundKey.used) return send("❎ Key này đã được sử dụng từ trước!");
        foundKey.used = true;
        foundKey.group = threadID;
        foundKey.user = senderID;

        let threadName = "Nhóm chat";
        try {
            const info = await api.getThreadInfo(threadID);
            threadName = info.threadName || threadName;
        } catch (_) {}

        const now = moment().tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY");
        rents = rents.filter(r => String(r.tid) !== String(threadID));
        rents.push({
            tid: threadID,
            name: threadName,
            key: inputKey,
            start: now,
            exp: foundKey.exp
        });
        save();
        return send(`✅ Kích hoạt thuê bot thành công! Hết hạn vào ngày: ${foundKey.exp}`);
    }

    return send("❎ Cú pháp hoặc key không hợp lệ!");
};
