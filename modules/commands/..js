module.exports.config = {
  name: "hello",
  version: "1.0.0",
  permssion: 0,
  prefix: false,
  credits: "MAHABUB",
  description: "Say hello",
  category: "general",
  usages: "[name]",
  cooldowns: 3,
  allowPrefix: false
};

module.exports.run = async function ({ api, event, args }) {
  return api.sendMessage("Hello from Mahabub!", event.threadID);
};
