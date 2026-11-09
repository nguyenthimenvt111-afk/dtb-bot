/**
 * TÀI XỈU ĐẠI CHIẾN - MONTE CARLO BESPOKE EDITION
 * Phiên bản: 3.0.0
 * Tác giả: dtb
 * Tích hợp: 8 loại cược, cược kết hợp, All In, cược nhân đôi, sự kiện ngẫu nhiên, hệ thống cấp bậc & card đồ họa 3D siêu nét
 */

const fs = require("fs-extra");
const path = require("path");
const { renderTaiXiuCard } = require("../../lib/taixiu_renderer");

const cacheDir = path.join(__dirname, "cache");
fs.ensureDirSync(cacheDir);

const historyFile = path.join(cacheDir, "taixiu_history.json");
const statsFile = path.join(cacheDir, "taixiu_stats.json");

// Helper: Đọc / ghi file JSON an toàn
function readJSON(file, defaultVal = {}) {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify(defaultVal, null, 2), "utf8");
            return defaultVal;
        }
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (_) {
        return defaultVal;
    }
}

function writeJSON(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
    } catch (_) {}
}

// Helper: Format số tiền gọn đẹp (ví dụ: 1.5M, 3 Tỷ, 50K)
function formatMoney(amount) {
    const num = Math.abs(Number(amount) || 0);
    if (num >= 1e9) {
        return (num / 1e9).toFixed(1).replace(/\.0$/, "") + " TỶ";
    }
    if (num >= 1e6) {
        return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1e3) {
        return (num / 1e3).toFixed(0) + "K";
    }
    return num.toLocaleString("vi-VN");
}

// Helper: Phân tích số tiền cược từ chuỗi (50k, 1m, 2t, allin, all)
function parseAmount(str, userBalance = 0) {
    if (!str) return null;
    const s = String(str).toLowerCase().trim();
    if (s === "all" || s === "allin") {
        return userBalance > 0 ? userBalance : 0;
    }
    let mult = 1;
    if (s.endsWith("k")) mult = 1e3;
    else if (s.endsWith("m") || s.endsWith("tr")) mult = 1e6;
    else if (s.endsWith("t") || s.endsWith("ty") || s.endsWith("tỷ")) mult = 1e9;

    const clean = s.replace(/[^0-9.]/g, "");
    const val = parseFloat(clean);
    if (isNaN(val) || val <= 0) return null;
    return Math.floor(val * mult);
}

// Chuẩn hóa loại cược
const BET_TYPES = {
    tai: { key: "tai", name: "Tài", rate: 2, desc: "Tổng 11–18 (x2)" },
    xiu: { key: "xiu", name: "Xỉu", rate: 2, desc: "Tổng 3–10 (x2)" },
    chan: { key: "chan", name: "Chẵn", rate: 2, desc: "Tổng chẵn (x2)" },
    le: { key: "le", name: "Lẻ", rate: 2, desc: "Tổng lẻ (x2)" },
    doi: { key: "doi", name: "Đôi", rate: 2.5, desc: "Có 2 xúc xắc giống nhau (x2.5)" },
    boba: { key: "boba", name: "Bộ Ba", rate: 10, desc: "3 xúc xắc giống nhau (x10)" },
    tong3: { key: "tong3", name: "Tổng 3", rate: 30, desc: "Tổng đúng bằng 3 (x30)" },
    tong18: { key: "tong18", name: "Tổng 18", rate: 30, desc: "Tổng đúng bằng 18 (x30)" }
};

function normalizeBetChoice(raw) {
    if (!raw) return null;
    const s = String(raw).toLowerCase().trim();
    if (["tai", "tài", "t"].includes(s)) return "tai";
    if (["xiu", "xỉu", "x"].includes(s)) return "xiu";
    if (["chan", "chẵn", "c"].includes(s)) return "chan";
    if (["le", "lẻ", "l"].includes(s)) return "le";
    if (["doi", "đôi", "d", "pair"].includes(s)) return "doi";
    if (["boba", "bộ ba", "bb", "triple", "3giong", "3_giong"].includes(s)) return "boba";
    if (["tong3", "t3", "tổng 3", "tong 3"].includes(s)) return "tong3";
    if (["tong18", "t18", "tổng 18", "tong 18"].includes(s)) return "tong18";
    return null;
}

