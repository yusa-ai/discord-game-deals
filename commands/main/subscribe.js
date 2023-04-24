const { SlashCommandBuilder } = require('discord.js');
const Guild = require('../../models/Guild');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('subscribe')
		.setDescription('Subscribe the current text channel to receive game deals'),

	async execute(interaction) {
		await Guild.findOneAndUpdate(
			{ guild_id: interaction.guild.id },
			{
				guild_name: interaction.guild.name,
				channel_id: interaction.channel.id,
			},
			{ upsert: true }
		);

		await interaction.reply(
			'This text channel will now receive game deals every hour!'
		);
	},
};
