// modules/commands/thamhiem.js
// Module Hành Trình Thám Hiểm
// Credits: genfor

const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

const dataPath = path.join(__dirname,"..","thamhiemData","players.json");

// ===== FILE DATA =====
function ensureDataFile() {
    const dirPath = path.dirname(dataPath);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath,{recursive:true});
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({},null,2));
}

function loadData() {
    ensureDataFile();
    return JSON.parse(fs.readFileSync(dataPath));
}

function saveData(data){
    ensureDataFile();
    fs.writeFileSync(dataPath, JSON.stringify(data,null,2));
}

function getPlayer(uid){
    let data = loadData();
    if(!data[uid]){
        data[uid]={
            ten:"Đạo Hữu",
            thechat:Math.floor(Math.random()*50)+10,
            exp:0,
            level:1,
            trangbi:[],
            tien:100,
            tuoi:1,
            lastOffline:Date.now(),
            khoangCach:0 // tổng km thám hiểm
        };
        saveData(data);
    }
    return data[uid];
}

function savePlayer(uid,player){
    let data = loadData();
    data[uid] = player;
    saveData(data);
}

// ===== SHOP =====
const shopItems = [
    {name:"Thuốc Thể Chất",type:"dan",price:50,effect:5},
    {name:"Thuốc Kinh Nghiệm",type:"dan",price:100,effect:10},
    {name:"Kiếm Gỗ",type:"vu khi",price:150,effect:5},
    {name:"Kiếm Bạch Kim",type:"vu khi",price:500,effect:15}
];

// ===== MODULE CONFIG =====
module.exports.config = {
    name:"thamhiem",
    version:"1.0.0",
    hasPermssion:0,
    credits:"dtb",
    description:"Game Hành Trình Thám Hiểm",
    commandCategory:"Game",
    usages:"[start/explore/info/shop/battle]",
    cooldowns:5
};

// ===== RANDOM EVENT =====
function randomEvent(player){
    let roll = Math.random();
    if(roll<0.05){
        let bonus = Math.floor(Math.random()*10+10);
        player.exp += bonus;
        return `🌟 Ngộ đạo! Kinh nghiệm +${bonus}`;
    }else if(roll<0.1){
        let loss = Math.floor(Math.random()*5+5);
        player.thechat = Math.max(1,player.thechat-loss);
        return `🔥 Tai nạn! Thể chất giảm ${loss}`;
    }else if(roll<0.15){
        let bonus = Math.floor(Math.random()*10+5);
        player.exp += bonus;
        player.thechat += 2;
        return `💎 Nhặt được kho báu! Exp +${bonus}, Thể chất +2`;
    }
    return null;
}

// ===== UPDATE LEVEL =====
function updateLevel(player){
    let old = player.level;
    while(player.exp>=player.level*100){
        player.exp -= player.level*100;
        player.level += 1;
    }
    return old!==player.level;
}

// ===== UPDATE TUỔI =====
function updateTuoi(player){
    let now = Date.now();
    let last = player.lastOffline || now;
    let daysPassed = Math.floor((now-last)/1000/3600/24);
    if(daysPassed>0){
        player.tuoi += daysPassed;
        player.lastOffline = now;
    }
}

// ===== CANVAS RESULT =====
async function drawExplore(player,desc){
    const canvas = createCanvas(600,300);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f0f2f5";
    ctx.fillRect(0,0,600,300);
    ctx.fillStyle = "#1877f2";
    ctx.fillRect(0,0,600,50);
    ctx.fillStyle = "white";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(player.ten,20,35);
    ctx.fillStyle = "#333";
    ctx.font = "16px sans-serif";
    ctx.fillText(`Thể chất: ${player.thechat} | Exp: ${player.exp} | Level: ${player.level}`,20,80);
    ctx.fillText(`Khoảng cách: ${player.khoangCach} km | Tuổi: ${player.tuoi}`,20,110);
    ctx.fillText(`Sự kiện: ${desc}`,20,150);
    return canvas.toBuffer();
}

