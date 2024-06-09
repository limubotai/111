async function findUid(link) {
	try {
		const response = await axios.post(
			'https://seomagnifier.com/fbid',
			new URLSearchParams({
				'facebook': '1',
				'sitelink': link
			}),
			{
				headers: {
					'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
					'Cookie': 'PHPSESSID=0d8feddd151431cf35ccb0522b056dc6'
				}
			}
		);
		const id = response.data;
		if (isNaN(id)) {
			const html = await axios.get(link);
			const $ = cheerio.load(html.data);
			const el = $('meta[property="al:android:url"]').attr('content');
			if (!el) {
				throw new Error('UID not found');
			}
			const number = el.split('/').pop();
			return number;
		}
		return id;
	} catch (error) {
		throw new Error('An unexpected error occurred. Please try again.');
	}
}

module.exports.config = {
	name: "uid",
	role: 0,
	credits: "Mirai Team",
	description: "Get the user's Facebook UID.",
	hasPrefix: false,
	usePrefix: false,
	commandCategory: "info",
	hasPermission: 0,
	usages: "{p}uid {p}uid @mention {p}uid fblink",
	cooldown: 5,
	aliases: ["id","ui"]
};

module.exports.run = async function({ api, event }) {
	if (Object.keys(event.mentions).length === 0) {
		if (event.messageReply) {
			const senderID = event.messageReply.senderID;
			return api.shareContact(senderID, event.threadID);
		} else {
			return api.shareContact(`${event.senderID}`, event.threadID);
		}
	} else {
		for (const mentionID in event.mentions) {
			const mentionName = event.mentions[mentionID];
			api.sendMessage(`${mentionName.replace('@', '')}: ${mentionID}`, event.threadID);
		}
	}
};