// Cấp bậc theo điểm kinh nghiệm / số trận
const RANKS = [
    { level: 1, name: "Tân Thủ", minPlays: 0 },
    { level: 2, name: "Người Chơi", minPlays: 10 },
    { level: 3, name: "Cao Thủ", minPlays: 25 },
    { level: 4, name: "Đại Cao Thủ", minPlays: 50 },
    { level: 5, name: "Thần Xúc Xắc", minPlays: 100 },
    { level: 6, name: "Huyền Thoại", minPlays: 200 },
    { level: 7, name: "Đế Vương", minPlays: 500 }
];

function getRank(plays = 0, triples = 0, winStreak = 0) {
    if (winStreak >= 10 || plays >= 500) return RANKS[6];
    if (triples >= 10 || winStreak >= 7 || plays >= 200) return RANKS[5];
    if (triples >= 5 || plays >= 100) return RANKS[4];
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (plays >= RANKS[i].minPlays) return RANKS[i];
    }
    return RANKS[0];
}

module.exports.config = {
    name: "taixiu",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Tài Xỉu Đại Chiến - Monte Carlo Haute Casino Edition với 8 loại cược, All In, cược kết hợp, sự kiện ngẫu nhiên và card đồ họa 3D",
    commandCategory: "Trò Chơi",
    usages: "[tài/xỉu/chẵn/lẻ/đôi/boba/tong3/tong18/allin] [số tiền] | info | cau | top",
    cooldowns: 2
};

