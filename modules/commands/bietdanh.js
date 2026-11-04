module.exports.config = {
    name: 'bietdanh',
    version: '1.0.0',
    hasPermssion: 0,
    credits: "dtb",
    description: 'Đổi biệt danh trong nhóm (alias của setname)',
    commandCategory: 'Quản Lí Box',
    usages: '[trống/reply/tag] + [name]',
    cooldowns: 5
};

module.exports.run = async function(params) {
    return require('./setname.js').run(params);
};
