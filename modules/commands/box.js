const fs = require("fs-extra");
const path = require("path");
const request = require("request");
const axios = require("axios");

module.exports.config = {
    name: "box",
    version: "2.3.0",
    hasPermssion: 1,
    hasPermission: 1,
    credits: "dtb",
    description: "Quản lý và thiết lập toàn diện các cài đặt nhóm",
    commandCategory: "Quản Lí Box",
    usages: "[id/name/namebox/emoji/me qtv/qtv/image/info/new/taobinhchon/setname/setnameall/rdcolor]",
    cooldowns: 0,
    dependencies: {
        "axios": "",
        "fs-extra": "",
        "request": "",
        "path": ""
    }
};

const totalPath = path.join(__dirname, 'cache', 'data', 'totalChat.json');
const _24hours = 86400000;

module.exports.handleEvent = async ({ api, event }) => {
    try {
        if (!fs.existsSync(totalPath)) {
            fs.ensureDirSync(path.join(__dirname, 'cache', 'data'));
            fs.writeFileSync(totalPath, JSON.stringify({}));
        }
        let totalChat = {};
        try { totalChat = JSON.parse(fs.readFileSync(totalPath, "utf-8")); } catch (_) {}
        if (!totalChat[event.threadID]) return;
        if (Date.now() - totalChat[event.threadID].time > (_24hours * 2)) {
            let threadInfo = await api.getThreadInfo(event.threadID);
            let sl = threadInfo.messageCount || 0;
            totalChat[event.threadID] = {
                time: Date.now() - _24hours,
                count: sl,
                ytd: sl - totalChat[event.threadID].count
            };
            fs.writeFileSync(totalPath, JSON.stringify(totalChat, null, 2));
        }
    } catch (_) {}
};

module.exports.handleReply = function({ api, event, handleReply }) {
    const { threadID, senderID, body } = event;
    if (senderID != handleReply.author) return;
    return api.createPoll(body, event.threadID, handleReply.obj, (err) => {
        if (err) return console.error(err);
        api.sendMessage(`➜ Bình chọn "${body}" đã được tạo thành công!`, threadID);
        api.unsendMessage(handleReply.messageID);
        if (global.client.handleReply) {
            const idx = global.client.handleReply.indexOf(handleReply);
            if (idx !== -1) global.client.handleReply.splice(idx, 1);
        }
    });
};

