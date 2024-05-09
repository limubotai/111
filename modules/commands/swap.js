const axios = require('axios');
const fs = require('fs-extra');

module.exports.config = {
	name: "swap",
	version: "7.2",
	hasPermssion: 0,
	role: 0,
	hasPrefix: false,
	usePrefix: false,
	credits: "Hazeyy",
	description: "(Face Swap)",
	commandCategory: "no prefix",
	usages: "[Reply to 2 images to swap]",
	cooldowns: 2,
};

module.exports.run = async function ({ api, event }) {
	const reply = (message) => api.sendMessage(message, event.threadID, event.messageID);

	if (event.type === "message_reply") {
		const attachments = event.messageReply.attachments.filter(attachment => attachment.type === "photo");

		if (attachments.length >= 2) {
			const [url1, url2] = attachments.map(attachment => attachment.url);
			const path = __dirname + `/cache/swapped_image.jpg`;

			api.sendMessage("🔮 | Please wait while we swap your images...", event.threadID, event.messageID);

			try {
				const response = await axios.get('https://haze-faceswap.replit.app/swap', {
					params: {
						swap_image: url1,
						target_image: url2
					}
				});

				const processedImageURL = response.data.hazeswap;
				const { data } = await axios.get(processedImageURL, { responseType: "stream" });

				const writer = fs.createWriteStream(path);
				data.pipe(writer);

				writer.on('finish', () => {
					api.sendMessage({
						body: "🔮 Image Swap Successful",
						attachment: fs.createReadStream(path)
					}, event.threadID, (err, messageInfo) => {
						if (err) {
							reply("🤖 Error sending message: " + err);
						} else {
							fs.unlinkSync(path);
						}
					});
				});
			} catch (error) {
				reply(`🤖 Processing images failed: ${error}`);
			}
		} else {
			reply("🔮 Face Swap\n\nUsage: swap [reply 1 and 2 image]");
		}
	}
};
