// danh sách công việc
let works = {
    '😠': {
        name: 'câu cá',
        img: 'https://i.imgur.com/DoB5Cw8.gif',
        done: [
            ['{name} bạn vừa bắt được con cá đèn lồng và bán được {money}$', 'https://i.imgur.com/BXng765.jpeg'],
            ['{name} bạn vừa bắt được cá mập và bán được {money}$', 'https://i.imgur.com/dyLyvOA.jpeg'],
           ['{name} bạn vừa bắt được tôm tít và bán được {money}$', 'https://i.imgur.com/YJiCTWH.jpeg'],
           ['{name} bạn vừa bắt được cá ngừ và bán được {money}$', 'https://i.imgur.com/eshOIiJ.jpeg'],
           ['{name} bạn vừa bắt được cá mập và bán được  {money}$', 'https://i.imgur.com/dyLyvOA.jpeg'],
          ['{name} bạn vừa bắt được cá thu và bán được {money}$', 'https://i.imgur.com/YAS5iGM.jpeg'],
          ['{name} bạn vừa bắt được cá koi và bán được {money}$', 'https://i.imgur.com/BXwB4xZ.png'],
          ['{name} bạn vừa bắt được cá trê và bán được {money}$', 'https://i.imgur.com/IE6LQU3.png'],
          ['{name} bạn vừa bắt được tôm hùm đất và bán được {money}$', 'https://i.imgur.com/XbSWNha.png'],
          ['{name} bạn vừa bắt được cá kiếm và bán được {money}$', 'https://i.imgur.com/nLndbMc.png'],
          ['{name} bạn vừa bắt được cá vẹt và bán được {money}$', 'https://i.imgur.com/7H5XwLb.png'],
          ['{name} bạn vừa bắt được cá hề và bán được {money}$', 'https://i.imgur.com/cLvJZlM.png'],
           ['{name} bạn vừa bắt được cá vây tay và bán được {money}$', 'https://i.imgur.com/jw5bqu7.png'],
            ['{name} bạn vừa bắt được cá chép và bán được {money}$', 'https://i.imgur.com/7hVzeDJ.png'],
          ['{name} bạn vừa bắt được cá mập trắng lớn và bán được {money}$', 'https://i.imgur.com/TuMhGBS.png'],
            ['{name} bạn vừa bắt được cá mập nhám búa và bán được {money}$', 'https://i.imgur.com/JDVZ3J7.jpeg'],
          ['{name} bạn vừa bắt được cá hồi và bán được {money}$', 'https://i.imgur.com/wKijFF0.png'],
          ['{name} bạn vừa bắt được cá khủng long hoàng đế và bán được {money}$', 'https://i.imgur.com/w42NHef.png'],
          ['{name} bạn vừa bắt được cá hồng vịnh và bán được {money}$', 'https://i.imgur.com/UjdnHhE.png'],
          ['bạn vừa bắt được cá vượng miệng rộng và bán được {money}$', 'https://i.imgur.com/Cw0qh57.png'],
          ['{name} bạn vừa bắt được cá betta và bán được {money}$', 'https://i.imgur.com/d33003f.png'],
           ['{name} bạn vừa bắt được cá rô phi và bán được {money}$', 'https://i.imgur.com/sqBRoDe.png'],
           ['{name} bạn vừa bắt được cá ngừ đại dương và bán được {money}$', 'https://i.imgur.com/A1qXwXV.png'],
           ['{name} bạn vừa bắt được cá nhám voi và bán được {money}$', 'https://i.imgur.com/K7Qy4mI.png'],
           ['{name} bạn vừa bắt được cá pecca vàng và bán được {money}$', 'https://i.imgur.com/S9Qqr3D.png'], 
          ['{name} bạn vừa bắt được cá mù lán chấm hoa và bán được {money}$', 'https://i.imgur.com/A5XeYbS.png'],
        ]
    },
    '❤': {
        name: 'săn thú hoang',
        img: 'https://i.imgur.com/jc2j4ps.gif',
        done: [
            ['{name} bắn được con rắn và bán được {money}$', 'https://i.imgur.com/Q7vv6mG.jpg'],
           ['{name} bắn được con rồng komodo và bán được {money}$', 'https://i.imgur.com/Y8mfwPN.jpeg'],
           ['{name} bắn được con bói cá và bán được {money}$', 'https://i.imgur.com/XAM9Ne6.jpeg'],
           ['{name} bắn được con gấu nâu và bán được {money}$', 'https://i.imgur.com/A3OxqoB.jpeg'],
           ['{name} bắn được con rắn Anaconda và bán được {money}$', 'https://i.imgur.com/4z6kr8V.jpeg'],
           ['{name} bắn được con huơu và bán được {money}$', 'https://i.imgur.com/lHQKacE.jpg'],
           ['{name} bắn được con heo rừng và bán được {money}$', 'https://i.imgur.com/eQQUR3s.jpg'],
           ['{name} bắn được con sư tử và bán được {money}$', 'https://i.imgur.com/ThGSaPn.jpg'],
    
          
        ]
    },
  '😢': { 
    name: 'Đào đá', 
    img: 'https://i.imgur.com/zBWwXzN.gif', 
    done: [ 
      ['{name} đã đào được viên kim cương và bán được {money}$', 'https://i.imgur.com/9cHq8nN.png'],
       ['{name} đã đào được vàng và bán được {money}$', 'https://i.imgur.com/HB0Bmqo.jpg'],
       ['{name} đã đào được quặng sắt và bán được {money}$', 'https://i.imgur.com/wD0VEZ8.png'],
      ['{name} đã đào được ngọc lục bảo và bán được {money}$', 'https://i.imgur.com/NyYurEd.jpg'],
       ['{name} đã đào được ngọc anh tím và bán được {money}$', 'https://i.imgur.com/8kc5m2L.jpg'],
       ['{name} đã đào được than đá và bán được {money}$', 'https://i.imgur.com/CY3lCqx.jpg'],
       ['{name} đã đào được ruby cực hiếm và bán được {money}$', 'https://i.imgur.com/OoP1Smk.jpg'],

      ]
  },
  '👍': {
        name: 'bắn chim',
        img: 'https://i.imgur.com/4DctekU.gif',
        done: [
            ['{name} bắn được con chim đen và bán được {money}$', 'https://i.imgur.com/IPeNm8n.jpeg'],
           ['{name} bắn được con đại bàng và bán được {money}$', 'https://i.imgur.com/EklUNah.jpeg'],
           ['{name} bắn được con chim én và bán được {money}$', 'https://i.imgur.com/kUhS155.jpeg'],
           ['{name} bắn được con chim vành khuyên và bán được {money}$', 'https://i.imgur.com/DErkrnd.jpeg'],
           ['{name} bắn được con chim đuôi dài và bán được {money}$', 'https://i.imgur.com/PMaurmG.jpeg'],
           ['{name} bắn được con chim chích chòe và bán được {money}$', 'https://i.imgur.com/muJCa5P.jpeg'],
           ['{name} bắn được con vẹt và bán được {money}$', 'https://i.imgur.com/2nN01CY.jpeg'],
           ['{name} bắn được con chim họa mi và bán được {money}$', 'https://i.imgur.com/88Cq2Hf.jpeg'],
           ['{name} bắn được con chim chào mào và bán được {money}$', 'https://i.imgur.com/9R8BrMF.jpeg'],
          ['{name} bắn được con chim sẻ và bán được {money}$', 'https://i.imgur.com/yZcWTT6.jpeg'],
           ['{name} bắn được con chim vàng anh và bán được {money}$', 'https://i.imgur.com/bk9a6e4.jpeg'],
           ['{name} bắn được con chim chìa vôi và bán được {money}$', 'https://i.imgur.com/SxhsgX2.jpeg'],
           ['{name} bắn được con chim cu gáy và bán được {money}$', 'https://i.imgur.com/ZdFZQ1N.jpeg'],
           ['{name} bắn được con chim yến phụng và bán được {money}$', 'https://i.imgur.com/FG61Y7R.jpeg'],
          ['{name} bắn được con chim sơn ca và bán được {money}$', 'https://i.imgur.com/XZSGXkL.jpeg'],

          ],
  },
    // thêm tiếp công việc...
};


