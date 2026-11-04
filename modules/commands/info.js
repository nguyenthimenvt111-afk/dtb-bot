const axios = require('axios');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const tokeninfo = config.ACCESSTOKEN;
module.exports = {
  config: {
    name: "info",
    usePrefix: true,
    version: "2.1.0",
    hasPermssion: 0,
    credits: "dtb",
    description: "Lấy thông tin người dùng Facebook",
    commandCategory: "Tiện ích",
    usages: "[uid/link/@tag]",
    cooldowns: 5,
  },
  convert(timestamp) {
    try {
      return new Date(timestamp).toLocaleString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Ngày không hợp lệ';
    }
  },
  async run({ api, event, args, Currencies }) {
    const token =`${tokeninfo}`;
    let id;
    id = Object.keys(event.mentions).length > 0 
      ? Object.keys(event.mentions)[0].replace(/\&mibextid=ZbWKwL/g,'')
      : args[0] ? (isNaN(args[0]) ? await global.utils.getUID(args[0]) : args[0]) : event.senderID;

    if (event.type === "message_reply") id = event.messageReply.senderID;

    try {
      api.sendMessage('🔄 Đang lấy thông tin...', event.threadID, event.messageID);
      const resp = await axios.get(`https://graph.facebook.com/${id}?fields=id,is_verified,cover,updated_time,work,education,likes,work,posts,hometown,username,family,timezone,link,name,locale,location,about,website,birthday,gender,relationship_status,significant_other,quotes,first_name,subscribers.limit(0)&access_token=${token}`);

      // Xử lý các thông tin chi tiết
      var {work,photos,likes:li,posts:ps,family:fd,education:ed}=resp.data,
          lkos='',pst='',fml='',wk='',edc='',
          k='không có',u=undefined;

      // Công việc
      if (work==u){wk=k}else{
        for(var _=0;_<work.length;_++){
          var wks=work[_],
              link_work=wks.id,
              cv=wks['employer']['name'];
          wk+=`\n│  ➢ `+cv+`\n│     ➛ Link: FB.com/${link_work}`
        }
      }

      // Bài viết đã like
      if (li==u){lkos=k}else{
        for(var o=0;o<(li.data.length>5?5:li.data.length);o++){
          var lks=li.data[o],
              nm=lks.name,
              ct=lks.category,
              link=lks.id,
              tm=lks.created_time;
          lkos+=`\n    ${o+1}. ${nm}\n     ➛ ${ct}\n     ➛ Time follow: ${this.convert(tm)}\n     ➛ Link: FB.com/${link}`
        }
      }

      // Bài viết 
      if (ps==u){pst=k}else{
        for(var i=0;i<(ps.data.length>5?5:ps.data.length);i++){
          var pt=ps.data[i],
              tm=pt.created_time,
              nd=pt.message,
              lk=pt.actions[0].link;
          pst+=`\n│    ${i+1}.\n│📝 Tiêu đề: `+nd+'\n│⏰ Time: '+this.convert(tm)+'\n│🔗 Link: '+lk+'\n│'
        }
      }

      // Thành viên gia đình
      if (fd==u){fml=k}else{
        for(var i=0;i<fd.data.length;i++){
          var fmb=fd.data[i],
              dc=(await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${fmb.relationship}`)).data[0][0][0],
              n=fmb.name,
              uid=fmb.id,
              rl=fmb.relationship;
          fml+=`\n│  ${i+1}. `+n+' ('+dc+')\n     ➛ Link: FB.com/'+uid
        }
      }

      // Trường
      if(ed==u){edc=k}else{
        for(var i=0;i<ed.length;i++){
          var edt=ed[i],
              dc=(await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${edt.type}`)).data[0][0][0],
              sc=edt.school.name,
              nm=edt.type;
          edc+=`\n│ ${sc}\n│ (${dc})`
        }
      }
      const info = {
        name: resp.data.name,
        username: resp.data.username || "❎",
        link_profile: resp.data.link,
        bio: resp.data.about || "Không có tiểu sử",
        created_time: (resp.data.created_time),
        gender: resp.data.gender === 'male' ? 'Nam' : resp.data.gender === 'female' ? 'Nữ' : '❎',
        relationship_status: resp.data.relationship_status || "Không có",
        rela: resp.data.significant_other?.name || '',
        id_rela: resp.data.significant_other?.id,
        bday: resp.data.birthday || "Không công khai",
        follower: resp.data.subscribers?.summary?.total_count || "❎",
        is_verified: resp.data.is_verified ? "✔️ Đã xác minh" : "❌ Chưa xác minh",
        locale: resp.data.locale || "❎",
        hometown: resp.data.hometown?.name || "Không công khai",
        cover: resp.data.cover?.source || null,
        ban: global.data.userBanned.has(id) ? "Đang bị ban" : "Không bị ban",
        money: ((await Currencies.getData(id)) || {}).money || 0,
        web: resp.data.website || "không có",
        avatar: `https://graph.facebook.com/${id}/picture?width=1500&height=1500&access_token=${token}`,
      };
      const infoMessage = `
╭────────────⭓
│ Tên: ${info.name}
│ Biệt danh: ${info.username}
│ FB: ${info.link_profile}
│ Giới tính: ${info.gender}
│ Mối quan hệ: ${info.relationship_status} ${info.rela || ''}${info.id_rela ? `
│  ➣ Link: FB.com/${info.id_rela}`: ''}
│ Sinh nhật: ${info.bday}
│ Giới thiệu: ${info.bio}
│ Nơi sinh: ${info.hometown}
│ Làm việc tại: ${wk}
│ Web: ${info.web}
│ Số follow: ${info.follower.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
├────────────⭔
│ Thành viên gia đình: ${fml.replace(', ','')}
│ Các trang đã like: ${lkos}
├────────────⭔
│ Kiểm tra cấm: ${info.ban}
│ Tiền hiện có: ${info.money.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
╰────────────⭓
  📌 Thả cảm xúc 👍 để check bài đăng`;
      const attachments = [];
      if (info.cover) {
        try {
          const coverPhoto = await axios.get(info.cover, { responseType: 'stream' });
          attachments.push(coverPhoto.data);
        } catch (error) {
          api.sendMessage('Không thể truy xuất ảnh bìa.', event.threadID, event.messageID);
        }
      }
      try {
        const avatarPhoto = await axios.get(info.avatar, { responseType: 'stream' });
        attachments.push(avatarPhoto.data);
      } catch (error) {
        api.sendMessage('Không thể truy xuất avatar.', event.threadID, event.messageID);
      }
      api.sendMessage({ body: infoMessage, attachment: attachments }, event.threadID, (err, info) => {
        global.client.handleReaction.push({
          name: this.config.name,
          messageID: info.messageID,
          author: id
        });
      }, event.messageID);
    } catch (error) {
      api.sendMessage(`Đã xảy ra lỗi: ${error.message}`, event.threadID, event.messageID);
    }
  },
  handleReaction: async function ({ args, api, event, handleReaction }) {
    if (event.reaction !== '👍') {
      return;
    }

    let resp = await axios.get(`https://graph.facebook.com/${handleReaction.author}?fields=id,likes,family,posts&access_token=${tokeninfo}`);
    console.log(resp)
    let send = msg => api.sendMessage(msg, event.threadID, event.messageID);
    let { posts, likes, family } = resp.data, p = '', l = '', f = '';
    if (posts == undefined) {
      return send('❎ Không có bài đăng nào!');
    } else {
      for (let i = 0; i < posts.data.length; i++) {
        let { created_time: c_t, message: ms, actions, privacy, shares, status_type: s_t } = posts.data[i];
        let sr = shares == undefined ? 0 : shares.count, 
            pv = privacy.description, 
            a_l = actions[0].link.replace('https://www.facebook.com', 'https://FB.com');
        p += `
╭─────────────⭓
⏰ Tạo lúc: ${this.convert(c_t)}
✏️ Trạng thái: ${pv}
🔀 Lượt chia sẻ: ${sr}
ℹ️ Loại trạng thái: ${s_t}
🔗 Link: ${a_l}
📝 Nội dung: ${ms || 'không có tiêu đề'}
╰─────────────⭓
  `;
      }
      return send(`${p}\n`);
    }
  }
};