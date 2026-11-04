var traloi1 = ["Ỏ , lệnh của mình là: !",
  "Bạn gọi mình có việc gì không?",
  "mình rất sẵn lòng khi được phục vụ bạn:3",
  "Mình là bot , rất vui được bạn chú ý tới:3",
  "Bạn tag mình có gì không?",
  "Facebook admin: facebook.com/dtb",
  "Nếu có việc gì thì thì liên hệ admin nhé:3",
  "Trong trường hợp bot không onl thì nhắn tin với admin qua fb: facebook.com/dtb",
  "Có vấn đề gì thì hãy ib admin",
  "Mua file bot ib mình: facebook.com/dtb",
  "Bao phòng chụy đi bé ơi",
  "Anh yêu em<3",
  "Chịt đi:33",
  "Anh bao phòng bé nha?",
  "Bố mẹ em không có nhà=))",
  "Biết chào tôi không? đồ tệ bạc ",
  "Anh đừng làm vậy!!!!!!",
  "Biết ồn lắm không hả?",
  "không biết im lậng àaa-.-",
  "Ồn ào quá đi im lặng hết, về nhà mà cãi nhau!",
  "Không thể cản được bước của ma gêm minh",
  "cùng ý chí sinh tồn đến say bu da đi bên đồng đội hai ba sông pha",
  "không được làm vậy nữa nghe, mẹ biết mẹ bùn đó",
   "Troi oi cuu toi co thang no doi hiep toi",
   "Cuu be:<",
    "các người bắt nạt ta huhu",
     "Có gì không bây bi?",
               "reply nhiều quá dễ gây thoái hóa đó",
               "500k bao phòng ha?",
               "Trả lại sự trong sạch cho taoooo",
               "sao may muon cai gi?",
               "may muốn cái gì từ taoooo",
               "tại sao dị",
               "sao con nói dị",
               "dừng, dừng lại á á",
               "cuu toi, nó đòi hiep toi ne ba con oi",
               "sao cậu làm thế với tớ? biết ác lắm không hả",
               "đút vào đi cậu",
               "mình chịu được mà, mạnh lên cậu",
               "sao cậu yếu thế",
               "gì có 1phut đã ra rồi, cậu bị yếu à=))?",
               "cậu yếu xìu dị",
               "đồ 30s",
               "yếu=))",
               "sao cậu lại làm vậy với tớ",
               "cậu thật độc ác",
               "Yêu em <3", 
               "Em là con bot cute nhất <3", 
               "chào bạn tôi là bot", 
               "bạn gọi tôi có việc gì?", 
               "tôi yêu bạn vai lon", 
               "Yêu em <3", 
               "Hi, chào con vợ bé:3",
               "Chồng gọi có việc gì không?", 
               "Sử dụng callad để liên lạc với admin!", 
               "Em là bot cute nhất hành tinh", 
               "Nói gì thế con lợn", 
               "Em đây~~~~", 
               "Yêu anh  nhất💟", 
               "Yêu thương admin nhất",
               "Anh ấy là phụ trợ của admin",
               "Sao thế công chúa", 
               "Chăm chỉ học hành đi",
               "Bae ăn cơm chưa?", 
               "Tuyển phi công nè ạ",
               "Làm đĩ không ạ? dui lắm", 
               "Nếu cậu đang cô đơn thì chúng ta có thể thành đôi :3", 
               "Đang làm gì vậy?", 
               "Được của ló :)))", 
               "Em dthw như chủ của em ạ", 
               "Đừng khen em ngại quá hí hí" ,
               "Làm chồng em không ạ?", 
                "Cút ra", 
               "Công chúa em sao đấy?", 
               "Có gì ăn không:(( đói quáaa", 
               "Yêu cậu như một cực hình\nNhấp lên nhấp xuống hai mình cùng rên", 
               "Spam cc cút", 
               "Yêu em không?", 
               "Chồng em đây rồi", 
               "Mày bị làm sao í@@", 
               "Bạn là nhất!!!", 
               "Kêu chi lắm thế? Bộ thích tao rồi à :v", 
               "Chần chờ gì chồng ơi em đâyyy", 
               "Chần chờ gì vợ ơi anh đâyyy", 
               "Em... Sao em lại nói những cái lời đó chi zay em?", 
               "Thầy dạy phờ ri màaa", 
               "Yeu em rat nhieu ^^", 
               "Đồ con lợn lùn :))", 
               "Đợi xí. Đi ẻ cái :()", 
               "500k bao phòng!!!", 
               "Yeu anh den luy ^^", 
               "Anh quát em à?\nNói to thế á?",
               "Trả quần cho em huhu", 
               "Baby, take my hand. I want you to be my husband. Cause you're my Iron Man. And I love you 3000 <3", 
                "cccccccccccccccccccc", 
               "Đừng quá yêu một ai đó, khi chính bản thân bạn vẫn bị tổn thương!", "Bae, em nhu bong hoa. Nhung nguoi hai dau phai ta 💔", 
                "Hãy gọi cho admin tôi để được yêu thương<3", 
               "Hát đi cho kẹo 🍭"
];

