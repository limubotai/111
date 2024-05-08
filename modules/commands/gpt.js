const { get } = require('axios');

module.exports.config = {
	name: 'gpt',
	credits: "cliff",
	version: '1.0.0',
	role: 0,
	hasPermision: 0,
	aliases: ["Gpt"],
	cooldown: 0,
	hasPrefix: false,
	description: "RANDOM MODEL HERCAI",
	usage: "{p}{n} <Your_questions>",
	cooldowns: 0,
	usePrefix: false,
	usages: "{p}{n} <Your_questions>",
	commandCategory: "GPT",
};

module.exports.run = async function ({ api, event, args }) {
	const question = args.join(' ');

	const bayot = [
		"v3",
		"v3-32k",
		"turbo-16k",
		"gemini"
	];
	const sheshh = bayot[Math.floor(Math.random() * bayot.length)];

	function sendMessage(msg) {
		api.sendMessage(msg, event.threadID, event.messageID);
	}

	if (!question) return sendMessage("Please provide a question.");

	try {
		const response = await get(`https://hercai.onrender.com/${sheshh}/hercai?question=${encodeURIComponent(question)}`);
		sendMessage(response.data.reply);
	} catch (error) {
		sendMessage("An error occurred: " + error.message);
	}
};
