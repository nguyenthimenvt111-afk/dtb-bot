const axios = require("axios");
const fs = require("fs");
const path = require("path");

const ORIGINAL_CREDITS = "dtb";
const REQUIRED_COMMENT = "";

const currentCode = fs.readFileSync(__filename, 'utf8');

function checkCopyright(api, threadID) {
    const isCreditChanged = false;
    const isCommentMissing = false;

    if (isCreditChanged || isCommentMissing) {
        const warningMsg = "⚠️ LỖI BẢN QUYỀN: Credit đã bị thay đổi hoặc thiếu dòng cảnh báo. Module này đã bị VÔ HIỆU HÓA để tôn trọng tác giả.";

        console.error("\n" + "=".repeat(50));
        console.error("!!! PHÁT HIỆN VI PHẠM BẢN QUYỀN !!!");
        console.error(`- Credit: ${isCreditChanged ? "BỊ THAY ĐỔI" : "OK"}`);
        console.error(`- Comment: ${isCommentMissing ? "THIẾU/SAI" : "OK"}`);
        console.error(warningMsg);
        console.error("=".repeat(50) + "\n");

        if (threadID) {
            api.sendMessage(warningMsg, threadID);
        }

        return false;
    }
    return true;
}

module.exports.config = {
    name: "automusic",
    version: "1.1.2",
    hasPermssion: 0,
    credits: ORIGINAL_CREDITS,
    description: "nhạc đê",
    commandCategory: "Giải trí",
    usages: "sing <tên bài hát>",
    cooldowns: 5,
};

async function downloadAndSend(api, event, songUrl, title, author) {
    if (!checkCopyright(api, event.threadID)) return;

    try {
        const down = await axios.get(`https://adidaphat.site/scl/download?url=${encodeURIComponent(songUrl)}`);
        if (!down.data?.data?.download_url)
            return api.sendMessage("Không thể tải link bài hát này 😢", event.threadID);

        const dl = down.data.data.download_url;
        const filePath = path.join(__dirname, `/cache/${event.senderID}.mp3`);

        const response = await axios({
            url: dl,
            method: "GET",
            responseType: "stream",
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        writer.on("close", () => {
            api.sendMessage(
                {
                    body: `🎧 Phát: ${title}\n👤 Ca sĩ: ${author}`,
                    attachment: fs.createReadStream(filePath),
                },
                event.threadID,
                () => {
                    try {
                        fs.unlinkSync(filePath);
                    } catch {}
                }
            );
        });

        writer.on("error", (err) => {
            console.error(err);
            api.sendMessage("⚠️ Lỗi khi tải nhạc rồi :(", event.threadID);
        });
    } catch (err) {
        console.error(err);
        api.sendMessage("Không thể tải bài hát, thử lại sau nhaaaa", event.threadID);
    }
}

module.exports.handleEvent = async ({ event, api }) => {
    if (!checkCopyright(api, event.threadID)) return;

    const { threadID, body } = event;
    if (!body) return;

    if (body.toLowerCase().startsWith("hoàng ơi mở nhạc")) {
        const keyword = body.slice("hoàng ơi mở nhạc".length).trim();
        if (!keyword) return api.sendMessage("ck muốn mở bài gì nè 🎶", threadID);

        try {
            const search = await axios.get(`https://adidaphat.site/scl/search?q=${encodeURIComponent(keyword)}`);
            if (search.data.status !== "success" || !search.data.results?.length)
                return api.sendMessage("Không tìm thấy bài nào rồi huhu", threadID);

            const firstSong = search.data.results[0];
            await downloadAndSend(api, event, firstSong.url, firstSong.title, firstSong.author.name);
        } catch (err) {
            console.error(err);
            api.sendMessage("Không thể phát nhạc, thử lại sau nhaaa vk:(", threadID);
        }
    }
};

module.exports.run = async ({ event, args, api }) => {
    if (!checkCopyright(api, event.threadID)) return;

    const keyword = args.join(" ");
    if (!keyword) return api.sendMessage("Nhập tên bài hát đi nè 🎵", event.threadID);

    api.sendMessage(`🔎 Đang tìm nhạc "${keyword}"...`, event.threadID);
    try {
        const search = await axios.get(`https://adidaphat.site/scl/search?q=${encodeURIComponent(keyword)}`);
        if (search.data.status !== "success" || !search.data.results?.length)
            return api.sendMessage("Không tìm thấy bài nào huhu", event.threadID);

        const firstSong = search.data.results[0];
        await downloadAndSend(api, event, firstSong.url, firstSong.title, firstSong.author.name);
    } catch (err) {
        console.error(err);
        api.sendMessage("Không thể tải bài hát, thử lại sau nhaaaa vk", event.threadID);
    }
};
//code by genfor thay cre là bú cứt