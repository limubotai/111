const axios = require("axios");

module.exports.config = {
	name: "imgur2",
	version: "9.0.7",
	hasPermssion: 0,
	role: 0,
	hasPrefix: false,
	credits: "Eugene Aguilar",
	description: "Upload an image to imgur",
	commandCategory: "tools",
	usages: "imgur [reply to an image]",
	cooldowns: 0,
};

module.exports.run = async function ({ api, event }) {
	const attachments = event.messageReply.attachments;

	try {
		const imageLinks = attachments.map(attachment => attachment.url);
		const uploadedImages = [];

		for (const imageLink of imageLinks) {
			const response = await axios.get(`https://eurix-api.replit.app/imgur?link=${encodeURIComponent(imageLink)}`);
			const uploadedImage = response.data.uploaded.image;
			uploadedImages.push(uploadedImage);
		}

		api.sendMessage(`Uploaded images:\n${uploadedImages.join("\n")}`, event.threadID, event.messageID);
	} catch (error) {
		console.error("Error uploading image(s) to Imgur:", error);
	}
};