module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");
    const moment = require("moment-timezone");

    return function ({ event }) {
        const timeStart = Date.now();
        const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
        const { userBanned, threadBanned } = global.data;
        const { events } = global.client;
        const { allowInbox, DeveloperMode } = global.config;

        const checkID = String(event.author || event.senderID || "");
        const threadID = String(event.threadID || "");

        if (checkID && userBanned.has(checkID)) return;
        if (threadID && threadBanned.has(threadID)) return;
        if (allowInbox === false && checkID && threadID && checkID === threadID) return;

        for (const [key, value] of events.entries()) {
            if (value.config && Array.isArray(value.config.eventType) && value.config.eventType.indexOf(event.logMessageType) !== -1) {
                const eventRun = events.get(key);
                try {
                    const Obj = { api, event, models, Users, Threads, Currencies };
                    Promise.resolve(eventRun.run(Obj)).catch(error => {
                        logger(global.getText('handleEvent', 'eventError', eventRun.config.name, String(error && error.message ? error.message : error)), "error");
                    });
                    if (DeveloperMode == true) {
                        logger(global.getText('handleEvent', 'executeEvent', time, eventRun.config.name, threadID, Date.now() - timeStart), '[ Event ]');
                    }
                } catch (error) {
                    logger(global.getText('handleEvent', 'eventError', eventRun.config.name, JSON.stringify(error)), "error");
                }
            }
        }
        return;
    };
};
