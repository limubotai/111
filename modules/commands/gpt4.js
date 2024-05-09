const axios = require('axios');

module.exports.config = {
	name: 'gpt4',
	version: '1.1.1',
	hasPermssion: 0,
	role: 0,
	credits: 'hazey_api',
	description: 'An AI powered by ChatGPT',
	usePrefix: false,
	hasPrefix: false,
	commandCategory: 'chatbots',
	usages: '[prompt]',
	usage: 'prompt',
	cooldowns: 0,
	aliases: ["GPT2","Gpt2"],
	cooldown: 0,
};

function formatFont(text) { 
	const fontMapping = {
		a: "𝚊", b: "𝚋", c: "𝚌", d: "𝚍", e: "𝚎", f: "𝚏", g: "𝚐", h: "𝚑", i: "𝚒", j: "𝚓", k: "𝚔", l: "𝚕", m: "𝚖",
		n: "𝚗", o: "𝚘", p: "𝚙", q: "𝚚", r: "𝚛", s: "𝚜", t: "𝚝", u: "𝚞", v: "𝚟", w: "𝚠", x: "𝚡", y: "𝚢", z: "𝚣",
		A: "𝙰", B: "𝙱", C: "𝙲", D: "𝙳", E: "𝙴", F: "𝙵", G: "𝙶", H: "𝙷", I: "𝙸", J: "𝙹", K: "𝙺", L: "𝙻", M: "𝙼",
		N: "𝙽", O: "𝙾", P: "𝙿", Q: "𝚀", R: "𝚁", S: "𝚂", T: "𝚃", U: "𝚄", V: "𝚅", W: "𝚆", X: "𝚇", Y: "𝚈", Z: "𝚉"
	};

	return text.split('').map(char => fontMapping[char] || char).join('');
}

module.exports.run = async function({ api, event, args }) {
	let user = args.join(" ");
	try {
		if (!user) { 
			return api.sendMessage("Please provide a question first!", event.threadID, event.messageID);
		}
		api.sendMessage(`🔍𝙎𝙚𝙖𝙧𝙘𝙝𝙞𝙣𝙜 𝙋𝙡𝙚𝙖𝙨𝙚 𝙒𝙖𝙞𝙩....`, event.threadID, event.messageID);
		const response = await axios.get(`https://haze-llm-model-74e9fe205264.herokuapp.com/api/chat?content=${encodeURIComponent(user)}`);
		const responseData = response.data;
		const content = formatFont(responseData.choices[0].message.content);
		api.sendMessage({ body: `🔮 GPT4 (𝐀𝐈)\n\n🖋️ Ans: '${content}'` }, event.threadID, event.messageID);
	} catch (err) {
		console.error(err);
		return api.sendMessage("An error occurred while processing your request.", event.threadID, event.messageID);
	}  
}
