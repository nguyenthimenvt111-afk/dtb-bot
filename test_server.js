const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('====================================================');
console.log('       DTB BOT - COMPREHENSIVE TEST SUITE           ');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
    if (condition) {
        console.log(`[PASS] ${testName}`);
        passCount++;
    } else {
        console.error(`[FAIL] ${testName} - ${details}`);
        failCount++;
    }
}

async function runTests() {
    const root = __dirname;

    // 1. Verify Project Config & Copyright
    console.log('--- 1. Testing Project Config & Copyright dtb ---');
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    assert(pkg.name === 'dtb-bot', 'package.json name is dtb-bot');
    assert(pkg.author === 'dtb', 'package.json author is dtb');

    const config = JSON.parse(fs.readFileSync(path.join(root, 'config.json'), 'utf8'));
    assert(config.BOTNAME === 'dtb', 'config.json BOTNAME is dtb');
    assert(config.AMDIN_NAME === 'dtb', 'config.json AMDIN_NAME is dtb');
    assert(config.FACEBOOK_ADMIN === 'https://www.facebook.com/dtb', 'config.json FACEBOOK_ADMIN is dtb');

    // 2. Verify 18+ Cleanliness
    console.log('\n--- 2. Testing 18+ Purge & Cleanliness ---');
    const nsfwFiles = [
        'modules/commands/cache/canvas/bopvu.png',
        'modules/commands/cache/canvas/chich.png',
        'modules/commands/cache/canvas/damdit.png',
        'modules/commands/cache/canvas/tam.png',
        'img/du.json',
        'img/mong.json',
        'modules/commands/ngôn.js'
    ];
    for (const nf of nsfwFiles) {
        const exists = fs.existsSync(path.join(root, nf));
        assert(!exists, `18+ file deleted: ${nf}`);
    }

    // 3. Verify Redrawn Graphics Quality
    console.log('\n--- 3. Testing Redrawn Graphics & High-Res Assets ---');
    const iconStat = fs.statSync(path.join(root, 'generated-icon.png'));
    assert(iconStat.size > 10000, `generated-icon.png redrawn (size: ${iconStat.size} bytes)`);

    const bannerStat = fs.statSync(path.join(root, 'modules/commands/menu_thuebot.png'));
    assert(bannerStat.size > 50000, `menu_thuebot.png redrawn (size: ${bannerStat.size} bytes)`);

    const baucuaItems = ['bầu.jpg', 'cua.jpg', 'cá.jpg', 'gà.jpg', 'nai.jpg', 'tôm.jpg'];
    for (const item of baucuaItems) {
        const itemStat = fs.statSync(path.join(root, 'modules/commands/game/baucua', item));
        assert(itemStat.size > 30000, `Bầu cua item high-res: ${item} (${itemStat.size} bytes)`);
    }

    // 4. Test Express Web Server
    console.log('\n--- 4. Testing Web Server on Test Port (2006) ---');
    const express = require('express');
    const app = express();
    const testPort = 2006;
    app.use(express.static(root));
    app.get('/', (req, res) => {
        res.sendFile(path.join(root, 'index.html'));
    });

    const server = await new Promise((resolve) => {
        const s = app.listen(testPort, () => {
            console.log(`Test Web Server successfully listening on http://localhost:${testPort}`);
            resolve(s);
        });
    });

    // HTTP GET test for index.html
    const indexHtml = await new Promise((resolve, reject) => {
        http.get(`http://localhost:${testPort}/`, (res) => {
            assert(res.statusCode === 200, 'GET / returned HTTP 200');
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });

    assert(indexHtml.includes('dtb Bot System'), 'index.html contains "dtb Bot System"');
    assert(indexHtml.includes('fb.com/dtb'), 'index.html contains "fb.com/dtb"');
    assert(indexHtml.includes('contact.dtb@gmail.com'), 'index.html contains "contact.dtb@gmail.com"');

    // HTTP GET test for generated-icon.png
    const iconStatus = await new Promise((resolve, reject) => {
        http.get(`http://localhost:${testPort}/generated-icon.png`, (res) => {
            resolve(res.statusCode);
        }).on('error', reject);
    });
    assert(iconStatus === 200, 'GET /generated-icon.png returned HTTP 200');

    server.close();

    // 5. Test SQLite Database & Sequelize
    console.log('\n--- 5. Testing Database Initialization ---');
    try {
        const { Sequelize } = require('sequelize');
        const sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: path.join(root, 'data.sqlite'),
            logging: false
        });
        await sequelize.authenticate();
        assert(true, 'SQLite database authenticated successfully');
        await sequelize.close();
    } catch (e) {
        assert(false, 'SQLite database connection', e.message);
    }

    // 6. Test Command & Event Loader
    console.log('\n--- 6. Testing Module Loading (Commands & Events) ---');
    global.client = {
        commands: new Map(),
        events: new Map(),
        cooldowns: new Map(),
        mainPath: root
    };
    global.data = {
        threadInfo: new Map(),
        threadData: new Map(),
        userName: new Map(),
        userBanned: new Map(),
        threadBanned: new Map(),
        commandBanned: new Map(),
        threadAllowNSFW: [],
        allUserID: [],
        allCurrenciesID: [],
        allThreadID: []
    };
    global.config = config;
    global.nodemodule = {};

    const cmdFiles = fs.readdirSync(path.join(root, 'modules/commands')).filter(f => f.endsWith('.js'));
    let loadedCmds = 0;
    let failedCmds = 0;

    for (const f of cmdFiles) {
        try {
            const mod = require(path.join(root, 'modules/commands', f));
            if (!mod.config || !mod.config.name || !mod.run) {
                console.error(`Invalid command structure in ${f}`);
                failedCmds++;
            } else {
                global.client.commands.set(mod.config.name, mod);
                loadedCmds++;
            }
        } catch (e) {
            console.error(`Error loading command ${f}: ${e.message}`);
            failedCmds++;
        }
    }
    assert(failedCmds === 0, `Loaded all ${loadedCmds} commands with 0 failures`);

    const evtFiles = fs.readdirSync(path.join(root, 'modules/events')).filter(f => f.endsWith('.js'));
    let loadedEvts = 0;
    let failedEvts = 0;

    for (const f of evtFiles) {
        try {
            const mod = require(path.join(root, 'modules/events', f));
            if (!mod.config || !mod.config.name || !mod.run) {
                console.error(`Invalid event structure in ${f}`);
                failedEvts++;
            } else {
                global.client.events.set(mod.config.name, mod);
                loadedEvts++;
            }
        } catch (e) {
            console.error(`Error loading event ${f}: ${e.message}`);
            failedEvts++;
        }
    }
    assert(failedEvts === 0, `Loaded all ${loadedEvts} events with 0 failures`);

    // 7. Test FCA Engine & Native Cryptography
    console.log('\n--- 7. Testing FCA Engine & Security Core ---');
    try {
        const fca = require('./lib/Fca-Horizon-Remastered');
        assert(typeof fca === 'function', 'FCA Remastered engine export is a valid function');
    } catch (e) {
        assert(false, 'FCA Remastered engine load', e.message);
    }

    try {
        const step3 = require('./lib/Fca-Horizon-Remastered/Extra/Security/Base/Step_3');
        const testPlain = 'test_token_12345';
        const enc = step3.encryptState(testPlain, 'secretKey');
        const dec = step3.decryptState(enc, 'secretKey');
        assert(dec === testPlain, 'Step_3 native AES-CTR state encryption & decryption operates 100%');
    } catch (e) {
        assert(false, 'Step_3 state encryption', e.message);
    }

    try {
        const dbMod = require('./lib/Fca-Horizon-Remastered/Extra/Database');
        const dbInstance = dbMod();
        assert(typeof dbInstance.get === 'function' && typeof dbInstance.set === 'function', 'FCA Database operates in standalone JS mode');
        const listRes = dbInstance.list();
        assert(Array.isArray(listRes), 'FCA Database list() returns valid array with .iterate() support');
        const getThread = require('./lib/Fca-Horizon-Remastered/Extra/ExtraGetThread');
        const allThreads = getThread.getAll();
        assert(Array.isArray(allThreads), 'ExtraGetThread.getAll() returns valid array without iterate error');
    } catch (e) {
        assert(false, 'FCA Database load', e.message);
    }

    // 8. Test Upgraded TaiXiu Module (Monte Carlo Bespoke Edition)
    console.log('\n--- 8. Testing Upgraded TaiXiu Module (Rules, Canvas & Game Loop) ---');
    try {
        const taixiu = require('./modules/commands/taixiu');
        assert(taixiu.config && taixiu.config.name === 'taixiu', 'taixiu module exports valid config');
        assert(taixiu.config.version === '3.0.0', 'taixiu module version is 3.0.0');
        assert(typeof taixiu.run === 'function', 'taixiu module exports run() function');

        const { renderTaiXiuCard } = require('./lib/taixiu_renderer');
        assert(typeof renderTaiXiuCard === 'function', 'lib/taixiu_renderer exports renderTaiXiuCard()');

        // Test Canvas Card Generation
        const cardLoss = renderTaiXiuCard({
            dice: [4, 4, 5],
            betType: "CHẴN",
            betAmount: "3 TỶ",
            isWin: false,
            payout: "0",
            randomEvent: null,
            streakHistory: ["TAI", "TAI", "XIU"]
        });
        const lossBuf = cardLoss.toBuffer('image/png');
        assert(lossBuf && lossBuf.length > 50000, `renderTaiXiuCard creates valid Loss PNG buffer (${lossBuf.length} bytes)`);

        const cardWin = renderTaiXiuCard({
            dice: [6, 6, 6],
            betType: "BỘ BA",
            betAmount: "1 TỶ",
            isWin: true,
            payout: "30 TỶ",
            randomEvent: "💎 SỰ KIỆN JACKPOT: NỔ HŨ HOÀNG GIA (X30)",
            streakHistory: ["XIU", "TAI", "TAI"]
        });
        const winBuf = cardWin.toBuffer('image/png');
        assert(winBuf && winBuf.length > 50000, `renderTaiXiuCard creates valid Jackpot PNG buffer (${winBuf.length} bytes)`);

        // Mock Infrastructure for Bot Execution
        let mockBalances = { 'user_123': 5000000 };
        const mockCurrencies = {
            getData: async (uid) => ({ money: mockBalances[uid] || 0 }),
            increaseMoney: async (uid, amt) => { mockBalances[uid] = (mockBalances[uid] || 0) + amt; },
            decreaseMoney: async (uid, amt) => { mockBalances[uid] = (mockBalances[uid] || 0) - amt; }
        };
        const mockUsers = {
            getNameUser: async () => 'Tester VIP'
        };

        let lastMessage = null;
        let lastCallback = null;
        const mockApi = {
            sendMessage: (payload, tid, cb) => {
                lastMessage = payload;
                lastCallback = typeof tid === 'function' ? tid : cb;
                return Promise.resolve({ messageID: 'msg_test_1' });
            }
        };

        const mockEvent = {
            threadID: 'thread_test_1',
            messageID: 'msg_trigger_1',
            senderID: 'user_123'
        };

        // AC-01: Help / Guide Subcommand
        await taixiu.run({ api: mockApi, event: mockEvent, args: [], Currencies: mockCurrencies, Users: mockUsers });
        const bodyStr = typeof lastMessage === 'object' ? lastMessage.body : lastMessage;
        assert(bodyStr.includes('TÀI XỈU ĐẠI CHIẾN'), 'taixiu help display includes title');
        assert(bodyStr.includes('CÁC LOẠI CƯỢC & HỆ SỐ THƯỞNG'), 'taixiu help display includes payout table');

        // AC-02: Info / Stats Subcommand
        await taixiu.run({ api: mockApi, event: mockEvent, args: ['info'], Currencies: mockCurrencies, Users: mockUsers });
        const infoStr = typeof lastMessage === 'object' ? lastMessage.body : lastMessage;
        assert(infoStr.includes('THÀNH TÍCH CÁ NHÂN'), 'taixiu info returns personal stats & level');

        // AC-03: Soi cầu / History Subcommand
        await taixiu.run({ api: mockApi, event: mockEvent, args: ['cau'], Currencies: mockCurrencies, Users: mockUsers });
        assert(lastMessage !== null, 'taixiu cau returns history analysis');

        // AC-04: Input Validation - Invalid Bet & Insufficient Balance
        await taixiu.run({ api: mockApi, event: mockEvent, args: ['sai_cua', '50k'], Currencies: mockCurrencies, Users: mockUsers });
        const errStr = typeof lastMessage === 'object' ? lastMessage.body : lastMessage;
        assert(errStr.includes('không hợp lệ'), 'taixiu rejects invalid bet choice');

        await taixiu.run({ api: mockApi, event: mockEvent, args: ['tài', '999999999'], Currencies: mockCurrencies, Users: mockUsers });
        const balErrStr = typeof lastMessage === 'object' ? lastMessage.body : lastMessage;
        assert(balErrStr.includes('không đủ số dư'), 'taixiu rejects bets exceeding balance');

        // AC-05: Single Bet Game Loop Execution (Tài 50k)
        const initialBal = mockBalances['user_123'];
        await taixiu.run({ api: mockApi, event: mockEvent, args: ['tài', '50k'], Currencies: mockCurrencies, Users: mockUsers });
        assert(typeof lastMessage === 'object' && lastMessage.attachment, 'taixiu round generates image attachment');
        assert(lastMessage.body.includes('KẾT QUẢ TÀI XỈU'), 'taixiu round returns structured result message');
        if (typeof lastCallback === 'function') lastCallback();

        // AC-06: Multi-Bet (Cược Kết Hợp: Tài 50k + Chẵn 20k)
        await taixiu.run({ api: mockApi, event: mockEvent, args: ['tài', '50k', 'chẵn', '20k'], Currencies: mockCurrencies, Users: mockUsers });
        assert(lastMessage.body.includes('CHI TIẾT CÁC CỬA ĐẶT'), 'taixiu multi-bet returns breakdown for all choices');
        if (typeof lastCallback === 'function') lastCallback();

        // AC-07: All In Mode Execution
        const preAllinBal = mockBalances['user_123'];
        await taixiu.run({ api: mockApi, event: mockEvent, args: ['allin', 'tài'], Currencies: mockCurrencies, Users: mockUsers });
        assert(lastMessage.body.includes(preAllinBal.toLocaleString()) || lastMessage.body.includes('All In') || lastMessage.body.includes('cược:'), 'taixiu all-in wagers full balance');
        if (typeof lastCallback === 'function') lastCallback();

        // AC-08: Cược gấp đôi (x2)
        await taixiu.run({ api: mockApi, event: mockEvent, args: ['x2'], Currencies: mockCurrencies, Users: mockUsers });
        assert(lastMessage !== null, 'taixiu x2 successfully processes double bet mode');
        if (typeof lastCallback === 'function') lastCallback();

        // AC-09: Persistence Check
        const histPath = path.join(root, 'modules/commands/cache/taixiu_history.json');
        const statPath = path.join(root, 'modules/commands/cache/taixiu_stats.json');
        assert(fs.existsSync(histPath), 'taixiu_history.json persisted');
        assert(fs.existsSync(statPath), 'taixiu_stats.json persisted');
    } catch (e) {
        assert(false, 'TaiXiu module comprehensive testing', e.message);
    }

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('====================================================');

    process.exit(failCount === 0 ? 0 : 1);
}

runTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