exports.config = {
    name: 'works',
    version: '0.0.1',
    hasPermssion: 0,
    credits: "dtb",
    description: 'work',
    commandCategory: 'Tiện ích',
    usages: '[]',
    cooldowns: 3
};
let stream_url = url=>require('axios').get(url, {
    responseType: 'stream',
}).then(res=>res.data);
let _0 = x=>x < 10?'0'+x: x;
let random = (min, max)=>Math.random()*(max-min+1)+min<<0;
exports.run = o=>o.api.sendMessage({
        body: `[ Công việc]\n${Object.entries(works).map(($, i)=>`[${i+1} / ${$[0]}] ${$[1].name}`).join('\n')}\n\n-> thả icon để làm việc tương ứng hoặc Reply STT.`,
    }, o.event.threadID, (err, res)=>(res.name = exports.config.name, res.event = o.event, global.client.handleReaction.push(res), global.client.handleReply.push(res)), o.event.messageID); 
exports.handleReaction = async o=>{
    let _ = o.handleReaction;
    let uid = o.event.userID;
    let user = await o.Users.getData(uid);if (!user)return send(`Error`);
    let data = user.data;
    let send = (msg, callback) => o.api.sendMessage(msg, o.event.threadID, callback, o.event.messageID);
    
    if  (!data)user.data = {};
    if (uid != _.event.senderID)return;
    if (typeof data.work != undefined && data.work>= Date.now())return (x=>send(`hãy làm việc sau: ${_0(x/1000/60<<0)} phút ${_0(x/1000%60<<0)} giây.`))(data.work-Date.now());

    let work = works[o.event.reaction];
    let msg = {};

    if (!work)return send(`Công việc không có trong danh sách`);

    data.work = Date.now()+(1000*60*5);
    o.Users.setData(uid, user);
    let wgm = await new Promise(async resolve=>send({
        body: `Đang ${work.name}...`,
        attachment: work.img?await stream_url(work.img):[],
    }, (err, res)=>resolve(res || {})));
    await new Promise(out=>setTimeout(out, 1000*3.5));
    let done = work.done[Math.random()*work.done.length<<0];
    let $ = random(1000, 5000);
    msg.body = done[0].replace(/{name}/g, user.name).replace(/{money}/g, $);
    if (!!done[1])msg.attachment = await stream_url(done[1]);
    send(msg, ()=>o.api.unsendMessage(wgm.messageID));
    o.Currencies.increaseMoney(uid, $);
};
exports.handleReply = async o=>{
    let _ = o.handleReply;
    let uid = o.event.senderID;
    let user = await o.Users.getData(uid);if (!user)return send(`Error`);
    let data = user.data;
    let send = (msg, callback) => o.api.sendMessage(msg, o.event.threadID, callback, o.event.messageID);
    
    if  (!data)user.data = {};
    if (uid != _.event.senderID)return;
    if (typeof data.work != undefined && data.work>= Date.now())return (x=>send(`hãy làm việc sau: ${_0(x/1000/60<<0)} phút ${_0(x/1000%60<<0)} giây.`))(data.work-Date.now());

    let work = Object.values(works)[o.event.body-1];
    let msg = {};

    if (!work)return send(`Công việc không có trong danh sách`);

    data.work = Date.now()+(1000*60*5);
    o.Users.setData(uid, user);
    let wgm = await new Promise(async resolve=>send({
        body: `Đang ${work.name}...`,
        attachment: work.img?await stream_url(work.img):[],
    }, (err, res)=>resolve(res || {})));
    await new Promise(out=>setTimeout(out, 1000*3.5));
    let done = work.done[Math.random()*work.done.length<<0];
    let $ = random(1000, 5000);
    msg.body = done[0].replace(/{name}/g, user.name).replace(/{money}/g, $);
    if (!!done[1])msg.attachment = await stream_url(done[1]);
    send(msg, ()=>o.api.unsendMessage(wgm.messageID));
    o.Currencies.increaseMoney(uid, $);
};