const {
	SlashCommandBuilder,
	RoleSelectMenuBuilder,
	ActionRowBuilder,
} = require('discord.js');
const Guild = require('../../models/Guild');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('role')
		.setDescription('Set which role to ping when there is a new game deal'),

	async execute(interaction) {
		const select = new RoleSelectMenuBuilder({
			custom_id: 'role',
			min_values: 1,
			max_values: 1,
			placeholder: 'Select role',
		});
		const row = new ActionRowBuilder().addComponents(select);

		const response = await interaction.reply({
			content: 'Select role:',
			components: [row],
		});

		const collectorFilter = (i) => i.user.id === interaction.user.id;

		try {
			const choice = await response.awaitMessageComponent({
				filter: collectorFilter,
				time: 60000,
			});

			const selectedRole = choice.roles.entries().next().value;
			const selectedRoleId = selectedRole[1].id;

			await Guild.findOneAndUpdate(
				{ guild_id: interaction.guild.id },
				{
					guild_name: interaction.guild.name,
					channel_id: interaction.channel.id,
					role_id: selectedRoleId,
				},
				{ upsert: true }
			);

			await interaction.editReply({
				content: 'CyberDeals will now ping your selected role.',
				components: [],
			});
		} catch (e) {
			await interaction.editReply({
				content: 'Confirmation not received within 1 minute, cancelling',
				components: [],
			});
		}
	},
};
