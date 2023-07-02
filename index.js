//const values
const Discord = require("discord.js");
const config = require("./config.json");
const eventHandler = require('./handlers/eventHandler');

//gateway intents
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

eventHandler(client);

client.login(config.BOT_TOKEN);