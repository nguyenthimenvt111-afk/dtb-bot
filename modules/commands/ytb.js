module.exports.config = {
    name: 'ytb',
    version: '1.0.0',
    hasPermssion: 0,
    credits: "dtb",
    description: 'Phát nhạc hoặc video thông qua link YouTube hoặc từ khoá tìm kiếm',
    commandCategory: 'Tiện ích',
    usages: 'video < keyword/url >',
    cooldowns: 5,
    dependencies: {
        'moment-timezone': '',
        'axios': '',
        'fs-extra': '',
        'ytdl-core': '',
        'axios': '',
        '@ffmpeg-installer/ffmpeg': '',
        'fluent-ffmpeg': ''
    }
};
module.exports.onLoad = () => {
    const fs = require("fs-extra");
    const request = require("request");
    const dirMaterial = __dirname + `/noprefix/`;
    if (!fs.existsSync(dirMaterial + "noprefix")) fs.mkdirSync(dirMaterial, { recursive: true });
    if (!fs.existsSync(dirMaterial + "ytb.jpeg")) request("https://i.imgur.com/k0VJ9lA.jpeg").pipe(fs.createWriteStream(dirMaterial + "ytb.jpeg"));
      }
const mediaSavePath = __dirname + '/cache/Youtube/';
const key = "AIzaSyDjmV7xLLXZZvEA6GCwuggVUaIVcPK-SDE";
module.exports.handleReply = async function ({ api, event, handleReply }) {
    const { threadID, messageID, body, senderID } = event;
    const { author, videoID, IDs, type: reply_type } = handleReply;
    if (senderID != author) return;

    const { createWriteStream, createReadStream, unlinkSync, existsSync, mkdirSync, statSync } = global.nodemodule['fs-extra'];
    const moment = global.nodemodule['moment-timezone'];
  const fs = require("fs");
    const currentTime = moment.tz('Asia/Ho_Chi_Minh').format('HH:mm:s');

    const axios = global.nodemodule['axios'];


    const downloadMedia = async (videoID, type) => {
        const filePath = `${mediaSavePath}${Date.now()}${senderID}.${(type == 'video') ? 'mp4' : 'm4a'}`;
        const errObj = {
            filePath,
            error: 1
        };
        try {
            const mediaObj = {
                filePath,
                error: 0
            }

            let ytdlOptions;

            if (!existsSync(mediaSavePath)) mkdirSync(mediaSavePath, { recursive: true });

            if (type == 'video') {
                ytdlOptions = { quality: '18' };
            } else {
                ytdlOptions = { filter: 'audioonly' };
            }
            await new Promise((resolve, reject) => {
                const ytdl = global.nodemodule['ytdl-core'];
                const ffmpeg = global.nodemodule['fluent-ffmpeg'];
                const startTime = Date.now();
                const stream = ytdl('https://www.youtube.com/watch?v=' + videoID, ytdlOptions)

                if (type == 'video') {
                    stream
                        .pipe(createWriteStream(filePath))
                        .on('error', (err) => {
                            reject(err);
                        })
                        .on('close', () => {
                            resolve()
                        })
                } else {
                    ffmpeg.setFfmpegPath(global.nodemodule['@ffmpeg-installer/ffmpeg'].path);

                    ffmpeg(stream)
                        .audioCodec("aac")
                        // .bitrate(128)
                        .save(filePath)
                        .on("error", err => {
                            reject(err);
                        })
                        .on("end", () => {
                            console.log('Đã tải xuống, chuyển đổi trong ' + (Date.now() - startTime) + 'ms');
                            resolve();
                        })
                }

            });

            return mediaObj;
        } catch (e) {
            console.log(e)
            return errObj;
        }
    }

    switch (reply_type) {
        case 'download':
            {
                const { filePath, error } = await downloadMedia(videoID, body == '1' ? 'video' : 'audio');

                const mediaData = {
                    title: (await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoID}&key=${key}`)).data.items[0].snippet.title,
                    duration: prettyTime((await axios.get(encodeURI(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoID}&key=${key}`))).data.items[0].contentDetails.duration)
                }

                if (error != 0) {
                    api.sendMessage('➜ Đã có lỗi xảy ra', threadID, messageID);
                    if (existsSync(filePath)) unlinkSync(filePath);
                } else {
                    api.unsendMessage(handleReply.messageID);
                    if ((statSync(filePath).size > 50331648 && body == 1) || (statSync(filePath).size > 26214400 && body == 2)) {
                        api.sendMessage('➜ Không thể gửi vì kích thước tệp quá lớn', threadID, messageID);
                        unlinkSync(filePath);
                    } else {
                        api.sendMessage({
                            body: `=====『 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 』=====\n\n➜ 𝗧𝗶𝗲̂𝘂 đ𝗲̂̀: ${mediaData.title}\n➜ 𝗧𝗵𝗼̛̀𝗶 𝗴𝗶𝗮𝗻: ${mediaData.duration}`,
                            attachment: createReadStream(filePath)
                        }, threadID, (err) => {
                            if (err) {
                                console.log(err);
                                api.sendMessage('➜ Đã có lỗi xảy ra', threadID, messageID);
                            }
                            if (existsSync(filePath)) unlinkSync(filePath);
                        }, messageID);
                    }
                }
                break;
            }
        case 'list':
            {
                if (isNaN(body) || body < 1 || body > IDs.length) {
                    api.sendMessage('➜ Vui lòng chọn số từ 1 đến ' + IDs.length, threadID, messageID);
                } else {
                    api.unsendMessage(handleReply.messageID);
                    const chosenIndex = parseInt(body) - 1;
                    const chosenID = IDs[chosenIndex];
      api.sendMessage({body: '====『 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 𝗟𝗨̛̣𝗔 𝗖𝗛𝗢̣𝗡 』====\n➜ 𝗩𝘂𝗶 𝗹𝗼̀𝗻𝗴 𝗽𝗵𝗮̉𝗻 𝗵𝗼̂̀𝗶 𝘁𝗶𝗻 𝗻𝗵𝗮̆́𝗻 𝗻𝗮̀𝘆 𝘃𝗼̛́𝗶 𝗰𝗮́𝗰 𝗹𝘂̛̣𝗮 𝗰𝗵𝗼̣𝗻 𝗱𝘂̛𝗼̛́𝗶 đ𝗮̂𝘆:\n\n𝟭. 𝗧𝗮̉𝗶 𝘃𝗶𝗱𝗲𝗼\n𝟮. 𝗧𝗮̉𝗶 𝗮̂𝗺 𝘁𝗵𝗮𝗻𝗵', attachment: fs.createReadStream(__dirname + `/noprefix/ytb.jpeg`)}, event.threadID, 
          (error, info) => {
                            if (error) {
                                console.log(error);
                                api.sendMessage('➜ Lỗi khi thực hiện yêu cầu', threadID, messageID);
                            } else {
                                global.client.handleReply.push({
                                    type: 'download',
                                    name: this.config.name,
                                    messageID: info.messageID,
                                    author: senderID,
                                    videoID: chosenID
                                })
                            }
                        },
                        messageID);
                }

            }
    }
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    if (args.length == 0) return api.sendMessage('➜ Phần tìm kiếm không được để trống', threadID, messageID);
    const input = args.join(' ');
    const urlPatten = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/gm;
    const isValidUrl = urlPatten.test(input);

    const axios = global.nodemodule['axios'];


    const getBasicInfo = async (keyword) => {
        try {
            const mediaData = (await axios.get(encodeURI(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=${keyword}&type=video&key=${key}`))).data.items;
            return mediaData;
        } catch (e) {
            throw e;
        }
    }

    try {
        if (isValidUrl) {
            let videoID = input.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
            (videoID[2] !== undefined) ? videoID = videoID[2].split(/[^0-9a-z_\-]/i)[0] : videoID = videoID[0];

            api.sendMessage('====『 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 𝗟𝗨̛̣𝗔 𝗖𝗛𝗢̣𝗡 』====\n➜ 𝗩𝘂𝗶 𝗹𝗼̀𝗻𝗴 𝗽𝗵𝗮̉𝗻 𝗵𝗼̂̀𝗶 𝘁𝗶𝗻 𝗻𝗵𝗮̆́𝗻 𝗻𝗮̀𝘆 𝘃𝗼̛́𝗶 𝗰𝗮́𝗰 𝗹𝘂̛̣𝗮 𝗰𝗵𝗼̣𝗻 𝗱𝘂̛𝗼̛́𝗶 đ𝗮̂𝘆:\n\n𝟭. 𝗧𝗮̉𝗶 𝘃𝗶𝗱𝗲𝗼\n𝟮. 𝗧𝗮̉𝗶 𝗮̂𝗺 𝘁𝗵𝗮𝗻𝗵', threadID, (error, info) => {
                    if (error) {
                        console.log(error);
                    } else {
                        global.client.handleReply.push({
                            type: 'download',
                            name: this.config.name,
                            messageID: info.messageID,
                            author: senderID,
                            videoID
                        })
                    }
                },
                messageID);
        } else {
            let IDs = [],
                msg = '',
                result = await getBasicInfo(input);

            for (let i = 0; i < result.length; i++) {
                const id = result[i].id.videoId;
                if (id !== undefined) {
                    IDs.push(id);
                    const mediaDuration = (await axios.get(encodeURI(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${id}&key=${key}`))).data.items[0].contentDetails.duration;
                    msg += `\n━━━━━━━━━━━━━━━━━━\n${i + 1}. ${result[i].snippet.title}\n➜ 𝗧𝗵𝗼̛̀𝗶 𝗴𝗶𝗮𝗻 𝘃𝗶𝗱𝗲𝗼: ${prettyTime(mediaDuration)}`;
                }
            }

            msg = `➜ 𝗖𝗼́ ${IDs.length} 𝗸𝗲̂́𝘁 𝗾𝘂𝗮̉ 𝘁𝗿𝘂̀𝗻𝗴 𝘃𝗼̛́𝗶 𝘁𝘂̛̀ 𝗸𝗵𝗼𝗮́ 𝘁𝗶̀𝗺 𝗸𝗶𝗲̂́𝗺 𝗰𝘂̉𝗮 𝗯𝗮̣𝗻:${msg}\n━━━━━━━━━━━━━━━━━━\n➜ 𝗛𝗮̃𝘆 𝗽𝗵𝗮̉𝗻 𝗵𝗼̂̀𝗶 𝘁𝗶𝗻 𝗻𝗵𝗮̆́𝗻 𝗻𝗮̀𝘆 𝗰𝗵𝗼̣𝗻 𝗺𝗼̣̂𝘁 𝘁𝗿𝗼𝗻𝗴 𝗻𝗵𝘂̛̃𝗻𝗴 𝘁𝗶̀𝗺 𝗸𝗶𝗲̂́𝗺 𝘁𝗿𝗲̂𝗻`
            api.sendMessage(msg, threadID, (error, info) => {
                if (error) {
                    console.log(error);
                } else {
                    global.client.handleReply.push({
                        type: 'list',
                        name: this.config.name,
                        messageID: info.messageID,
                        author: senderID,
                        IDs
                    })
                }
            }, messageID);
        }
    } catch (e) {
        api.sendMessage('➜ Đã xảy ra lỗi:\n' + e, threadID, messageID);
    }


    return;
}

const prettyTime = (time) => {
    let newTimeArray = [];
    time = time.slice(2);

    if (time.includes('H')) {
        newTimeArray.push(time.split('H')[0]);
        time = time.split('H')[1];
    } else newTimeArray.push(0);
    if (time.includes('M')) {
        newTimeArray.push(time.split('M')[0]);
        time = time.split('M')[1];
    } else newTimeArray.push(0);
    if (time.includes('S')) {
        newTimeArray.push(time.split('S')[0]);
    } else newTimeArray.push(0);

    newTimeArray = newTimeArray.map(item => {
        if (parseInt(item) < 10) {
            return '0' + item;
        } else return item;
    })

    return newTimeArray.join(':');
}
