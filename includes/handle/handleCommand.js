let activeCmd = false;

module.exports = function ({ api, models, Users, Threads, Currencies, ...rest }) {
  const stringSimilarity = require("string-similarity");
  const moment = require("moment-timezone");
  const logger = require("../../utils/log");

  return async function ({ event, ...rest2 }) {
    if (activeCmd) return;

    const dateNow = Date.now();
    const time = moment.tz("Asia/Dhaka").format("HH:mm:ss DD/MM/YYYY");
    const { allowInbox, PREFIX, ADMINBOT, DeveloperMode, adminOnly } = global.config;
    const { userBanned, threadBanned, threadInfo, threadData, commandBanned } = global.data;
    const { commands, aliases, cooldowns } = global.client;

    let { body, senderID, threadID, messageID } = event;
    if (!body) return;

    const threadSetting = Threads.get(threadID) || {};
    const prefix = threadSetting?.prefix || PREFIX;
    const isPrefix = body.startsWith(prefix);
    const args = isPrefix ? body.slice(prefix.length).trim().split(/\s+/) : body.trim().split(/\s+/);
    let commandName = args.shift()?.toLowerCase();

    let command = commands.get(commandName) || aliases.get(commandName);
    const replyAD = "[ MODE ] - Only bot admin can use bot";

    // Admin only global check for commands
    if (
      command &&
      command.config &&
      command.config.name.toLowerCase() === commandName.toLowerCase() &&
      !ADMINBOT.includes(senderID) &&
      adminOnly &&
      senderID !== api.getCurrentUserID()
    ) {
      return api.sendMessage(replyAD, threadID, messageID);
    }

    if (
      typeof body === "string" &&
      body.startsWith(PREFIX) &&
      !ADMINBOT.includes(senderID) &&
      adminOnly &&
      senderID !== api.getCurrentUserID()
    ) {
      return api.sendMessage(replyAD, threadID, messageID);
    }

    if (
      userBanned.has(senderID) ||
      threadBanned.has(threadID) ||
      (allowInbox === false && senderID === threadID)
    ) {
      if (!ADMINBOT.includes(senderID.toString())) {
        if (userBanned.has(senderID)) {
          const { reason, dateAdded } = userBanned.get(senderID) || {};
          return api.sendMessage(
            global.getText("handleCommand", "userBanned", reason, dateAdded),
            threadID,
            async (err, info) => {
              await new Promise(resolve => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            },
            messageID
          );
        } else if (threadBanned.has(threadID)) {
          const { reason, dateAdded } = threadBanned.get(threadID) || {};
          return api.sendMessage(
            global.getText("handleCommand", "threadBanned", reason, dateAdded),
            threadID,
            async (err, info) => {
              await new Promise(resolve => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            },
            messageID
          );
        }
      }
    }

    if (body.startsWith(PREFIX)) {
      if (!command) {
        const allCommandName = Array.from(commands.keys());
        const checker = stringSimilarity.findBestMatch(commandName, allCommandName);
        return api.sendMessage(
          commandName
            ? global.getText("handleCommand", "commandNotExist", checker.bestMatch.target)
            : `The command you are using does not exist. Type ${PREFIX}help to see all available commands.`,
          threadID,
          messageID
        );
      }
    }

    // === SAFETY CHECK for commandBanned usage ===
    if (command && command.config && (commandBanned.get(threadID) || commandBanned.get(senderID))) {
      if (!ADMINBOT.includes(senderID)) {
        const banThreads = commandBanned.get(threadID) || [];
        const banUsers = commandBanned.get(senderID) || [];

        if (banThreads.includes(command.config.name)) {
          return api.sendMessage(
            global.getText("handleCommand", "commandThreadBanned", command.config.name),
            threadID,
            async (err, info) => {
              await new Promise(resolve => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            },
            messageID
          );
        }

        if (banUsers.includes(command.config.name)) {
          return api.sendMessage(
            global.getText("handleCommand", "commandUserBanned", command.config.name),
            threadID,
            async (err, info) => {
              await new Promise(resolve => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            },
            messageID
          );
        }
      }
    }

    // Ensure default values for prefix-related configs
    if (command && command.config) {
      if (typeof command.config.prefix === "undefined") command.config.prefix = true;
      if (typeof command.config.allowPrefix === "undefined") command.config.allowPrefix = false;
    }

    // Prefix check
    if (
      command &&
      command.config &&
      command.config.prefix === false &&
      commandName.toLowerCase() !== command.config.name.toLowerCase() &&
      !command.config.allowPrefix
    ) {
      return api.sendMessage(
        global.getText("handleCommand", "notMatched", command.config.name),
        threadID,
        messageID
      );
    }

    if (command && command.config && command.config.prefix === true && !body.startsWith(prefix)) {
      return;
    }

    // NSFW check
    if (
      command &&
      command.config &&
      command.config.category &&
      command.config.category.toLowerCase() === "nsfw" &&
      !global.data.threadAllowNSFW.includes(threadID) &&
      !ADMINBOT.includes(senderID)
    ) {
      return api.sendMessage(
        global.getText("handleCommand", "threadNotAllowNSFW"),
        threadID,
        async (err, info) => {
          await new Promise(resolve => setTimeout(resolve, 5 * 1000));
          return api.unsendMessage(info.messageID);
        },
        messageID
      );
    }

    // Get thread info (try-catch)
    var threadInfo2;
    if (event.isGroup === true)
      try {
        threadInfo2 = (await Threads.get(threadID)) || (await Threads.getInfo(threadID));
        if (Object.keys(threadInfo2).length === 0) throw new Error();
      } catch (err) {
        logger.log(global.getText("handleCommand", "cantGetInfoThread", "error"));
      }

    // Permission check
    let permssion = 0;
    const threadInfoo = await Threads.get(threadID);
    const isGroupAdmin = threadInfoo?.adminIDs?.find(el => el.id == senderID);
    if (ADMINBOT.includes(senderID)) permssion = 2;
    else if (isGroupAdmin) permssion = 1;

    if (
      command &&
      command.config &&
      command.config.permssion > permssion
    ) {
      return api.sendMessage(
        global.getText("handleCommand", "permissionNotEnough", command.config.name),
        threadID,
        messageID
      );
    }

    // Cooldown handling
    if (command && command.config) {
      if (!client.cooldowns.has(command.config.name)) {
        client.cooldowns.set(command.config.name, new Map());
      }
    }

    const timestamps = command && command.config ? client.cooldowns.get(command.config.name) : undefined;
    const cooldown = (command && command.config ? (command.config.cooldowns || 1) * 1000 : 1000);

    if (
      timestamps &&
      timestamps.has(senderID) &&
      dateNow < timestamps.get(senderID) + cooldown
    ) {
      return api.setMessageReaction("⏳", messageID, () => {}, true);
    }

    // Language loader for command
    let getText2 = () => {};
    if (
      command &&
      command.languages &&
      typeof command.languages === "object" &&
      command.languages.hasOwnProperty(global.config.language)
    ) {
      getText2 = (...values) => {
        let lang = command.languages[global.config.language][values[0]] || "";
        for (let i = values.length; i > 0; i--) {
          const expReg = RegExp("%" + i, "g");
          lang = lang.replace(expReg, values[i]);
        }
        return lang;
      };
    }

    try {
      const Obj = {
        ...rest,
        ...rest2,
        api,
        event,
        args,
        models,
        Users,
        usersData: Users,
        Threads,
        threadsData: Threads,
        Currencies,
        permssion,
        getText: getText2,
      };

      if (command && typeof command.run === "function") {
        activeCmd = true;
        await command.run(Obj);
        timestamps?.set(senderID, dateNow);
        activeCmd = false;

        if (DeveloperMode === true) {
          logger.log(
            global.getText(
              "handleCommand",
              "executeCommand",
              time,
              commandName,
              senderID,
              threadID,
              args.join(" "),
              Date.now() - dateNow
            ),
            "DEV MODE"
          );
        }
        return;
      }
    } catch (e) {
      activeCmd = false;
      return api.sendMessage(
        global.getText("handleCommand", "commandError", commandName, e),
        threadID
      );
    }
  };
};
