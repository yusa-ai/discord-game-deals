const axios = require('axios');
const fs = require('node:fs');
const path = require('node:path');
const {
	ActivityType,
	Client,
	Collection,
	EmbedBuilder,
	Events,
	GatewayIntentBits,
} = require('discord.js');
const dotenv = require('dotenv');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const mongoose = require('mongoose');
const Guild = require('./models/Guild');
const cron = require('node-cron');
const { convert } = require('html-to-text');

dotenv.config();

client.commands = new Collection();

// Retrieve commands
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(
				`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
			);
		}
	}
}

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.5qrgnen.mongodb.net/${process.env.MONGODB_DBNAME}?retryWrites=true&w=majority`;
mongoose.connect(uri).then(() => {
	console.log('MongoDB connection initialized');
});

client.login(process.env.DISCORD_BOT_TOKEN);

client.once(Events.ClientReady, (c) => {
	client.user.setActivity('for game deals', {
		type: ActivityType.Watching,
	});

	console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Handle commands
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: 'There was an error while executing this command!',
				ephemeral: true,
			});
		} else {
			await interaction.reply({
				content: 'There was an error while executing this command!',
				ephemeral: true,
			});
		}
	}
});

const toEmbed = (title, url, description, instructions, image) => {
	const embed = new EmbedBuilder()
		.setAuthor({
			name: 'New Giveaway!',
			url: 'https://github.com/yusa-ai/discord-game-deals',
		})
		.setTitle(title)
		.setURL(url)
		.setDescription(description)
		.addFields({
			name: 'Instructions',
			value: instructions,
		})
		.setImage(image)
		.setColor('#5743a8')
		.setFooter({
			text: 'CyberDeals',
			iconURL: 'https://i.imgur.com/QPHE6ot.png',
		})
		.setTimestamp();

	return embed;
};

// Run every hour
cron.schedule('0 * * * *', () => {
	axios
		.get('https://www.gamerpower.com/api/filter', {
			params: {
				platform: 'epic-games-store.steam.ubisoft.gog.battlenet.origin',
				type: 'game',
			},
		})
		.then(async (response) => {
			const guilds = await Guild.find({});
			for (const guild of guilds) {
				for (const deal of response.data) {
					if (!guild.deal_ids.includes(deal.id)) {
						const embed = toEmbed(
							deal.title,
							deal.open_giveaway_url,
							deal.description,
							convert(deal.instructions),
							deal.image
						);

						const text = guild.role_id ? `<@&${guild.role_id}>` : null;

						const channel = await client.channels.fetch(guild.channel_id);
						await channel.send({
							content: text,
							embeds: [embed],
						});

						// Add to deal_ids
						await Guild.updateOne(
							{ guild_id: guild.guild_id },
							{ $push: { deal_ids: deal.id } }
						);
					}
				}
			}
		});

	console.log('Sent game deals');
});
