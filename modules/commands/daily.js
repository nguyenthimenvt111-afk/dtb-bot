module.exports.config = {
  name: "daily",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "dtb",
  description: "Nhận 500 coins mỗi ngày!",
  commandCategory: "Tiện ích",
    cooldowns: 5,
    envConfig: {
        cooldownTime: 43200000,
        rewardCoin: 500
    }
};

module.exports.languages = {
    "vi": {
        "cooldown": "𝐁𝐚̣𝐧 𝐡𝐢𝐞̣̂𝐧 𝐭𝐫𝐨𝐧𝐠 𝐭𝐡𝐨̛̀𝐢 𝐠𝐢𝐚𝐧 𝐜𝐡𝐨̛̀\n𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐭𝐡𝐮̛̉ 𝐥𝐚̣𝐢 𝐬𝐚𝐮: %1 giờ %2 phút %3 giây!",
        "rewarded": "𝐁𝐚̣𝐧 𝐯𝐮̛̀𝐚 𝐧𝐡𝐚̣̂𝐧 %1$, 𝐍𝐞̂́𝐮 𝐦𝐮𝐨̂́𝐧 𝐭𝐢𝐞̂́𝐩 𝐭𝐮̣𝐜 𝐧𝐡𝐚̣̂𝐧, 𝐯𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐪𝐮𝐚𝐲 𝐥𝐚̣𝐢 𝐬𝐚𝐮 𝟏𝟐 𝐭𝐢𝐞̂́𝐧𝐠"
    },
    "en": {
        "cooldown": "You received today's rewards, please come back after: %1 hours %2 minutes %3 seconds.",
        "rewarded": "You received %1$, to continue to receive, please try again after 12 hours"
    }
}

module.exports.run = async ({ event, api, Currencies, getText }) => {
    const { daily } = global.configModule,
        cooldownTime = daily.cooldownTime,
        rewardCoin = daily.rewardCoin;

    var { senderID, threadID } = event;

    let data = (await Currencies.getData(senderID)).data || {};
    if (typeof data !== "undefined" && cooldownTime - (Date.now() - (data.dailyCoolDown || 0)) > 0) {
        var time = cooldownTime - (Date.now() - data.dailyCoolDown),
            seconds = Math.floor( (time/1000) % 60 ),
            minutes = Math.floor( (time/1000/60) % 60 ),
            hours = Math.floor( (time/(1000*60*60)) % 24 );

    return api.sendMessage(getText("cooldown", hours, minutes, (seconds < 10 ? "0" : "") + seconds), threadID);
    }

    else return api.sendMessage(getText("rewarded", rewardCoin), threadID, async () => {
        await Currencies.increaseMoney(senderID, rewardCoin);
        data.dailyCoolDown = Date.now();
        await Currencies.setData(senderID, { data });
        return;
    });
}