// ===== MAIN FUNCTION =====
module.exports.run = async function({api,event,args}){
    const {threadID,senderID,mentions} = event;
    let player = getPlayer(senderID);

    // Tính tu vi offline
    updateTuoi(player);

    // START
    if(args[0]==="start"){
        player.ten = `Đạo Hữu ${senderID}`;
        savePlayer(senderID,player);
        return api.sendMessage(`✅ Bạn đã bắt đầu hành trình thám hiểm! Thể chất: ${player.thechat}, Tiền: ${player.tien}`,threadID);
    }

    // INFO
    if(args[0]==="info"){
        return api.sendMessage(
            `👤 ${player.ten}\n⚡ Thể chất: ${player.thechat}\n✨ Exp: ${player.exp}\n📖 Level: ${player.level}\n💰 Tiền: ${player.tien}\n🎂 Tuổi: ${player.tuoi}\n🌍 Khoảng cách thám hiểm: ${player.khoangCach} km\n🗡 Trang bị: ${player.trangbi.join(",")||"Chưa có"}`,
            threadID
        );
    }

    // EXPLORE
    if(args[0]==="explore"){
        let dist = Math.floor(Math.random()*10+5);
        player.khoangCach += dist;
        let evt = randomEvent(player);
        let up = updateLevel(player);
        savePlayer(senderID,player);
        let msg = `🏞 Bạn thám hiểm ${dist} km.\n`;
        if(evt) msg += evt+"\n";
        if(up) msg += `🌟 Chúc mừng! Level tăng lên ${player.level}\n`;
        let buf = await drawExplore(player,msg);
        return api.sendMessage({body:msg,attachment:buf},threadID);
    }

    // SHOP
    if(args[0]==="shop"){
        if(!args[1]){
            let list = shopItems.map((i,j)=>`${j+1}. ${i.name} - ${i.price} vàng`).join("\n");
            return api.sendMessage("🛒 Shop:\n"+list+"\nDùng: /thamhiem shop <số thứ tự>",threadID);
        }else{
            let idx = parseInt(args[1])-1;
            if(!shopItems[idx]) return api.sendMessage("⛔ Không tìm thấy sản phẩm!",threadID);
            if(player.tien<shopItems[idx].price) return api.sendMessage("⚠️ Không đủ tiền!",threadID);
            player.tien -= shopItems[idx].price;
            if(shopItems[idx].type==="dan") player.exp += shopItems[idx].effect;
            else player.thechat += shopItems[idx].effect;
            savePlayer(senderID,player);
            return api.sendMessage(`✅ Mua thành công ${shopItems[idx].name}!`,threadID);
        }
    }

    // BATTLE
    if(args[0]==="battle"){
        if(!mentions || Object.keys(mentions).length===0) return api.sendMessage("⚠️ Tag người muốn giao đấu!",threadID);
        let targetID = Object.keys(mentions)[0];
        let target = getPlayer(targetID);
        let scoreA = player.thechat + player.level*10 + Math.random()*10;
        let scoreB = target.thechat + target.level*10 + Math.random()*10;
        let loser,winner;
        if(scoreA>=scoreB){ winner=player; loser=target; }
        else { winner=target; loser=player; }
        loser.thechat = Math.max(1,loser.thechat-5);
        loser.tien = Math.floor(loser.tien/2);
        savePlayer(senderID,player);
        savePlayer(targetID,target);
        return api.sendMessage(`⚔️ Giao đấu kết thúc!\n🏆 Thắng: ${winner.ten}\n💀 Thua: ${loser.ten} giảm thể chất và mất tiền!`,threadID);
    }

    // HELP
    return api.sendMessage(
        "📖 Lệnh Hành Trình Thám Hiểm:\n- /thamhiem start → bắt đầu hành trình\n- /thamhiem explore → thám hiểm vùng đất\n- /thamhiem info → xem nhân vật\n- /thamhiem shop → mua vật phẩm\n- /thamhiem battle <@người> → giao đấu",
        threadID
    );
};
