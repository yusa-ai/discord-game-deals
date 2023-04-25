const mongoose = require('mongoose');

module.exports = mongoose.model(
	'Guild',
	new mongoose.Schema({
		guild_id: String,
		guild_name: String,
		channel_id: String,
		role_id: String,
		deal_ids: [Number],
	})
);