module.exports.run = async function({ api, event, args, Currencies, Users }) {
    const { threadID, messageID, senderID } = event;

    let userName = "Người chơi";
    try {
        userName = (await Users.getNameUser(senderID)) || userName;
    } catch (_) {}

    const userData = (await Currencies.getData(senderID)) || { money: 0 };
    const userMoney = Number(userData.money) || 0;

    // Subcommand: Hướng dẫn
    if (!args || args.length === 0 || ["help", "huongdan", "luat"].includes(args[0].toLowerCase())) {
        const msg = 
`🎲 ═════ TÀI XỈU ĐẠI CHIẾN ═════ 🎲
👑 Monte Carlo Haute Casino • Edition 2026
👤 Người chơi: ${userName} | Số dư: ${formatMoney(userMoney)} xu

🎯 CÁC LOẠI CƯỢC & HỆ SỐ THƯỞNG:
• Tài (11–18 điểm): Thắng x2
• Xỉu (3–10 điểm): Thắng x2
• Chẵn (Tổng chẵn): Thắng x2
• Lẻ (Tổng lẻ): Thắng x2
• Đôi (2 xúc xắc giống nhau): Thắng x2.5
• Bộ ba (3 xúc xắc giống nhau): Thắng x10
• Tổng 3 (1-1-1) / Tổng 18 (6-6-6): Thắng x30

⚡ CÚ PHÁP CƯỢC:
• Cược đơn: taixiu [cửa] [tiền] (VD: taixiu tài 50k, taixiu chẵn 1m)
• All In: taixiu allin [cửa] (VD: taixiu allin tài)
• Cược kết hợp: taixiu tài 50k chẵn 20k boba 10k
• Cược gấp đôi sau khi thua: taixiu x2 (hoặc taixiu gapdoi)
• Xem soi cầu: taixiu cau (hoặc taixiu history)
• Xem thành tích & cấp bậc: taixiu info (hoặc taixiu stats)
• Xem bảng xếp hạng: taixiu top`;
        return api.sendMessage(msg, threadID, messageID);
    }

    const sub = args[0].toLowerCase();

    // Subcommand: Xem thống kê cá nhân & Cấp bậc
    if (["info", "stats", "thongke"].includes(sub)) {
        const allStats = readJSON(statsFile, {});
        const pStat = allStats[senderID] || { plays: 0, wins: 0, losses: 0, winStreak: 0, maxWinStreak: 0, triples: 0, totalWon: 0 };
        const winRate = pStat.plays > 0 ? ((pStat.wins / pStat.plays) * 100).toFixed(1) : 0;
        const currentRank = getRank(pStat.plays, pStat.triples, pStat.winStreak);

        const msg =
`🏆 ════ THÀNH TÍCH CÁ NHÂN ════ 🏆
👤 Người chơi: ${userName}
👑 Cấp bậc: Cấp ${currentRank.level} - ${currentRank.name}
💰 Số dư hiện tại: ${formatMoney(userMoney)} xu
🎲 Tổng số ván chơi: ${pStat.plays} trận
✨ Thắng: ${pStat.wins} | Bại: ${pStat.losses} (Tỉ lệ thắng: ${winRate}%)
🔥 Chuỗi thắng hiện tại: ${pStat.winStreak} trận (Kỷ lục: ${pStat.maxWinStreak})
💎 Số lần tung Bộ Ba: ${pStat.triples} lần
💵 Tổng tiền đã ăn: +${formatMoney(pStat.totalWon)} xu`;
        return api.sendMessage(msg, threadID, messageID);
    }

    // Subcommand: Soi cầu lịch sử
    if (["cau", "history", "soicau"].includes(sub)) {
        const rawHistory = readJSON(historyFile, []);
        const history = Array.isArray(rawHistory) ? rawHistory.filter(r => r && typeof r === 'object' && Array.isArray(r.dice)) : [];
        if (history.length === 0) {
            return api.sendMessage("📊 Chưa có lịch sử phiên chơi nào được ghi nhận. Hãy lắc xúc xắc để tạo cầu!", threadID, messageID);
        }
        const recent = history.slice(-20);
        let taiCount = 0, xiuCount = 0, chanCount = 0, leCount = 0;
        const symbols = recent.map(r => {
            if (r.result === "TAI") taiCount++; else xiuCount++;
            if (r.isChan) chanCount++; else leCount++;
            return r.result === "TAI" ? "🟡 Tài" : "🔵 Xỉu";
        }).join(" ➜ ");

        const lastDice = recent[recent.length - 1].dice || [1, 2, 3];
        const lastTotal = recent[recent.length - 1].total || lastDice.reduce((a, b) => a + b, 0);
        const lastRes = recent[recent.length - 1].result || (lastTotal >= 11 ? "TAI" : "XIU");

        const msg =
`📊 ════ BẢNG SOI CẦU LỊCH SỬ ════ 📊
(20 phiên gần nhất, từ cũ ➜ mới)

${symbols}

📈 THỐNG KÊ TỶ LỆ:
• Tài: ${taiCount}/${recent.length} (${((taiCount / recent.length) * 100).toFixed(0)}%)
• Xỉu: ${xiuCount}/${recent.length} (${((xiuCount / recent.length) * 100).toFixed(0)}%)
• Chẵn: ${chanCount} phiên | Lẻ: ${leCount} phiên
🎲 Phiên mới nhất: [${lastDice.join("-")}] = ${lastTotal} điểm (${lastRes})`;
        return api.sendMessage(msg, threadID, messageID);
    }

    // Subcommand: Top đại gia / cao thủ
    if (["top", "bxh", "rank"].includes(sub)) {
        const allStats = readJSON(statsFile, {});
        const sorted = Object.entries(allStats)
            .map(([uid, st]) => ({ uid, ...st }))
            .sort((a, b) => (b.totalWon || 0) - (a.totalWon || 0))
            .slice(0, 5);

        let topMsg = "👑 ════ BẢNG XẾP HẠNG ĐẠI GIA TÀI XỈU ════ 👑\n";
        if (sorted.length === 0) {
            topMsg += "Chưa có dữ liệu bảng xếp hạng.";
        } else {
            for (let i = 0; i < sorted.length; i++) {
                let name = `Người chơi #${i + 1}`;
                try {
                    name = (await Users.getNameUser(sorted[i].uid)) || name;
                } catch (_) {}
                const r = getRank(sorted[i].plays, sorted[i].triples, sorted[i].winStreak);
                topMsg += `${i + 1}. ${name} - ${formatMoney(sorted[i].totalWon)} xu (Cấp ${r.level} ${r.name})\n`;
            }
        }
        return api.sendMessage(topMsg, threadID, messageID);
    }

    // =================== XỬ LÝ ĐẶT CƯỢC ===================
    const allStats = readJSON(statsFile, {});
    const userStat = allStats[senderID] || {
        plays: 0, wins: 0, losses: 0, winStreak: 0, maxWinStreak: 0, triples: 0, totalWon: 0, lastBet: null
    };

    let bets = []; // Mảng các cược: [{ type: 'tai', amount: 50000 }]

    // 1. Kiểm tra cược nhân đôi (x2, gapdoi)
    if (["x2", "double", "gapdoi"].includes(sub)) {
        if (!userStat.lastBet || !userStat.lastBet.bets || userStat.lastBet.bets.length === 0) {
            return api.sendMessage("❌ Bạn chưa có phiên cược trước đó để nhân đôi!", threadID, messageID);
        }
        // Nhân đôi tiền của từng cược ở ván trước
        bets = userStat.lastBet.bets.map(b => ({
            type: b.type,
            amount: b.amount * 2
        }));
    }
    // 2. Kiểm tra cược All In: `taixiu allin tài` hoặc `taixiu all tài`
    else if (sub === "all" || sub === "allin") {
        if (args.length < 2) {
            return api.sendMessage("❌ Dùng: taixiu allin [cửa cược] (VD: taixiu allin tài)", threadID, messageID);
        }
        const choice = normalizeBetChoice(args[1]);
        if (!choice) {
            return api.sendMessage(`❌ Cửa cược '${args[1]}' không hợp lệ! Chọn: tài, xỉu, chẵn, lẻ, đôi, boba, tong3, tong18`, threadID, messageID);
        }
        if (userMoney <= 0) {
            return api.sendMessage("💸 Số dư của bạn đã hết (0 xu), không thể All In!", threadID, messageID);
        }
        bets.push({ type: choice, amount: userMoney });
    }
    // 3. Cược thông thường hoặc cược kết hợp
    else {
        // Syntax parser: quét theo cặp [cửa, tiền] hoặc [tiền, cửa]
        let idx = 0;
        while (idx < args.length) {
            const token = args[idx];
            const choice = normalizeBetChoice(token);

            if (choice) {
                // Tiếp theo là số tiền
                const nextToken = args[idx + 1];
                const amt = parseAmount(nextToken, userMoney);
                if (amt && amt > 0) {
                    bets.push({ type: choice, amount: amt });
                    idx += 2;
                    continue;
                }
            } else {
                // Thử xem token có phải là số tiền và token tiếp theo là cửa không (VD: 50k tài)
                const amt = parseAmount(token, userMoney);
                const nextChoice = normalizeBetChoice(args[idx + 1]);
                if (amt && amt > 0 && nextChoice) {
                    bets.push({ type: nextChoice, amount: amt });
                    idx += 2;
                    continue;
                }
            }
            idx++;
        }
    }

    if (bets.length === 0) {
        return api.sendMessage(
            "❌ Cú pháp cược không hợp lệ!\n👉 Ví dụ cược đơn: taixiu tài 50k\n👉 Ví dụ cược kết hợp: taixiu tài 50k chẵn 20k boba 10k\n👉 Gõ 'taixiu help' để xem đầy đủ hướng dẫn.",
            threadID,
            messageID
        );
    }

    // Tính tổng tiền cược
    const totalWager = bets.reduce((sum, b) => sum + b.amount, 0);

    if (totalWager <= 0) {
        return api.sendMessage("❌ Số tiền cược không hợp lệ.", threadID, messageID);
    }
    if (userMoney < totalWager) {
        return api.sendMessage(
            `💸 Bạn không đủ số dư để cược!\n💰 Số dư hiện có: ${formatMoney(userMoney)} xu\n🎯 Tổng cược yêu cầu: ${formatMoney(totalWager)} xu`,
            threadID,
            messageID
        );
    }

    // Trừ tiền ngay khi xác nhận cược
    await Currencies.decreaseMoney(senderID, totalWager);

    // =================== SỰ KIỆN NGẪU NHIÊN ===================
    // Kích hoạt trước mỗi lượt chơi:
    // 🍀 May mắn (thưởng thêm 20% tiền thắng)
    // 💀 Vận đen (không có thưởng phụ)
    // 💎 Jackpot (Nổ hũ x30)
    // 🔥 X2 thưởng (Nhân đôi tiền lãi)
    // 🎲 Xúc xắc vàng (+50.000 xu cố định)
    const eventRoll = Math.random() * 100;
    let activeEvent = null;
    let eventName = null;

    if (eventRoll < 12) {
        activeEvent = "MAY_MAN";
        eventName = "🍀 SỰ KIỆN MAY MẮN: +20% TIỀN THẮNG";
    } else if (eventRoll < 24) {
        activeEvent = "X2_THUONG";
        eventName = "🔥 SỰ KIỆN X2 THƯỞNG: NHÂN ĐÔI LÃI LƯỢT CHƠI";
    } else if (eventRoll < 30) {
        activeEvent = "XUC_XAC_VANG";
        eventName = "🎲 SỰ KIỆN XÚC XẮC VÀNG: THƯỞNG +50K XU CỐ ĐỊNH";
    } else if (eventRoll < 34) {
        activeEvent = "JACKPOT";
        eventName = "💎 SỰ KIỆN JACKPOT: CƠ HỘI NỔ HŨ HOÀNG GIA";
    }

    // =================== LẮC 3 XÚC XẮC ===================
    const dice = [
        1 + Math.floor(Math.random() * 6),
        1 + Math.floor(Math.random() * 6),
        1 + Math.floor(Math.random() * 6)
    ];
    const total = dice[0] + dice[1] + dice[2];

    const isTriple = dice[0] === dice[1] && dice[1] === dice[2];
    const isPair = (dice[0] === dice[1] || dice[1] === dice[2] || dice[0] === dice[2]) && !isTriple;
    const isTai = total >= 11;
    const isChan = total % 2 === 0;

    // Phân loại kết quả ván đấu
    const winConditions = {
        tai: isTai,
        xiu: !isTai,
        chan: isChan,
        le: !isChan,
        doi: isPair,
        boba: isTriple,
        tong3: total === 3,
        tong18: total === 18
    };

    // =================== TÍNH TOÁN TRẢ THƯỞNG ===================
    let totalReturn = 0; // Tổng tiền nhận về (gồm cả vốn cược các cửa thắng)
    let wonSubBets = [];
    let lostSubBets = [];

    for (const b of bets) {
        const conf = BET_TYPES[b.type];
        if (winConditions[b.type]) {
            let payoutRate = conf.rate;
            let subReturn = Math.floor(b.amount * payoutRate);

            // Áp dụng sự kiện ngẫu nhiên trên cửa thắng
            if (activeEvent === "MAY_MAN") {
                const profit = subReturn - b.amount;
                if (profit > 0) subReturn += Math.floor(profit * 0.2);
            } else if (activeEvent === "X2_THUONG") {
                const profit = subReturn - b.amount;
                if (profit > 0) subReturn += profit; // Nhân đôi lãi
            } else if (activeEvent === "JACKPOT" && (isTriple || b.type === "tong3" || b.type === "tong18")) {
                subReturn += Math.floor(b.amount * 20); // Nổ hũ lớn
                eventName = "💎 JACKPOT ĐẠI THẮNG: NỔ HŨ HOÀNG GIA THÀNH CÔNG";
            }

            totalReturn += subReturn;
            wonSubBets.push({ ...b, returnAmount: subReturn });
        } else {
            lostSubBets.push(b);
        }
    }

    // Nếu có sự kiện Xúc Xắc Vàng và người chơi thắng ít nhất 1 cửa
    if (activeEvent === "XUC_XAC_VANG" && wonSubBets.length > 0) {
        totalReturn += 50000;
    }

    const netProfit = totalReturn - totalWager;
    const isOverallWin = netProfit > 0;

    if (totalReturn > 0) {
        await Currencies.increaseMoney(senderID, totalReturn);
    }

    // Cập nhật số dư mới nhất
    const finalData = (await Currencies.getData(senderID)) || { money: 0 };
    const newBalance = Number(finalData.money) || (userMoney + netProfit);

    // =================== CẬP NHẬT LỊCH SỬ & THỐNG KÊ ===================
    const rawHistory = readJSON(historyFile, []);
    const history = Array.isArray(rawHistory) ? rawHistory.filter(r => r && typeof r === 'object' && Array.isArray(r.dice)) : [];
    history.push({
        dice,
        total,
        result: isTai ? "TAI" : "XIU",
        isChan,
        isTriple,
        isPair,
        timestamp: Date.now()
    });
    if (history.length > 100) history.shift();
    writeJSON(historyFile, history);

    // Cập nhật stats người chơi
    userStat.plays = (userStat.plays || 0) + 1;
    if (isOverallWin) {
        userStat.wins = (userStat.wins || 0) + 1;
        userStat.winStreak = (userStat.winStreak || 0) + 1;
        if (userStat.winStreak > (userStat.maxWinStreak || 0)) {
            userStat.maxWinStreak = userStat.winStreak;
        }
        userStat.totalWon = (userStat.totalWon || 0) + netProfit;
    } else {
        userStat.losses = (userStat.losses || 0) + 1;
        userStat.winStreak = 0;
    }
    if (isTriple) {
        userStat.triples = (userStat.triples || 0) + 1;
    }
    userStat.lastBet = {
        bets,
        totalWager,
        isWin: isOverallWin,
        timestamp: Date.now()
    };
    allStats[senderID] = userStat;
    writeJSON(statsFile, allStats);

    // =================== TẠO CARD ĐỒ HỌA 3D BESPOKE ===================
    let cardAttachment = null;
    let tempCardPath = null;

    try {
        const betTypeLabels = bets.map(b => `${BET_TYPES[b.type].name} (${formatMoney(b.amount)})`).join(" + ");
        const streakList = history.map(h => h.result);

        const cardCanvas = renderTaiXiuCard({
            dice,
            betType: betTypeLabels.length > 25 ? `${bets.length} CỬA KẾT HỢP` : betTypeLabels,
            betAmount: formatMoney(totalWager),
            isWin: isOverallWin,
            payout: isOverallWin ? formatMoney(netProfit) : "0",
            randomEvent: eventName,
            streakHistory: streakList
        });

        tempCardPath = path.join(cacheDir, `taixiu_${senderID}_${Date.now()}.png`);
        fs.writeFileSync(tempCardPath, cardCanvas.toBuffer("image/png"));
        cardAttachment = fs.createReadStream(tempCardPath);
    } catch (err) {
        console.error("[TAIXIU] Lỗi render card canvas:", err);
    }

    // =================== SOẠN TIN NHẮN PHẢN HỒI ===================
    const subResultTaxonomy = `${isTai ? "TÀI" : "XỈU"} | ${isChan ? "CHẴN" : "LẺ"}${isTriple ? " | BỘ BA ĐẶC BIỆT" : isPair ? " | CÓ ĐÔI" : ""}`;
    const betBreakdown = bets.map(b => {
        const isWin = winConditions[b.type];
        return `• ${BET_TYPES[b.type].name} [${formatMoney(b.amount)}]: ${isWin ? `✅ ĂN +${formatMoney(b.amount * (BET_TYPES[b.type].rate - 1))}` : "❌ THUA"}`;
    }).join("\n");

    let responseMsg = 
`🎲 ═════ KẾT QUẢ TÀI XỈU ═════ 🎲
👤 ${userName} cược: ${formatMoney(totalWager)} xu

👉 XÚC XẮC: [ ${dice[0]} - ${dice[1]} - ${dice[2]} ]
🎯 TỔNG ĐIỂM: ${total} ➜ ${subResultTaxonomy}
${eventName ? `✨ ${eventName}\n` : ""}
📋 CHI TIẾT CÁC CỬA ĐẶT:
${betBreakdown}

📌 KẾT CỤC: ${isOverallWin ? `🎉 THẮNG LỚN (+${formatMoney(netProfit)} xu)` : `💀 THUA TRẮNG (-${formatMoney(totalWager)} xu)`}
💰 SỐ DƯ HIỆN TẠI: ${formatMoney(newBalance)} xu
${!isOverallWin ? "💡 Gợi ý: Gõ 'taixiu x2' để cược nhân đôi gỡ lại vốn ở ván tiếp theo!" : `🔥 Chuỗi thắng: ${userStat.winStreak} trận!`}`;

    const sendPayload = { body: responseMsg };
    if (cardAttachment) {
        sendPayload.attachment = cardAttachment;
    }

    return api.sendMessage(
        sendPayload,
        threadID,
        () => {
            if (tempCardPath && fs.existsSync(tempCardPath)) {
                try { fs.unlinkSync(tempCardPath); } catch (_) {}
            }
        },
        messageID
    );
};