module.exports.run = async function({ api, event, args, Users, Threads }) {
    const { threadID, messageID, senderID } = event;
    const moment = require("moment-timezone");
    const fullTime = global.client && global.client.getTime ? global.client.getTime("fullTime") : moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
    const timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");

    if (args.length === 0) {
        return api.sendMessage(
`==== 『 𝐁𝐎𝐗 𝐂𝐎𝐍𝐅𝐈𝐆 』 ====
━━━━━━━━━━━━━━━
➜ ${global.config.PREFIX}${this.config.name} id 
𝙼𝚘̂ 𝚝𝚊̉: Lấy ID của nhóm
▱▱▱▱▱▱▱▱▱▱▱▱▱
➜ ${global.config.PREFIX}${this.config.name} name 
𝙼𝚘̂ 𝚝𝚊̉: Lấy tên nhóm
▱▱▱▱▱▱▱▱▱▱▱▱▱
➜ ${global.config.PREFIX}${this.config.name} namebox <tên> 
𝙼𝚘̂ 𝚝𝚊̉: Đổi tên nhóm
▱▱▱▱▱▱▱▱▱▱▱▱▱
➜ ${global.config.PREFIX}${this.config.name} emoji <icon> 
𝙼𝚘̂ 𝚝𝚊̉: Đổi biểu tượng cảm xúc nhóm
▱▱▱▱▱▱▱▱▱▱▱▱▱
➜ ${global.config.PREFIX}${this.config.name} info 
𝙼𝚘̂ 𝚝𝚊̉: Xem thông tin nhóm chi tiết
▱▱▱▱▱▱▱▱▱▱▱▱▱
➜ ${global.config.PREFIX}${this.config.name} me qtv 
𝙼𝚘̂ 𝚝𝚊̉: Bot sẽ cấp quyền Quản trị viên nhóm cho bạn (Admin Bot)
▱▱▱▱▱▱▱▱▱▱▱▱▱
➜ ${global.config.PREFIX}${this.config.name} qtv <tag/reply/UID> 
𝙼𝚘̂ 𝚝𝚊̉: Thêm hoặc gỡ Quản trị viên nhóm
▱▱▱▱▱▱▱▱▱▱▱▱▱
➜ ${global.config.PREFIX}${this.config.name} image <reply ảnh> 
𝙼𝚘̂ 𝚝𝚊̉: Đổi ảnh đại diện nhóm
▱▱▱▱▱▱▱▱▱▱▱▱▱
➜ ${global.config.PREFIX}${this.config.name} new <tag> | <tên nhóm> 
𝙼𝚘̂ 𝚝𝚊̉: Tạo 1 nhóm mới với những người được tag
▱▱▱▱▱▱▱▱▱▱▱▱▱
➜ ${global.config.PREFIX}${this.config.name} taobinhchon <lựa chọn 1|lựa chọn 2...> 
𝙼𝚘̂ 𝚝𝚊̉: Tạo bình chọn trong nhóm
▱▱▱▱▱▱▱▱▱▱▱▱▱
➜ ${global.config.PREFIX}${this.config.name} setname <tag/reply> <biệt danh> 
𝙼𝚘̂ 𝚝𝚊̉: Đặt biệt danh thành viên nhóm
▱▱▱▱▱▱▱▱▱▱▱▱▱
➜ ${global.config.PREFIX}${this.config.name} setnameall <biệt danh> 
𝙼𝚘̂ 𝚝𝚊̉: Đặt biệt danh đồng bộ tất cả thành viên nhóm
▱▱▱▱▱▱▱▱▱▱▱▱▱
➜ ${global.config.PREFIX}${this.config.name} rdcolor 
𝙼𝚘̂ 𝚝𝚊̉: Thiết lập chủ đề nhóm ngẫu nhiên
━━━━━━━━━━━━━━━
===「${timeNow}」=== `, threadID, messageID);
    }

    const action = args[0].toLowerCase();

    if (action === "new") {
        let id = [senderID];
        let main = event.body;
        let groupTitle = main.includes("|") ? main.slice(main.indexOf("|") + 1).trim() : "Nhóm mới";
        if (event.mentions) {
            for (let uid of Object.keys(event.mentions)) {
                if (!id.includes(uid)) id.push(uid);
            }
        }
        if (id.length < 2) return api.sendMessage("➜ Cần ít nhất 2 người tham gia để tạo nhóm mới!", threadID, messageID);
        api.createNewGroup(id, groupTitle, (err) => {
            if (err) return api.sendMessage("➜ Lỗi khi tạo nhóm mới!", threadID, messageID);
            api.sendMessage(`➜ Đã tạo nhóm "${groupTitle}" thành công!`, threadID, messageID);
        });
        return;
    }

    if (action === "id") {
        return api.sendMessage(`➜ ID của nhóm: ${threadID}`, threadID, messageID);
    }

    if (action === "name") {
        let nameThread = (global.data.threadInfo.get(threadID) || {}).threadName;
        if (!nameThread) {
            try {
                let info = await api.getThreadInfo(threadID);
                nameThread = info.threadName;
            } catch (_) {}
        }
        return api.sendMessage(nameThread || "Nhóm chưa đặt tên", threadID, messageID);
    }

    if (action === "namebox" || action === "setnamebox") {
        let content = args.slice(1).join(" ");
        let newTitle = content || (event.messageReply ? event.messageReply.body : "");
        if (!newTitle) return api.sendMessage("➜ Vui lòng nhập tên mới cho nhóm!", threadID, messageID);
        api.setTitle(newTitle, threadID, (err) => {
            if (err) return api.sendMessage("➜ Không thể đổi tên nhóm!", threadID, messageID);
            api.sendMessage(`➜ Đã đổi tên nhóm thành: ${newTitle}`, threadID, messageID);
        });
        return;
    }

    if (action === "emoji") {
        let emoji = args[1] || (event.messageReply ? event.messageReply.body : "");
        if (!emoji) return api.sendMessage("➜ Vui lòng nhập biểu tượng cảm xúc muốn đổi!", threadID, messageID);
        api.changeThreadEmoji(emoji, threadID, (err) => {
            if (err) return api.sendMessage("➜ Không thể đổi biểu tượng nhóm!", threadID, messageID);
            api.sendMessage(`➜ Đã đổi biểu tượng nhóm thành: ${emoji}`, threadID, messageID);
        });
        return;
    }

    if (action === "me" && args[1] === "qtv") {
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            const adminList = Array.isArray(threadInfo.adminIDs) ? threadInfo.adminIDs : [];
            const isBotAdmin = adminList.some(el => el.id == api.getCurrentUserID());
            if (!isBotAdmin) return api.sendMessage("➜ Bot cần quyền Quản trị viên để thực hiện chức năng này!", threadID, messageID);
            const adminBotList = (global.config.ADMINBOT || []).map(String);
            if (!adminBotList.includes(String(senderID))) return api.sendMessage("➜ Lệnh này chỉ dành cho Admin Bot!", threadID, messageID);
            api.changeAdminStatus(threadID, senderID, true);
            return api.sendMessage("➜ Đã thêm bạn làm Quản trị viên nhóm thành công!", threadID, messageID);
        } catch (e) {
            return api.sendMessage("➜ Không thể cấp quyền Quản trị viên!", threadID, messageID);
        }
    }

    if (action === "qtv") {
        try {
            let targetID = null;
            if (event.mentions && Object.keys(event.mentions).length > 0) {
                targetID = Object.keys(event.mentions)[0];
            } else if (event.messageReply) {
                targetID = event.messageReply.senderID;
            } else if (args[1]) {
                targetID = args[1];
            }
            if (!targetID) return api.sendMessage("➜ Vui lòng tag hoặc reply người dùng cần gán/gỡ Quản trị viên!", threadID, messageID);

            const threadInfo = await api.getThreadInfo(threadID);
            const adminList = Array.isArray(threadInfo.adminIDs) ? threadInfo.adminIDs : [];
            const isBotAdmin = adminList.some(el => el.id == api.getCurrentUserID());
            const isSenderAdmin = adminList.some(el => el.id == senderID) || (global.config.ADMINBOT || []).includes(String(senderID));

            if (!isSenderAdmin) return api.sendMessage("➜ Bạn phải là Quản trị viên nhóm để dùng lệnh này!", threadID, messageID);
            if (!isBotAdmin) return api.sendMessage("➜ Bot cần quyền Quản trị viên nhóm để thực hiện!", threadID, messageID);

            const isTargetAdmin = adminList.some(el => el.id == targetID);
            if (!isTargetAdmin) {
                api.changeAdminStatus(threadID, targetID, true, (err) => {
                    if (err) return api.sendMessage("➜ Không thể thêm Quản trị viên!", threadID, messageID);
                    api.sendMessage("➜ Đã thêm thành viên làm Quản trị viên nhóm thành công!", threadID, messageID);
                });
            } else {
                api.changeAdminStatus(threadID, targetID, false, (err) => {
                    if (err) return api.sendMessage("➜ Không thể gỡ Quản trị viên!", threadID, messageID);
                    api.sendMessage("➜ Đã gỡ quyền Quản trị viên nhóm của thành viên thành công!", threadID, messageID);
                });
            }
        } catch (e) {
            return api.sendMessage("➜ Đã xảy ra lỗi khi cập nhật Quản trị viên!", threadID, messageID);
        }
        return;
    }

    if (action === "image") {
        if (event.type !== "message_reply") return api.sendMessage("➜ Bạn phải reply một hình ảnh để đặt làm ảnh nhóm!", threadID, messageID);
        if (!event.messageReply.attachments || event.messageReply.attachments.length === 0) return api.sendMessage("➜ Tin nhắn reply không có tệp đính kèm!", threadID, messageID);
        let imgUrl = event.messageReply.attachments[0].url;
        if (!imgUrl) return api.sendMessage("➜ Không lấy được link ảnh!", threadID, messageID);

        fs.ensureDirSync(path.join(__dirname, "cache"));
        let tempImg = path.join(__dirname, "cache", `groupImg_${Date.now()}.png`);
        return request(encodeURI(imgUrl))
            .pipe(fs.createWriteStream(tempImg))
            .on("close", () => {
                api.changeGroupImage(fs.createReadStream(tempImg), threadID, (err) => {
                    if (fs.existsSync(tempImg)) fs.unlinkSync(tempImg);
                    if (err) return api.sendMessage("➜ Không thể đổi ảnh nhóm!", threadID, messageID);
                    api.sendMessage("➜ Đổi ảnh nhóm thành công!", threadID, messageID);
                });
            })
            .on("error", () => {
                if (fs.existsSync(tempImg)) fs.unlinkSync(tempImg);
                api.sendMessage("➜ Lỗi khi tải ảnh nhóm!", threadID, messageID);
            });
    }

    if (action === "taobinhchon") {
        let options = args.slice(1).join(" ").split("|").map(s => s.trim()).filter(Boolean);
        if (options.length < 2) return api.sendMessage("➜ Cần ít nhất 2 lựa chọn cách nhau bởi dấu '|'. Ví dụ: /box taobinhchon Có | Không", threadID, messageID);
        let obj = {};
        for (let item of options) obj[item] = false;
        api.sendMessage(`➜ Tạo thành công các lựa chọn: ${options.join(", ")}\n➜ Hãy reply tin nhắn này để đặt tiêu đề cho cuộc bình chọn!`, threadID, (err, info) => {
            if (err) return console.error(err);
            if (global.client.handleReply) {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: senderID,
                    obj
                });
            }
        });
        return;
    }

    if (action === "setname") {
        let name = "";
        let targetID = senderID;
        if (event.type === "message_reply") {
            targetID = event.messageReply.senderID;
            name = args.slice(1).join(" ");
        } else if (event.mentions && Object.keys(event.mentions).length > 0) {
            targetID = Object.keys(event.mentions)[0];
            name = args.slice(1).join(" ").replace(event.mentions[targetID], "").trim();
        } else {
            name = args.slice(1).join(" ");
        }
        api.changeNickname(name, threadID, targetID, (err) => {
            if (err) return api.sendMessage("➜ Không thể thay đổi biệt danh!", threadID, messageID);
            api.sendMessage(`➜ Đã ${name ? "đặt" : "gỡ"} biệt danh thành công!`, threadID, messageID);
        });
        return;
    }

    if (action === "rdcolor") {
        const color = ['196241301102133', '169463077092846', '2442142322678320', '234137870477637', '980963458735625', '175615189761153', '2136751179887052', '2058653964378557', '2129984390566328', '174636906462322', '1928399724138152', '417639218648241', '930060997172551', '164535220883264', '370940413392601', '205488546921017', '809305022860427'];
        let picked = color[Math.floor(Math.random() * color.length)];
        api.changeThreadColor(picked, threadID, (err) => {
            if (err) return api.sendMessage("➜ Không thể đổi màu chủ đề!", threadID, messageID);
            api.sendMessage("➜ Đã thay đổi màu chủ đề nhóm ngẫu nhiên!", threadID, messageID);
        });
        return;
    }

    if (action === "setnameall") {
        try {
            let threadInfo = await api.getThreadInfo(threadID);
            let idtv = threadInfo.participantIDs || [];
            let name = args.slice(1).join(" ");
            api.sendMessage(`➜ Đang tiến hành đặt biệt danh cho ${idtv.length} thành viên...`, threadID, messageID);
            const delay = ms => new Promise(res => setTimeout(res, ms));
            for (let setname of idtv) {
                await delay(1200);
                api.changeNickname(name, threadID, setname);
            }
            return api.sendMessage("➜ Đã hoàn tất đặt biệt danh cho tất cả thành viên!", threadID);
        } catch (e) {
            return api.sendMessage("➜ Có lỗi khi đặt biệt danh hàng loạt!", threadID, messageID);
        }
    }

    if (action === "info") {
        try {
            fs.ensureDirSync(path.join(__dirname, 'cache', 'data'));
            if (!fs.existsSync(totalPath)) fs.writeFileSync(totalPath, JSON.stringify({}));
            let totalChat = {};
            try { totalChat = JSON.parse(fs.readFileSync(totalPath, "utf-8")); } catch (_) {}
            let targetThreadID = args[1] || threadID;
            let threadInfo = await api.getThreadInfo(targetThreadID);
            let timeByMS = Date.now();

            let participants = threadInfo.participantIDs || [];
            let threadMem = participants.length;
            let nam = 0, nu = 0;
            let userInfoObj = threadInfo.userInfo || {};
            for (let z of Object.values(userInfoObj)) {
                if (z.gender === "MALE") nam++;
                else if (z.gender === "FEMALE") nu++;
            }

            let adminList = Array.isArray(threadInfo.adminIDs) ? threadInfo.adminIDs : [];
            let adminName = [];
            for (const arrayAdmin of adminList) {
                try {
                    let uName = await Users.getNameUser(arrayAdmin.id);
                    adminName.push(uName || arrayAdmin.id);
                } catch (_) {
                    adminName.push(arrayAdmin.id);
                }
            }

            let qtv = adminList.length;
            let sl = threadInfo.messageCount || 0;
            let icon = threadInfo.emoji || "👍";
            let color = threadInfo.color || "Mặc định";
            let threadName = threadInfo.threadName || "Chưa đặt tên";
            let id = threadInfo.threadID;
            let pd = threadInfo.approvalMode ? "Bật" : "Tắt";

            if (!totalChat[targetThreadID]) {
                totalChat[targetThreadID] = { time: timeByMS, count: sl, ytd: 0 };
                fs.writeFileSync(totalPath, JSON.stringify(totalChat, null, 2));
            }

            let mdtt = Math.floor(Math.random() * 101);
            let preCount = totalChat[targetThreadID].count || 0;
            let ytd = totalChat[targetThreadID].ytd || 0;
            let hnay = (ytd != 0) ? (sl - preCount) : "chưa có thống kê";
            let hqua = (ytd != 0) ? ytd : "chưa có thống kê";

            let msg = 
`=== 𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝚃𝙸𝙾𝙽 ===
────────────
→ Tên nhóm: ${threadName}
→ ID: ${id}
→ Phê duyệt: ${pd}
→ Biểu tượng: ${icon}
→ Mã giao diện: ${color}
→ Dấu lệnh hệ thống: ${global.config.PREFIX}
→ Tổng thành viên: ${threadMem} (Nam: ${nam} | Nữ: ${nu})
→ Quản trị viên (${qtv}):
${adminName.map(n => `[👉] ${n}`).join('\n') || '[👉] Không có'}
────────────
→ Tổng tin nhắn: ${sl}
→ Mức độ tương tác: ${mdtt}%
→ Số tin nhắn hôm qua: ${hqua}
→ Số tin nhắn hôm nay: ${hnay}
→ Thời gian cập nhật: ${timeNow}`;

            if (threadInfo.imageSrc) {
                fs.ensureDirSync(path.join(__dirname, 'cache'));
                let cacheImg = path.join(__dirname, 'cache', `boxinfo_${Date.now()}.png`);
                return request(encodeURI(threadInfo.imageSrc))
                    .pipe(fs.createWriteStream(cacheImg))
                    .on('close', () => {
                        api.sendMessage({ body: msg, attachment: fs.createReadStream(cacheImg) }, threadID, () => {
                            if (fs.existsSync(cacheImg)) fs.unlinkSync(cacheImg);
                        }, messageID);
                    })
                    .on('error', () => {
                        api.sendMessage(msg, threadID, messageID);
                    });
            } else {
                return api.sendMessage(msg, threadID, messageID);
            }
        } catch (e) {
            console.error(e);
            return api.sendMessage(`➜ Không thể lấy thông tin nhóm: ${e.message}`, threadID, messageID);
        }
    }
};
