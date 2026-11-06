// modules/commands/trai.js
// Trại Thú Cưng Siêu Quậy – Canvas sống động full
// Credits: genfor

const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const dataPath = path.join(__dirname,"..","traiData","players.json");

// ===== FILE DATA =====
function ensureDataFile() {
    const dir = path.dirname(dataPath);
    if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
    if(!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({},null,2));
}

function loadData() { ensureDataFile(); return JSON.parse(fs.readFileSync(dataPath)); }
function saveData(data){ ensureDataFile(); fs.writeFileSync(dataPath, JSON.stringify(data,null,2)); }

function getPlayer(uid){
    let data = loadData();
    if(!data[uid]){
        data[uid]={ten:"Chủ Trại",thuCung:[],tien:200,exp:0,level:1,lastOffline:Date.now()};
        saveData(data);
    }
    return data[uid];
}

function savePlayer(uid,player){
    let data = loadData();
    data[uid] = player;
    saveData(data);
}

// ===== DANH SÁCH THÚ CƯNG =====
const petList = [
    {name:"Miu Miu",type:"Mèo",fun:10,health:10,img:"https://i.imgur.com/4M7IWwP.png"},
    {name:"Gâu Gâu",type:"Chó",fun:12,health:12,img:"https://i.imgur.com/4M7IWwP.png"},
    {name:"Cá Vàng",type:"Cá",fun:8,health:8,img:"https://i.imgur.com/4M7IWwP.png"},
    {name:"Thỏ Nhí",type:"Thỏ",fun:9,health:9,img:"https://i.imgur.com/4M7IWwP.png"},
    {name:"Hamster Hammy",type:"Hamster",fun:7,health:7,img:"https://i.imgur.com/4M7IWwP.png"},
    {name:"Rùa Rùa",type:"Rùa",fun:5,health:15,img:"https://i.imgur.com/4M7IWwP.png",rare:true},
    {name:"Vẹt Lolo",type:"Vẹt",fun:11,health:10,img:"https://i.imgur.com/4M7IWwP.png"},
    {name:"Chó Sói Mini",type:"Chó Sói",fun:13,health:11,img:"https://i.imgur.com/4M7IWwP.png",rare:true},
    {name:"Kỳ Lân Mini",type:"Kỳ Lân",fun:20,health:20,img:"https://i.imgur.com/4M7IWwP.png",rare:true},
    {name:"Rồng Con",type:"Rồng",fun:25,health:25,img:"https://i.imgur.com/4M7IWwP.png",rare:true}
];

function adoptPet(){ return {...petList[Math.floor(Math.random()*petList.length)]}; }

// ===== SHOP =====
const shopItems = [
    {name:"Thức ăn",type:"food",price:20,effect:5},
    {name:"Đồ chơi",type:"toy",price:50,effect:10},
    {name:"Trang phục hài hước",type:"cloth",price:100,effect:15},
    {name:"Thuốc năng lượng",type:"energy",price:150,effect:20},
    {name:"Bánh đặc biệt",type:"special",price:250,effect:30},
    {name:"Đồ chơi hiếm",type:"magicToy",price:400,effect:40}
];

// ===== CANVAS DYNAMIC =====
async function drawPetCanvas(player,pet,msg,options={}){
    const canvas = createCanvas(750,450);
    const ctx = canvas.getContext("2d");

    // BACKGROUND
    ctx.fillStyle = "#f0f2f5"; ctx.fillRect(0,0,750,450);

    // HEADER
    ctx.fillStyle="#1877f2"; ctx.fillRect(0,0,750,50);
    ctx.fillStyle="white"; ctx.font="bold 22px sans-serif"; ctx.fillText(player.ten,20,32);

    // INFO
    ctx.fillStyle="#333"; ctx.font="16px sans-serif";
    ctx.fillText(`Tiền: ${player.tien} | Exp: ${player.exp} | Level: ${player.level}`,20,80);
    ctx.fillText(`Thú cưng: ${pet.name} (${pet.type}) | Fun: ${pet.fun} | Health: ${pet.health}`,20,110);
    ctx.fillText(`Sự kiện: ${msg}`,20,140);

    // PET IMAGE
    try{
        const img = await loadImage(pet.img);
        let yOffset = options.jump? -25:0;
        ctx.drawImage(img,450,70+yOffset,250,250);
    }catch(e){}

    // BALL MINIGAME
    if(options.ball){
        ctx.fillStyle="red";
        ctx.beginPath();
        ctx.arc(600,200,25,0,Math.PI*2);
        ctx.fill();
    }

    // RARE PET EFFECT
    if(options.rare){
        ctx.strokeStyle="gold"; ctx.lineWidth=5;
        ctx.strokeRect(440,60,260,260);
    }

    return canvas.toBuffer();
}

// ===== CONFIG =====
module.exports.config = {name:"trai",version:"3.2.0",hasPermssion:0,credits:"dtb",description:"Trại Thú Cưng Siêu Quậy Canvas sống động full",commandCategory: "Trò Chơi",usages:"[start/adopt/info/play/shop/battle/nem/leaderboard]",cooldowns:5};

