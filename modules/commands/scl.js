let scdl;
try {
  scdl = require('soundcloud-downloader').default;
} catch {
  scdl = { search: async () => ({ collection: [] }) };
}
const fs = require('fs')
const path = require('path')
const axios = require('axios')

module.exports.config = {
    name: "scl",
    version: "1.0.2",
    hasPermssion: 0,
    credits: "dtb",
    description: "Tìm kiếm và tải nhạc từ SoundCloud",
    commandCategory: "Nhạc",
    usages: "[tên bài hát]",
    cooldowns: 5,
};

const searchResults = {};

async function searchTracks(keyword, limit = 5) {
    const searchResult = await scdl.search({
        query: keyword,
        limit: limit,
        resourceType: 'tracks'
    });

    if (!searchResult || !searchResult.collection || searchResult.collection.length === 0) {
        return [];
    }

    return searchResult.collection.map(track => ({
        title: track.title,
        artist: track.user.username,
        duration: formatDuration(track.duration),
        url: track.permalink_url,
        playCount: track.playback_count,
        likeCount: track.likes_count
    }));
}

async function downloadTrack(url) {
    const track = await scdl.getInfo(url);
    const stream = await scdl.downloadFormat(url, 'audio/mpeg');

    const fileName = `${track.user.username} - ${track.title}.mp3`.replace(/[/\\?%*:|"<>]/g, '-');
    const filePath = path.join(__dirname, fileName);

    return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(filePath);
        stream.pipe(writeStream);
        stream.on('end', () => resolve({ ...track, filePath }));
        stream.on('error', reject);
    });
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const keyword = args.join(" ");

    if (!keyword) {
        return api.sendMessage("Vui lòng nhập tên bài hát cần tìm.", threadID, messageID);
    }

    try {
        const tracks = await searchTracks(keyword);
        if (tracks.length === 0) {
            return api.sendMessage("Không tìm thấy bài hát nào.", threadID, messageID);
        }

        let msg = "🎧 Kết quả tìm kiếm:\n\n";
        tracks.forEach((track, index) => {
            msg += `${index + 1}. ${track.title} \n 👤 Ca sĩ: ${track.artist}\n\n`;
        });
        msg += "Reply với số thứ tự để tải bài hát.";

        searchResults[senderID] = tracks;

        return api.sendMessage(msg, threadID, (error, info) => {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID,
                type: "result"
            });
        }, messageID);
    } catch (error) {
        console.error(error);
        return api.sendMessage("Đã xảy ra lỗi khi tìm kiếm bài hát.", threadID, messageID);
    }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;

    if (handleReply.author != senderID) return;

    const choice = parseInt(body);
    if (isNaN(choice) || choice <= 0 || choice > searchResults[senderID].length) {
        return api.sendMessage("Lựa chọn không hợp lệ.", threadID, messageID);
    }

    const selectedTrack = searchResults[senderID][choice - 1];

    api.unsendMessage(handleReply.messageID);

    try {
        const downloadResult = await downloadTrack(selectedTrack.url);
        const attachment = fs.createReadStream(downloadResult.filePath);

        const trackInfo = `
🎵 Bài hát: ${downloadResult.title}
🎤 Nghệ sĩ: ${downloadResult.user.username}
⏱ Thời lượng: ${formatDuration(downloadResult.duration)}
👁 Lượt nghe: ${downloadResult.playback_count.toLocaleString()}
❤ Lượt thích: ${downloadResult.likes_count.toLocaleString()}
        `.trim();

        await api.sendMessage(
            {
                body: trackInfo,
                attachment: attachment
            },
            threadID,
            () => fs.unlinkSync(downloadResult.filePath),
            messageID
        );
    } catch (error) {
        console.error(error);
        return api.sendMessage("Đã xảy ra lỗi khi tải xuống bài hát.", threadID, messageID);
    }

    delete searchResults[senderID];
};