var traloi2 = [
];

var traloi3 = [
  'abc',
  'xyz'
  //trả lời bằng reply bằng cái gì thì tùy thuộc vào bạn
];

var phrases = [
  'hello bot',
  'hi bot',
  'hey bot',
  'bot'
];

var phrases1 = [
  'jqk'
  //nếu nội dung đầu vào bằng cái gì thì tùy thuộc vào bạn
];

function checkForSpecificPhrases(message, phrases) {
  for (let phrase of phrases) {
    if (message.toLowerCase().includes(phrase)) {
      return true; 
    }
  }
  return false;
}

function tagg() {
  var index = Math.floor(Math.random() * traloi1.length);
  return traloi1[index];
}

function replyy() {
  var index = Math.floor(Math.random() * traloi2.length);
  return traloi2[index];
}

function replyy3() {
  var index = Math.floor(Math.random() * traloi3.length);
  return traloi3[index];
}

const fs = require('fs');
const path = './commandStatus.json';

module.exports.config = {
  name: "reply",
  version: "4.0.0",
  hasPermssion: 3,
  credits: "dtb",//thay cre edit tội mình lắm b ơi
  description: "Cấu hình câu trả lời tự động",
  commandCategory: "Hệ Thống",
  usages: "[on/off]",
  cooldowns: 5,
};
const { exec } = require('child_process');
module.exports.handleEvent = async function({ api, event,Users }) {
  if (event.senderID == api.getCurrentUserID()) return;
  const cmdStatus = JSON.parse(fs.readFileSync(path));
  const mentionedUserIds = Object.keys(event.mentions);
  const isBotMentioned = mentionedUserIds.includes(String(api.getCurrentUserID()));
  const isBotReplied = event.messageReply && event.messageReply.senderID == api.getCurrentUserID();
  const isSpecificPhrase = checkForSpecificPhrases(event.body, phrases);
  const isSpecificPhrase1 = checkForSpecificPhrases(event.body, phrases1);
  if (event.senderID == api.getCurrentUserID()) return;
  if(cmdStatus[this.config.name]) {
    if(isBotMentioned || isSpecificPhrase) {
      api.sendMessage(tagg(), event.threadID, event.messageID);
    }
    if(isSpecificPhrase1) {
      api.sendMessage(replyy3(), event.threadID, event.messageID);
    }
    if(isBotReplied) {
      api.sendMessage(replyy(), event.threadID, event.messageID);
    }
  }
};

module.exports.run = async function ({api, event, args}) {
  if(!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));
  const commandStatus = JSON.parse(fs.readFileSync(path, 'utf-8'));
  switch (args[0]) {
    case "on":
      commandStatus[this.config.name] = true;
      api.sendMessage("Đã bật chức năng!", event.threadID);
      break;
    case "off":
      commandStatus[this.config.name] = false;
      api.sendMessage("Đã tắt chức năng!", event.threadID);
      break;
    default:
      api.sendMessage("Bạn cần thêm 'on' hoặc 'off' sau lệnh.", event.threadID, event.messageID);
  }
  fs.writeFileSync(path, JSON.stringify(commandStatus, null, 2));
};