// ===== RUN =====
module.exports.run = async function({api,event,args}) {
    const {threadID,senderID,mentions} = event;
    let player = getPlayer(senderID);

    // OFFLINE FUN
    let now = Date.now(); let last=player.lastOffline||now;
    let hours=Math.floor((now-last)/1000/3600);
    if(hours>0 && player.thuCung.length>0){
        player.thuCung.forEach(p=>p.fun+=hours*2);
        player.lastOffline = now; savePlayer(senderID,player);
    }

    // START
    if(args[0]==="start") return api.sendMessage("✅ Chào mừng đến Trại Thú Cưng Siêu Quậy! /trai adopt để nhận thú cưng.",threadID);

    // ADOPT
    if(args[0]==="adopt"){
        let pet=adoptPet();
        player.thuCung.push(pet); savePlayer(senderID,player);
        let buf = await drawPetCanvas(player,pet,pet.rare?`🎉 Nhận thú hiếm: ${pet.name}!`:`Nhận thú: ${pet.name}`,{rare:pet.rare,jump:true});
        return api.sendMessage({body:`Bạn nhận được ${pet.name}!`,attachment:buf},threadID);
    }

    // INFO
    if(args[0]==="info"){
        let msg=`👤 ${player.ten}\n💰 Tiền: ${player.tien}\n✨ Exp: ${player.exp}\n📖 Level: ${player.level}\n🐾 Thú cưng:\n`;
        player.thuCung.forEach((p,i)=>{msg+=`${i+1}. ${p.name} (${p.type}) | Fun: ${p.fun} | Health: ${p.health}${p.rare?" ⭐":""}\n`;});
        return api.sendMessage(msg,threadID);
    }

    // PLAY
    if(args[0]==="play"){
        if(player.thuCung.length===0) return api.sendMessage("⚠️ Chưa có thú cưng!",threadID);
        let pet = player.thuCung[Math.floor(Math.random()*player.thuCung.length)];
        pet.fun+=5+Math.floor(Math.random()*6); player.exp+=5; savePlayer(senderID,player);
        let buf = await drawPetCanvas(player,pet,`Chơi với ${pet.name} Fun +5~10, Exp +5`,{jump:true});
        return api.sendMessage({body:`🎮 Chơi với ${pet.name}!`,attachment:buf},threadID);
    }

    // SHOP
    if(args[0]==="shop"){
        if(!args[1]){
            let list=shopItems.map((i,j)=>`${j+1}. ${i.name} - ${i.price} vàng`).join("\n");
            return api.sendMessage("🛒 Shop:\n"+list+"\nDùng: /trai shop <số thứ tự>",threadID);
        }else{
            let idx=parseInt(args[1])-1; if(!shopItems[idx]) return api.sendMessage("⛔ Không tìm thấy sản phẩm!",threadID);
            if(player.tien<shopItems[idx].price) return api.sendMessage("⚠️ Không đủ tiền!",threadID);
            player.tien-=shopItems[idx].price;
            let pet = player.thuCung[Math.floor(Math.random()*player.thuCung.length)];
            if(shopItems[idx].type==="food") pet.health+=shopItems[idx].effect; else pet.fun+=shopItems[idx].effect;
            savePlayer(senderID,player);
            return api.sendMessage(`✅ Mua thành công ${shopItems[idx].name} cho ${pet.name}!`,threadID);
        }
    }

    // BATTLE
    if(args[0]==="battle"){
        if(!mentions||Object.keys(mentions).length===0) return api.sendMessage("⚠️ Tag người muốn giao đấu!",threadID);
        let targetID=Object.keys(mentions)[0]; let target=getPlayer(targetID);
        if(player.thuCung.length===0 || target.thuCung.length===0) return api.sendMessage("⚠️ Cả hai phải có thú!",threadID);
        let petA=player.thuCung[Math.floor(Math.random()*player.thuCung.length)];
        let petB=target.thuCung[Math.floor(Math.random()*target.thuCung.length)];
        let scoreA=petA.fun+Math.random()*10, scoreB=petB.fun+Math.random()*10;
        let winner,loser; if(scoreA>=scoreB){winner=player; loser=target;}else{winner=target; loser=player;}
        winner.exp+=10; savePlayer(senderID,player); savePlayer(targetID,target);
        return api.sendMessage(`⚔️ Giao đấu thú cưng!\n🏆 Thắng: ${winner.ten}\n💀 Thua: ${loser.ten}`,threadID);
    }

    // NÉM BÓNG
    if(args[0]==="nem"){
        if(player.thuCung.length===0) return api.sendMessage("⚠️ Bạn chưa có thú!",threadID);
        let pet=player.thuCung[Math.floor(Math.random()*player.thuCung.length)];
        let gainFun=5+Math.floor(Math.random()*11); pet.fun+=gainFun;
        let buf = await drawPetCanvas(player,pet,`Ném bóng cho ${pet.name} Fun +${gainFun}`,{jump:true,ball:true});
        savePlayer(senderID,player);
        if(Math.random()<0.05){ let rare=adoptPet(); if(rare.rare){player.thuCung.push(rare); savePlayer(senderID,player); return api.sendMessage({body:`🎯 Ném bóng thành công! Fun +${gainFun} và nhận thú hiếm ${rare.name}!`,attachment:buf},threadID);}}
        return api.sendMessage({body:`🎯 Ném bóng cho ${pet.name}! Fun +${gainFun}`,attachment:buf},threadID);
    }

    // LEADERBOARD
    if(args[0]==="leaderboard"){
        let data = loadData();
        let ranking = Object.entries(data).map(([id,p])=>({id,name:p.ten,totalFun:p.thuCung.reduce((a,b)=>a+b.fun,0)}));
        ranking.sort((a,b)=>b.totalFun-a.totalFun);
        let msg = "🏆 Top 10 Thú Cưng Vui Nhộn:\n"; ranking.slice(0,10).forEach((p,i)=>{msg+=`${i+1}. ${p.name} - Total Fun: ${p.totalFun}\n`;});
        return api.sendMessage(msg,threadID);
    }

    return api.sendMessage("📖 Lệnh Trại Thú Cưng Canvas sống động:\n/trai start\n/trai adopt\n/trai info\n/trai play\n/trai shop\n/trai battle <@người>\n/trai nem\n/trai leaderboard",threadID);
};
