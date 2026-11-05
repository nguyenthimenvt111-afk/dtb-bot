module.exports.config = {
    name: "kickndfb",
    version: "1.1.0",
    hasPermssion: 1,
    credits: "dtb",
    description: "Lọc người dùng Facebook bị die hoặc không tồn tại",
    commandCategory: "Quản Lí Box",
    usages: "kickndfb",
    cooldowns: 15
};

module.exports.run = async function({ api, event }) {
    try {
        const { userInfo, adminIDs } = await api.getThreadInfo(event.threadID);
        const users = Array.isArray(userInfo) ? userInfo : Object.values(userInfo || {});
        const adminList = (Array.isArray(adminIDs) ? adminIDs : []).map(e => String(e.id));
        const isBotAdmin = adminList.includes(String(api.getCurrentUserID()));

        let arr = [];
        for (const e of users) {
            if (e.gender === undefined || !e.name || e.name === "Người dùng Facebook") {
                arr.push(String(e.id));
            }
        }

        if (arr.length === 0) {
            return api.sendMessage("➜ Trong nhóm không tồn tại 'Người dùng Facebook'.", event.threadID, event.messageID);
        }

        if (!isBotAdmin) {
            return api.sendMessage(`➜ Nhóm hiện có ${arr.length} 'Người dùng Facebook', nhưng Bot không phải Quản trị viên nên không thể lọc!`, event.threadID, event.messageID);
        }

        api.sendMessage(`➜ Phát hiện ${arr.length} 'Người dùng Facebook'. Bắt đầu lọc...`, event.threadID, async () => {
            let success = 0, fail = 0;
            for (const uid of arr) {
                try {
                    await new Promise(r => setTimeout(r, 1200));
                    await api.removeUserFromGroup(uid, event.threadID);
                    success++;
                } catch (_) {
                    fail++;
                }
            }
            let msg = `➜ Đã lọc thành công ${success} 'Người dùng Facebook'.`;
            if (fail > 0) msg += ` Thất bại: ${fail}.`;
            api.sendMessage(msg, event.threadID);
        });
    } catch (e) {
        console.error("Lỗi kickndfb:", e);
        return api.sendMessage("➜ Không thể thực hiện lọc người dùng Facebook!", event.threadID, event.messageID);
    }
};
