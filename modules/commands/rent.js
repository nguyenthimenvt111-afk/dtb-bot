const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");
const crypto = require("crypto");

module.exports.config = {
    name: "rent",
    version: "3.2.0",
    hasPermssion: 0,
    hasPermission: 0,
    credits: "dtb",
    description: "Hệ thống quản lý thuê bot thông minh bằng key",
    commandCategory: "Hệ Thống",
    usages: "[subcommand / key]",
    cooldowns: 3
};

const dataDir = path.join(__dirname, "cache", "rentbot");
fs.ensureDirSync(dataDir);
const dataPath = path.join(dataDir, "rents.json");
const keyPath = path.join(dataDir, "keys.json");

const getRents = () => {
    try {
        return fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, "utf8")) : [];
    } catch (_) {
        return [];
    }
};

const getKeys = () => {
    try {
        return fs.existsSync(keyPath) ? JSON.parse(fs.readFileSync(keyPath, "utf8")) : [];
    } catch (_) {
        return [];
    }
};

const save = (rents, keys) => {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(rents, null, 2), "utf8");
        fs.writeFileSync(keyPath, JSON.stringify(keys, null, 2), "utf8");
    } catch (e) {
        console.error("Lỗi lưu dữ liệu rent:", e);
    }
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const send = msg => api.sendMessage(msg, threadID, messageID);
    const prefix = (global.data.threadData.get(String(threadID)) || {}).PREFIX || global.config.PREFIX;
    const isBotAdmin = (global.config.ADMINBOT || []).includes(String(senderID));

    let rents = getRents();
    let keys = getKeys();

    if (!args[0]) {
        return send(
`╔═════════════════════════╗
   📜 HỆ THỐNG THUÊ BOT DTB
╚═════════════════════════╝
▸ ${prefix}rent key [ngày] [số lượng] : Tạo key thuê bot (Admin)
▸ ${prefix}rent info : Xem hạn thuê của nhóm hiện tại
▸ ${prefix}rent check [trang] : Xem danh sách key đã tạo (Admin)
▸ ${prefix}rent all : Xem tất cả các nhóm đang thuê bot (Admin)
▸ ${prefix}rent del [key] : Xóa key chưa sử dụng (Admin)
▸ ${prefix}rent delrent [ID nhóm] : Hủy thuê bot của nhóm (Admin)
▸ ${prefix}rent update : Cập nhật tên nhóm vào danh sách thuê
──────────────────────────
👉 Nhập trực tiếp key để kích hoạt thuê bot!`
        );
    }

    const sub = args[0].toLowerCase();

    // Subcommand: Create keys
    if (sub === "key") {
        if (!isBotAdmin) return send("⚠️ Quyền hạn không đủ! Chỉ Admin Bot mới có thể tạo key thuê bot.");

        const days = parseInt(args[1]);
        const count = parseInt(args[2]) || 1;
        if (isNaN(days) || days <= 0 || isNaN(count) || count <= 0) {
            return send(`❎ Cú pháp không hợp lệ! Vui lòng dùng: ${prefix}rent key [số ngày] [số lượng key]`);
        }

        const created = [];
        for (let i = 0; i < count; i++) {
            const key = "DTB-" + crypto.randomBytes(6).toString("hex").toUpperCase();
            keys.push({
                key,
                days,
                used: false,
                group: null,
                user: null,
                createdAt: moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY")
            });
            created.push(key);
        }
        save(rents, keys);
        return send(`✅ Đã tạo thành công ${count} key (${days} ngày/key):\n\n${created.map((k, i) => `${i + 1}. ${k}`).join("\n")}`);
    }

    // Subcommand: Rent info for current thread
    if (sub === "info") {
        const rent = rents.find(r => String(r.tid) === String(threadID));
        if (!rent) return send("❎ Nhóm này chưa kích hoạt thuê bot hoặc đã hết hạn!");

        const now = moment().tz("Asia/Ho_Chi_Minh");
        const exp = moment(rent.exp, "DD/MM/YYYY");
        const diff = exp.diff(now, "days");

        return send(
`╔═════════════════════════╗
   📘 THÔNG TIN THUÊ BOT
╚═════════════════════════╝
▸ Nhóm: ${rent.name || "Nhóm chat"}
▸ ID Nhóm: ${rent.tid}
▸ Key đã dùng: ${rent.key || "N/A"}
▸ Bắt đầu: ${rent.start || "N/A"}
▸ Hạn kết thúc: ${rent.exp}
▸ Tình trạng: ${diff >= 0 ? `Còn ${diff} ngày` : `Đã hết hạn (${Math.abs(diff)} ngày trước)`}`
        );
    }

    // Subcommand: Check unused keys
    if (sub === "check") {
        if (!isBotAdmin) return send("⚠️ Chỉ Admin Bot mới được sử dụng lệnh này.");

        const page = parseInt(args[1]) || 1;
        const limit = 10;
        const total = Math.ceil(keys.length / limit) || 1;
        const slice = keys.slice((page - 1) * limit, page * limit);

        if (slice.length === 0) return send("⚠️ Hiện tại không có key nào trong hệ thống.");

        let msg = `🔑 DANH SÁCH KEY THUÊ BOT (Trang ${page}/${total}):\n──────────────────────────\n`;
        slice.forEach((k, idx) => {
            const num = (page - 1) * limit + idx + 1;
            msg += `${num}. [${k.key}] - ${k.days || 30} ngày - ${k.used ? "❌ Đã dùng" : "✅ Khả dụng"}\n`;
        });
        return send(msg);
    }

    // Subcommand: Check all renting threads
    if (sub === "all" || sub === "list") {
        if (!isBotAdmin) return send("⚠️ Chỉ Admin Bot mới được xem danh sách tất cả nhóm thuê.");
        if (rents.length === 0) return send("⚠️ Hiện tại chưa có nhóm nào kích hoạt thuê bot.");

        const now = moment().tz("Asia/Ho_Chi_Minh");
        let msg = `📋 TỔNG HỢP NHÓM THUÊ BOT (${rents.length} nhóm):\n──────────────────────────\n`;
        rents.forEach((r, idx) => {
            const exp = moment(r.exp, "DD/MM/YYYY");
            const diff = exp.diff(now, "days");
            msg += `${idx + 1}. ${r.name || "Nhóm"}\n   TID: ${r.tid}\n   Hạn: ${r.exp} (${diff >= 0 ? `còn ${diff} ngày` : "hết hạn"})\n`;
        });
        return send(msg);
    }

    // Subcommand: Delete unused key
    if (sub === "del") {
        if (!isBotAdmin) return send("⚠️ Chỉ Admin Bot mới có quyền xóa key.");
        const keyToDelete = args[1];
        if (!keyToDelete) return send("❎ Vui lòng nhập key muốn xóa!");

        const idx = keys.findIndex(k => k.key.toLowerCase() === keyToDelete.toLowerCase());
        if (idx === -1) return send("❎ Không tìm thấy key này trong hệ thống!");

        keys.splice(idx, 1);
        save(rents, keys);
        return send(`✅ Đã xóa key [${keyToDelete}] khỏi hệ thống thành công!`);
    }

    // Subcommand: Cancel a thread's rent
    if (sub === "delrent") {
        if (!isBotAdmin) return send("⚠️ Chỉ Admin Bot mới có quyền hủy thuê bot của nhóm.");
        const tidTarget = args[1] || String(threadID);
        const idx = rents.findIndex(r => String(r.tid) === String(tidTarget));
        if (idx === -1) return send(`❎ Nhóm có ID [${tidTarget}] không nằm trong danh sách thuê bot.`);

        const removed = rents.splice(idx, 1)[0];
        save(rents, keys);
        return send(`✅ Đã hủy trạng thái thuê bot của nhóm: ${removed.name || tidTarget}`);
    }

    // Subcommand: Update thread name
    if (sub === "update") {
        const rent = rents.find(r => String(r.tid) === String(threadID));
        if (!rent) return send("❎ Nhóm này chưa kích hoạt thuê bot.");
        try {
            const info = await api.getThreadInfo(threadID);
            rent.name = info.threadName || "Nhóm chat";
            save(rents, keys);
            return send(`✅ Đã cập nhật tên nhóm: "${rent.name}"`);
        } catch (_) {
            return send("❎ Không thể cập nhật tên nhóm từ API.");
        }
    }

    // Subcommand: Direct activation with key
    const inputKey = args[0].trim().toUpperCase();
    const foundKey = keys.find(k => k.key.toUpperCase() === inputKey);
    if (foundKey) {
        if (foundKey.used) return send("❎ Key này đã được kích hoạt trước đó!");

        let threadName = "Nhóm chat";
        try {
            const info = await api.getThreadInfo(threadID);
            threadName = info.threadName || threadName;
        } catch (_) {}

        const now = moment().tz("Asia/Ho_Chi_Minh");
        const daysToAdd = foundKey.days || 30;

        // Check if thread currently has an active rent
        const existingRentIndex = rents.findIndex(r => String(r.tid) === String(threadID));
        let newExpDate;

        if (existingRentIndex !== -1) {
            const currentExp = moment(rents[existingRentIndex].exp, "DD/MM/YYYY");
            // If still valid, extend from current expiration date; otherwise extend from now
            const baseMoment = currentExp.isAfter(now) ? currentExp : now;
            newExpDate = baseMoment.add(daysToAdd, "days").format("DD/MM/YYYY");

            rents[existingRentIndex].name = threadName;
            rents[existingRentIndex].key = inputKey;
            rents[existingRentIndex].exp = newExpDate;
        } else {
            newExpDate = now.clone().add(daysToAdd, "days").format("DD/MM/YYYY");
            rents.push({
                tid: String(threadID),
                name: threadName,
                key: inputKey,
                start: now.format("DD/MM/YYYY"),
                exp: newExpDate
            });
        }

        foundKey.used = true;
        foundKey.group = String(threadID);
        foundKey.user = String(senderID);
        foundKey.usedAt = now.format("HH:mm:ss DD/MM/YYYY");

        save(rents, keys);
        return send(
`🎉 KÍCH HOẠT THUÊ BOT THÀNH CÔNG!
──────────────────────────
🔑 Key: ${inputKey}
⏱ Thời hạn cộng thêm: +${daysToAdd} ngày
📅 Hạn sử dụng mới: ${newExpDate}
Cảm ơn bạn đã đồng hành cùng dtb Bot!`
        );
    }

    return send(`❎ Key hoặc lệnh không hợp lệ! Dùng "${prefix}rent" để xem hướng dẫn chi tiết.`);
};
