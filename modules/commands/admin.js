const { writeFileSync, readFileSync, existsSync } = require("fs-extra");
const { resolve } = require("path");

module.exports.config = {
	name: "admin",
	version: "1.0.6",
	permssion: 0,
	credits: "Mirai Team (Fixed by Mahabub)",
	description: "Admin Settings",
	prefix: true,
	category: "Admin",
	usages: "[list/add/remove/only/boxonly]",
	cooldowns: 5,
	dependencies: { "fs-extra": "" }
};

module.exports.languages = {
	en: {
		listAdmin: '[Admin] Admin list: \n\n%1',
		notHavePermssion: '[Admin] You have no permission to use "%1"',
		addedNewAdmin: '[Admin] Added %1 Admin(s):\n\n%2',
		removedAdmin: '[Admin] Removed %1 Admin(s):\n\n%2'
	}
};

module.exports.onLoad = function () {
	const path = resolve(__dirname, 'cache', 'data.json');
	if (!existsSync(path)) {
		const obj = { adminbox: {} };
		writeFileSync(path, JSON.stringify(obj, null, 4));
	} else {
		const data = JSON.parse(readFileSync(path, 'utf8'));
		if (!data.hasOwnProperty('adminbox')) data.adminbox = {};
		writeFileSync(path, JSON.stringify(data, null, 4));
	}
};

module.exports.run = async function ({ api, event, args, Users, permssion, getText }) {
	const { threadID, messageID, messageReply, type, mentions, senderID } = event;
	const content = args.slice(1);
	const configPath = global.client.configPath;
	const pathData = resolve(__dirname, 'cache', 'data.json');
	const ADMINBOT = global.config.ADMINBOT;
	const mentionIDs = Object.keys(mentions);
	const config = JSON.parse(readFileSync(configPath, 'utf8'));
	const database = JSON.parse(readFileSync(pathData, 'utf8'));

	const sendError = () => global.utils.throwError(this.config.name, threadID, messageID);

	switch (args[0]) {
		case "list":
		case "all":
		case "-a": {
			let msg = [];
			for (const id of ADMINBOT) {
				try {
					const info = await api.getUserInfo(id);
					msg.push(`- ${info[id].name}\nUID: ${id}`);
				} catch (e) {
					msg.push(`- UID: ${id} (Could not fetch name)`);
				}
			}
			return api.sendMessage(getText("listAdmin", msg.join("\n")), threadID, messageID);
		}

		case "add": {
			if (permssion != 2) return api.sendMessage(getText("notHavePermssion", "add"), threadID, messageID);
			let targetIDs = [];

			if (type === "message_reply") {
				targetIDs.push(messageReply.senderID);
			} else if (mentionIDs.length) {
				targetIDs = mentionIDs;
			} else if (!isNaN(content[0])) {
				targetIDs.push(content[0]);
			} else return sendError();

			let added = [];
			for (const id of targetIDs) {
				if (!ADMINBOT.includes(id)) {
					ADMINBOT.push(id);
					config.ADMINBOT.push(id);
					let name = "Unknown";
					try {
						name = (await Users.getData(id)).name || "Unknown";
					} catch (e) {}
					added.push(`[ ${id} ] » ${name}`);
				}
			}
			writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
			return api.sendMessage(getText("addedNewAdmin", added.length, added.join("\n")), threadID, messageID);
		}

		case "remove":
		case "rm":
		case "delete": {
			if (permssion != 2) return api.sendMessage(getText("notHavePermssion", "delete"), threadID, messageID);
			let targetIDs = [];

			if (type === "message_reply") {
				targetIDs.push(messageReply.senderID);
			} else if (mentionIDs.length) {
				targetIDs = mentionIDs;
			} else if (!isNaN(content[0])) {
				targetIDs.push(content[0]);
			} else return sendError();

			let removed = [];
			for (const id of targetIDs) {
				const index = config.ADMINBOT.findIndex(item => item.toString() === id.toString());
				if (index !== -1) {
					ADMINBOT.splice(index, 1);
					config.ADMINBOT.splice(index, 1);
					let name = "Unknown";
					try {
						name = (await Users.getData(id)).name || "Unknown";
					} catch (e) {}
					removed.push(`[ ${id} ] » ${name}`);
				}
			}
			writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
			return api.sendMessage(getText("removedAdmin", removed.length, removed.join("\n")), threadID, messageID);
		}

		case "only": {
			if (permssion != 2) return api.sendMessage(getText("notHavePermssion", "only"), threadID, messageID);
			config.adminOnly = !config.adminOnly;
			writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
			return api.sendMessage(`» Admin only mode has been ${config.adminOnly ? "enabled" : "disabled"} globally.`, threadID, messageID);
		}

		case "boxonly": {
			if (permssion != 2) return api.sendMessage(getText("notHavePermssion", "boxonly"), threadID, messageID);
			database.adminbox[threadID] = !database.adminbox[threadID];
			writeFileSync(pathData, JSON.stringify(database, null, 4), 'utf8');
			return api.sendMessage(
				`» Admin mode ${database.adminbox[threadID] ? "enabled" : "disabled"} for this thread.`,
				threadID,
				messageID
			);
		}

		default: {
			return api.sendMessage(
				"⚙️ Admin Command Usage:\n\n" +
				"• admin list - Show admins\n" +
				"• admin add @mention / UID - Add admin\n" +
				"• admin remove @mention / UID - Remove admin\n" +
				"• admin only - Toggle global admin-only\n" +
				"• admin boxonly - Toggle thread-only admin usage",
				threadID,
				messageID
			);
		}
	}
};
