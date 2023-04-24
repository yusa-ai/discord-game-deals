const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('free')
		.setDescription('Manually send game deals to subscribed channel'),

	async execute(interaction) {},
};
