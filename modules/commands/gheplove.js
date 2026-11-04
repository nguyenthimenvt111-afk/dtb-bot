module.exports.config = {
    name: "gheplove",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Ghép đôi ❗NGẪU NHIÊN❗",
    commandCategory: "Nhóm",
    usages: "\nboy => Ghép với nam\ngirl => Ghép với nữ\nKhông ghi thì random hết",
    cooldowns: 5
  }
  module.exports.run = async ({ api, event,args, Users }) => {
   const axios = global.nodemodule["axios"];
    const fs = global.nodemodule["fs-extra"];
    let mung = [
    "Trách phận vô duyên...",
  "Hơi thấp nhưng không sao. Hãy cố gắng lên!",
  "3 phần duyên nợ, 7 phần cố gắng",
  "Tỷ lệ mà mối quan hệ này có thể nên duyên cũng khá là nhỏ đấy! Phải cố gắng hơn nữa",
  "Date với nhau đi. Để mối quan hệ này có thể tiến xa hơn",
  "Hãy chủ động bắt chuyện hơn nữa. Hai bạn khá là hợp đôi",
  "Hãy tin vào duyên số đi, vì nó có thật đấy!",
  "Hợp đôi lắm đấy. Quan tâm chăm sóc cho mối quan hệ này nhiều hơn nữa nhé!",
  "Lưu số nhau đi, bao giờ cưới thì gọi nhau lên lễ đường!",
  "Cưới đi chờ chi!"
  ]
  let chuc = mung[Math.floor(Math.random() * mung.length)]
    if (!args[0]) {
              var ThreadInfo = await api.getThreadInfo(event.threadID);
              var all = ThreadInfo.userInfo
              let data = [];
              for (let u of all) {
                  if (u.gender == "MALE") {
                   if ( u != event.senderID) data.push(u.id)   
                  }
                  if (u.gender == "FEMALE") {
                    if ( u != event.senderID) data.push(u.id)  
                }
              }
              console.log(data)
              if (data.length == 0) return api.sendMessage("Rất tiếc! Không tìm thấy nửa đời của bạn 😥", event.threadID, event.messageID);
              let e = data[Math.floor(Math.random() * data.length)]
              let a = (Math.random() * 50)+50;
              var n = (await Users.getData(e)).name
              const url = api.getCurrentUserID(e);
           
  
              let getAvatar = (await axios.get(`https://graph.facebook.com/${e}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662
  `, { responseType: "arraybuffer" } )).data; 
              fs.writeFileSync( __dirname + "/cache/avt.png", Buffer.from(getAvatar, "utf-8") );
              api.sendMessage({ body: `[💗]→ Ghép đôi thành công\n[❤️]→ Tên: ${n}\n[🥰]→ Tỉ lệ hợp đôi: ${a.toFixed(2)}%\n[✨]→ ID: ${e}\n[👉]→Lời chúc:\n${chuc}\n[🐳]→ Ảnh của người đó:`,
                    attachment: fs.createReadStream(__dirname + `/cache/avt.png`)
              }, event.threadID, () => fs.unlinkSync(__dirname + `/cache/avt.png`), event.messageID);
    }
    else {            
      var ThreadInfo = await api.getThreadInfo(event.threadID);
      var all = ThreadInfo.userInfo
              let data = [];
        if(args[0] == "boy"){
              for (let u of all) {
          if (u.gender == "MALE") {
                  if (u != event.senderID) data.push(u.id)   
                  }
              }}  
       
        else if(args[0] == "girl"){
              for (let u of all) {
                  if (u.gender == "FEMALE") {
                  if (u != event.senderID) data.push(u.id)  
                  }
              }}
              console.log(data)
                       
              if (data.length == 0) return api.sendMessage("→ Rất tiếc! Không tìm thấy nửa đời của bạn 😥", event.threadID, event.messageID);
              let e = data[Math.floor(Math.random() * data.length)]
              let a = (Math.random() * 50)+50;
              var n = (await Users.getData(e)).name
              const url = api.getCurrentUserID(e);
              let getAvatar = (await axios.get(`https://graph.facebook.com/${e}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662
  `, { responseType: "arraybuffer" } )).data; 
              fs.writeFileSync( __dirname + "/cache/avt.png", Buffer.from(getAvatar, "utf-8") );
              api.sendMessage({ body: `[💗]→ Ghép đôi thành công\n[❤️]→ Tên: ${n}\n[🥰]→ Tỉ lệ hợp đôi: ${a.toFixed(2)}%\n[✨]→ ID: ${e}\n[👉]→ Lời chúc:\n${chuc}\n[🐳]→ Ảnh của người đó:`,
                    attachment: fs.createReadStream(__dirname + `/cache/avt.png`)
              }, event.threadID, () => fs.unlinkSync(__dirname + `/cache/avt.png`), event.messageID);}
  
  };