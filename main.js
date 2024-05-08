const { readdirSync, readFileSync, writeFileSync } = require("fs-extra");
const { join, resolve } = require('path')
const { execSync } = require('child_process');
const config = require("./config.json");
const listPackage = JSON.parse(readFileSync('./package.json')).dependencies;
const fs = require("fs");
const login = require('./includes/login');
const moment = require("moment-timezone");
const logger = require("./utils/log.js");
const chalk = require("chalk");
const path = require("path");
const express = require('express');
const axios = require('axios');
const { spawn } = require("child_process");
const pkg = require('./package.json');

console.log(chalk.bold.dim(` ${process.env.REPL_SLUG}`.toUpperCase() + `(v${pkg.version})`));
  logger.log(`Getting Started!`, "STARTER");

function startProject() {
    try {
        const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "index.js"], {
            cwd: __dirname,
            stdio: "inherit",
            shell: false
        });

        child.on("close", (codeExit) => {
            if (codeExit !== 0) {
                startProject();
            }
        });

        child.on("error", (error) => {
            console.log(chalk.yellow(``), `An error occurred while starting the child process: ${error}`);
        });
    } catch (error) {
        console.error("An error occurred:", error);
    }
} 

startProject();

global.client = new Object({
  commands: new Map(),
  events: new Map(),
  cooldowns: new Map(),
  eventRegistered: new Array(),
  handleSchedule: new Array(),
  handleReaction: new Array(),
  handleReply: new Array(),
  mainPath: process.cwd(),
  configPath: new String(),
  getTime: function(option) {
    switch (option) {
      case "seconds":
        return `${moment.tz("Asia/Manila").format("ss")}`;
      case "minutes":
        return `${moment.tz("Asia/Manila").format("mm")}`;
      case "hours":
        return `${moment.tz("Asia/Manila").format("HH")}`;
      case "date":
        return `${moment.tz("Asia/Manila").format("DD")}`;
      case "month":
        return `${moment.tz("Asia/Manila").format("MM")}`;
      case "year":
        return `${moment.tz("Asia/Manila").format("YYYY")}`;
      case "fullHour":
        return `${moment.tz("Asia/Manila").format("HH:mm:ss")}`;
      case "fullYear":
        return `${moment.tz("Asia/Manila").format("DD/MM/YYYY")}`;
      case "fullTime":
        return `${moment.tz("Asia/Manila").format("HH:mm:ss DD/MM/YYYY")}`;
    }
  },
  timeStart: Date.now()
});

global.data = new Object({
  threadInfo: new Map(),
  threadData: new Map(),
  userName: new Map(),
  userBanned: new Map(),
  threadBanned: new Map(),
  commandBanned: new Map(),
  threadAllowNSFW: new Array(),
  allUserID: new Array(),
  allCurrenciesID: new Array(),
  allThreadID: new Array()
});

global.utils = require("./utils");
global.loading = require("./utils/log");
global.nodemodule = new Object();
global.config = new Object();
global.configModule = new Object();
global.moduleData = new Array();
global.language = new Object();
global.account = new Object();

// ────────────────── //
// -- LOAD THEMES -- //
const { getThemeColors } = require("./utils/log");
const { cra, cv, cb } = getThemeColors();
// ────────────────── //

const errorMessages = [];
if (errorMessages.length > 0) {
  console.log("Commands with errors:");
  errorMessages.forEach(({ command, error }) => {
    console.log(`${command}: ${error}`);
  });
}
// ────────────────── //
var configValue;
try {
  global.client.configPath = join(global.client.mainPath, "config.json");
  configValue = require(global.client.configPath);
  logger.loader("Found config.json file!");
} catch (e) {
  return logger.loader('"config.json" file not found."', "error");
}

try {
  for (const key in configValue) global.config[key] = configValue[key];
  logger.loader("Config Loaded!");
} catch (e) {
  return logger.loader("Can't load file config!", "error")
}

for (const property in listPackage) {
  try {
    global.nodemodule[property] = require(property)
  } catch (e) { }
}
const langFile = (readFileSync(`${__dirname}/languages/${global.config.language || "en"}.lang`, {
  encoding: 'utf-8'
})).split(/\r?\n|\r/);
const langData = langFile.filter(item => item.indexOf('#') != 0 && item != '');
for (const item of langData) {
  const getSeparator = item.indexOf('=');
  const itemKey = item.slice(0, getSeparator);
  const itemValue = item.slice(getSeparator + 1, item.length);
  const head = itemKey.slice(0, itemKey.indexOf('.'));
  const key = itemKey.replace(head + '.', '');
  const value = itemValue.replace(/\\n/gi, '\n');
  if (typeof global.language[head] == "undefined") global.language[head] = new Object();
  global.language[head][key] = value;
}

global.getText = function(...args) {
  const langText = global.language;
  if (!langText.hasOwnProperty(args[0])) {
    throw new Error(`${__filename} - Not found key language: ${args[0]}`);
  }
  var text = langText[args[0]][args[1]];
  if (typeof text === 'undefined') {
    throw new Error(`${__filename} - Not found key text: ${args[1]}`);
  }
  for (var i = args.length - 1; i > 0; i--) {
    const regEx = RegExp(`%${i}`, 'g');
    text = text.replace(regEx, args[i + 1]);
  }
  return text;
};

try {
  var appStateFile = resolve(join(global.client.mainPath, config.APPSTATEPATH || "appstate.json"));
  var appState = ((process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER) && (fs.readFileSync(appStateFile, 'utf8'))[0] != "[" && config.encryptSt) ? JSON.parse(global.utils.decryptState(fs.readFileSync(appStateFile, 'utf8'), (process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER))) : require(appStateFile);
  logger.loader("Found the bot's appstate.")
} catch (e) {
  logger.loader("Can't find the bot's appstate.", "error");
  return;
}

function onBot() {
  const loginData = {};
  loginData.appState = appState;
  login(loginData, async (err, api) => {
    if (err) {
      if (err.error == 'Error retrieving userID. This can be caused by a lot of things, including getting blocked by Facebook for logging in from an unknown location. Try logging in with a browser to verify.') {
        console.log(err.error)
        process.exit(0)
      } else {
        console.log(err)
        return process.exit(0)
      }
    }
    const custom = require('./custom');
    custom({ api });
    const fbstate = api.getAppState();
    api.setOptions(global.config.FCAOption);
      fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
    let d = api.getAppState();
    d = JSON.stringify(d, null, '\x09');
    const raw = {
      con: (datr, typ) => api.setPostReaction(datr, typ, () => {})
    };
    if ((process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER) && global.config.encryptSt) {
      d = await global.utils.encryptState(d, process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER);
      writeFileSync(appStateFile, d)
    } else {
      writeFileSync(appStateFile, d)
    }
    global.account.cookie = fbstate.map(i => i = i.key + "=" + i.value).join(";");
    global.client.api = api
    global.config.version = config.version,
      (async () => {
        const commandsPath = `${global.client.mainPath}/modules/commands`;
        const listCommand = readdirSync(commandsPath).filter(command => command.endsWith('.js') && !command.includes('example') && !global.config.commandDisabled.includes(command));
        console.log(cv(`\n` + `──LOADING COMMANDS─●`));
        for (const command of listCommand) {
          try {
            const module = require(`${commandsPath}/${command}`);
            const { config } = module;

            if (!config?.name) {
              try {
                throw new Error(`[ COMMAND ] ${command} command has no name property or empty!`);
              } catch (error) {
                console.log(chalk.red(error.message));
                continue;
              }
            }
            if (!config?.commandCategory) {
              try {
                throw new Error(`[ COMMAND ] ${command} commandCategory is empty!`);
              } catch (error) {
                console.log(chalk.red(error.message));
                continue;
              }
            }

            if (!config?.hasOwnProperty('usePrefix')) {
              console.log(`Command`, chalk.hex("#ff0000")(command) + ` does not have the "usePrefix" property.`);
              continue;
            }

            if (global.client.commands.has(config.name || '')) {
              console.log(chalk.red(`[ COMMAND ] ${chalk.hex("#FFFF00")(command)} Module is already loaded!`));
              continue;
            }
            const { dependencies, envConfig } = config;
            if (dependencies) {
              Object.entries(dependencies).forEach(([reqDependency, dependencyVersion]) => {
                if (listPackage[reqDependency]) return;
                
                  try {
                    execSync(`npm --package-lock false --save install ${reqDependency}`, {
                      stdio: 'inherit',
                      env: process.env,
                      shell: true,
                      cwd: join(__dirname, 'node_modules')
                    });
                    require.cache = {};
                  } catch (error) {
                    const errorMessage = `[PACKAGE] Failed to install package ${reqDependency} for module`;
                    global.loading.err(chalk.hex('#ff7100')(errorMessage), 'LOADED');
                  }
              });
            }

            if (envConfig) {
              const moduleName = config.name;
              global.configModule[moduleName] = global.configModule[moduleName] || {};
              global.config[moduleName] = global.config[moduleName] || {};
              for (const envConfigKey in envConfig) {
                global.configModule[moduleName][envConfigKey] = global.config[moduleName][envConfigKey] ?? envConfig[envConfigKey];
                global.config[moduleName][envConfigKey] = global.config[moduleName][envConfigKey] ?? envConfig[envConfigKey];
              }
              var configPath = require('./config.json');
              configPath[moduleName] = envConfig;
              writeFileSync(global.client.configPath, JSON.stringify(configPath, null, 4), 'utf-8');
            }


            if (module.onLoad) {
              const moduleData = {
                api: api
              };
              try {
                module.onLoad(moduleData);
              } catch (error) {
                const errorMessage = "Unable to load the onLoad function of the module."
                throw new Error(errorMessage, 'error');
              }
            }

            if (module.handleEvent) global.client.eventRegistered.push(config.name);
            global.client.commands.set(config.name, module);
            try {
              global.loading.log(`${cra(`LOADED`)} ${cb(config.name)} success`, "COMMAND");
            } catch (err) {
              console.error("An error occurred while loading the command:", err);
            }

            console.err
          } catch (error) {
            global.loading.err(`${chalk.hex('#ff7100')(`LOADED`)} ${chalk.hex("#FFFF00")(command)} fail ` + error, "COMMAND");
          }
        }
      })(),

      (async () => {
        const events = readdirSync(join(global.client.mainPath, 'modules/events')).filter(ev => ev.endsWith('.js') && !global.config.eventDisabled.includes(ev));
        console.log(cv(`\n` + `──LOADING EVENTS─●`));
        for (const ev of events) {
          try {
            const event = require(join(global.client.mainPath, 'modules/events', ev));
            const { config, onLoad, run } = event;
            if (!config || !config.name || !run) {
              global.loading.err(`${chalk.hex('#ff7100')(`LOADED`)} ${chalk.hex("#FFFF00")(ev)} Module is not in the correct format. `, "EVENT");
              continue;
            }


            if (errorMessages.length > 0) {
              console.log("Commands with errors:");
              errorMessages.forEach(({ command, error }) => {
                console.log(`${command}: ${error}`);
              });
            }

            if (global.client.events.has(config.name)) {
              global.loading.err(`${chalk.hex('#ff7100')(`LOADED`)} ${chalk.hex("#FFFF00")(ev)} Module is already loaded!`, "EVENT");
              continue;
            }
            if (config.dependencies) {
              const missingDeps = Object.keys(config.dependencies).filter(dep => !global.nodemodule[dep]);
              if (missingDeps.length) {
                const depsToInstall = missingDeps.map(dep => `${dep}${config.dependencies[dep] ? '@' + config.dependencies[dep] : ''}`).join(' ');
                if (depsToInstall) {
                execSync(`npm install --no-package-lock --no-save ${depsToInstall}`, {
                  stdio: 'inherit',
                  env: process.env,
                  shell: true,
                  cwd: join(__dirname, 'node_modules')
                });
                }
                Object.keys(require.cache).forEach(key => delete require.cache[key]);
              }
            }
            if (config.envConfig) {
              const configModule = global.configModule[config.name] || (global.configModule[config.name] = {});
              const configData = global.config[config.name] || (global.config[config.name] = {});
              for (const evt in config.envConfig) {
                configModule[evt] = configData[evt] = config.envConfig[evt] || '';
              }
              writeFileSync(global.client.configPath, JSON.stringify({
                ...require(global.client.configPath),
                [config.name]: config.envConfig
              }, null, 2));
            }
            if (onLoad) {
              const eventData = {
                api: api
              };
              await onLoad(eventData);
            }
            global.client.events.set(config.name, event);
            global.loading.log(`${cra(`LOADED`)} ${cb(config.name)} success`, "EVENT");
          }
          catch (err) {
            global.loading.err(`${chalk.hex("#ff0000")('ERROR!')} ${cb(ev)} failed with error: ${err.message}` + `\n`, "EVENT");
          }
        }
      })();
    console.log(cv(`\n` + `──BOT START─● `));
    global.loading.log(`${cra(`[ SUCCESS ]`)} Loaded ${cb(`${global.client.commands.size}`)} commands and ${cb(`${global.client.events.size}`)} events successfully`, "LOADED");
    global.loading.log(`${cra(`[ TIMESTART ]`)} Launch time: ${((Date.now() - global.client.timeStart) / 1000).toFixed()}s`, "LOADED");
    global.utils.complete({ raw });
    const listener = require('./includes/listen')({ api });
    global.handleListen = api.listenMqtt(async (error, event) => {
      if (error) {
        if (error.error === 'Not logged in.') {
          logger.log("Your bot account has been logged out!", 'LOGIN');
          return process.exit(1);
        }
        if (error.error === 'Not logged in') {
          logger.log("Your account has been checkpointed, please confirm your account and log in again!", 'CHECKPOINT');
          return process.exit(0);
        }
        console.log(error);
        return process.exit(0);
      }
			if (event.body !== null) {
				if (event.logMessageType === "log:subscribe") {
								const request = require("request");

			 const autofont = {
			sansbold: {
			a: "𝗮", b: "𝗯", c: "𝗰", d: "𝗱", e: "𝗲", f: "𝗳", g: "𝗴", h: "𝗵", i: "𝗶",
			j: "𝗷", k: "𝗸", l: "𝗹", m: "𝗺", n: "𝗻", o: "𝗼", p: "𝗽", q: "𝗾", r: "𝗿",
			s: "𝘀", t: "𝘁", u: "𝘂", v: "𝘃", w: "𝘄", x: "𝘅", y: "𝘆", z: "𝘇",
			A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘", F: "𝗙", G: "𝗚", H: "𝗛", I: "𝗜",
			J: "𝗝", K: "𝗞", L: "𝗟", M: "𝗠", N: "𝗡", O: "𝗢", P: "𝗣", Q: "𝗤", R: "𝗥",
			S: "𝗦", T: "𝗧", U: "𝗨", V: "𝗩", W: "𝗪", X: "𝗫", Y: "𝗬", Z: "𝗭",
			" ": " "
			},
			};

			const textToAutofont = (text, font) => {
			const convertedText = [...text].map(char => font[char] || char).join("");
			return convertedText;
			};
			const modifiedBotName = textToAutofont(botName, autofont.sansbold);

			const ju = textToAutofont(adminName, autofont.sansbold);

			const luh = textToAutofont(prefix, autofont.sansbold);
								const moment = require("moment-timezone");
					const { commands } = global.client;
								var thu = moment.tz('Asia/Manila').format('dddd');
								if (thu == 'Sunday') thu = 'Sunday'
								if (thu == 'Monday') thu = 'Monday'
								if (thu == 'Tuesday') thu = 'Tuesday'
								if (thu == 'Wednesday') thu = 'Wednesday'
								if (thu == "Thursday") thu = 'Thursday'
								if (thu == 'Friday') thu = 'Friday'
								if (thu == 'Saturday') thu = 'Saturday'
								const time = moment.tz("Asia/Manila").format("HH:mm:ss - DD/MM/YYYY");										
								const fs = require("fs-extra");
								const { threadID } = event;

						if (event.logMessageData.addedParticipants && Array.isArray(event.logMessageData.addedParticipants) && event.logMessageData.addedParticipants.some(i => i.userFbId == userid)) {
						api.changeNickname(`》 ${global.config.PREFIX} 《 ❃ ➠ ${global.config.BOTNAME}`, threadID, api.getCurrentUserID);

			let gifUrls = [
			'https://i.imgur.com/bf7bJM5.mp4',
			'https://i.imgur.com/KaFREOI.mp4',
			'https://i.imgur.com/lrS3hJF.mp4',
			'https://i.imgur.com/9eNBFxt.mp4',
			'https://i.imgur.com/lmVFT8X.mp4',
			'https://i.imgur.com/MYZdl8Z.mp4',
			'https://i.imgur.com/1PqqNqr.mp4',
			'https://i.imgur.com/ytDThi8.mp4',
			'https://i.imgur.com/209z0iM.mp4',
			'https://i.imgur.com/VTZWEmH.mp4',
			'https://i.imgur.com/FO3UI1c.mp4',
			'https://i.imgur.com/X34qKhJ.mp4',
			'https://i.imgur.com/WK22w8v.mp4',
			'https://i.imgur.com/tvVDuo6.mp4',
			'https://i.imgur.com/3tgiqQd.mp4',
			'https://i.imgur.com/AfkKH9h.mp4',
			'https://i.imgur.com/wIGJBXq.mp4',
			'https://i.imgur.com/lmMWsR8.mp4',
			'https://i.imgur.com/x0c92nj.mp4'
			];

			let randomIndex = Math.floor(Math.random() * gifUrls.length);
			let gifUrl = gifUrls[randomIndex];
			let gifPath = __dirname + '/cache/connected.mp4';

			axios.get(gifUrl, { responseType: 'arraybuffer' })
			.then(response => {           fs.writeFileSync(gifPath, response.data); 
					return api.sendMessage("𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗜𝗡𝗚...", event.threadID, () => 
   api.sendMessage({ 
    body: `🔴🟢🟡\n\n✅ 𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗 𝗦𝗨𝗖𝗖𝗘𝗦! \n\n➭ BotName: ${global.config.BOTNAME}\n➭ Bot Prefix: ⟨${global.config.PREFIX}⟩\n➭ Admin: ⟨${global.config.BOTOWNER}⟩\n➭ Ownerlink: ‹${global.config.OWNERLINK}›\n➭ Version: ${global.config.version}\n➭ Current Commands: ${commands.size}\n➭ Use ${global.config.PREFIX}help to view command details\n➭ Added bot at: ⟨ ${time} ⟩〈 ${thu} 〉`, 
    attachment: fs.createReadStream(gifPath)
			}, event.threadID)
							);
					})
								.catch(error => {
										console.error(error);
								});
													} else {
														try {
															const fs = require("fs-extra");
															let { threadName, participantIDs } = await api.getThreadInfo(threadID);

															var mentions = [], nameArray = [], memLength = [], userID = [], i = 0;

															let addedParticipants1 = event.logMessageData.addedParticipants;
															for (let newParticipant of addedParticipants1) {
																let userID = newParticipant.userFbId;
																api.getUserInfo(parseInt(userID), (err, data) => {
																	if (err) { return console.log(err); }
																	var obj = Object.keys(data);
																	var userName = data[obj].name.replace("@", "");
																	if (userID !== api.getCurrentUserID()) {

																		nameArray.push(userName);
																		mentions.push({ tag: userName, id: userID, fromIndex: 0 });

																		memLength.push(participantIDs.length - i++);
																		memLength.sort((a, b) => a - b);

																			(typeof threadID.customJoin == "undefined") ? msg = "🌟 Hi!, {uName}\n┌────── ～●～ ──────┐\n----- Welcome to {threadName} -----\n└────── ～●～ ──────┘\nYou're the {soThanhVien} member of this group, please enjoy! 🥳♥" : msg = threadID.customJoin;
																			msg = msg
																				.replace(/\{uName}/g, nameArray.join(', '))
																				.replace(/\{type}/g, (memLength.length > 1) ? 'you' : 'Friend')
																				.replace(/\{soThanhVien}/g, memLength.join(', '))
																				.replace(/\{threadName}/g, threadName);

								const bayot = [
								'https://i.ibb.co/0jfD13g/5bf47044-0957-4f8a-a166-9bca3f4aa7cd.jpg',
								'https://i.ibb.co/jhgc8Kj/ad523982-a45e-41db-836c-f76b5aaa4f9c.jpg',
								'https://i.ibb.co/vwMwRkn/aa13cba8-1c81-4062-87d0-272fcaf88212.jpg',
								'https://i.ibb.co/HC9wQVT/351c6943-dd38-4833-a1af-f06dafa4277f.jpg',
			'https://i.ibb.co/mNGVcRM/Background-Designs-de-Rise-of-the-Teenage-Mutant-Ninja-Turtles-THECAB.jpg','https://i.ibb.co/vwm61bY/Download-Dark-Purple-vector-background-with-bent-lines-for-free.jpg','https://i.ibb.co/JqgvGBX/Free-Photo-Liquid-marbling-paint-texture-background-fluid-painting-abstract-texture-intensive-color.jp','https://i.ibb.co/HHHSWH4/36bc2c91-1426-44d9-9895-331c346aed0d.jpg','https://i.ibb.co/pPpGL7r/205-Amazing-Collections-of-Purple-Backgrounds.jpg','https://i.ibb.co/mBCcYvM/purple-smoke.jpg','https://i.ibb.co/zbfdqvZ/Purple-Butterflies.jpg','https://i.ibb.co/yXdBMkN/Rivet2.jpg','https://i.ibb.co/Pmd696Z/486dfd3c-2cd3-4db3-b29d-c64ffa124cc6.jpg','https://i.ibb.co/CWzCxZ5/Abstract-Wings.jpg'
								];
								const sheshh = bayot[Math.floor(Math.random() * bayot.length)];

								const lubot = [
								'https://i.postimg.cc/wTZdtnfG/0.jpg',
								'https://i.postimg.cc/15wZqJkR/b05ee5c9-a589-4a47-a939-32ffde9280b3.jpg',
								'https://i.postimg.cc/wxRCCwT5/1.jpg',
								'https://i.postimg.cc/Cx5H2QwS/0767d076-eda6-4fab-b31e-6e93fb3b3db2.jpg',
								'https://i.postimg.cc/DwSL64cz/3d9e75fe-fb1b-45f2-b3d1-090188d35594.jpg',
								'https://i.postimg.cc/N0J0zdfq/jah200x.jpg',
								'https://i.postimg.cc/wBZpNZjv/knitemarshall.jpg',
			'https://i.postimg.cc/BQkcdCbF/55e5604c-25ca-4a76-8468-726be51ced5b.jpg','https://i.postimg.cc/BZwxKCxz/3a80d8ad-a30c-4665-a9c8-18e3e1539da5.jpg','https://i.postimg.cc/VkP0qZ5K/cali.jpg','https://i.postimg.cc/DyrLM399/50633291-fb17-4d7a-a1e1-767b48304d59.jpg','https://i.postimg.cc/tCcQw8Fz/4200dc41-7ad5-42ed-a046-686a198a3a3e.jpg','https://i.postimg.cc/T2W4hhbn/nat.jpg','https://i.postimg.cc/QdnQpJGC/31ea87b6-b00b-4b93-81e3-8fd36dc27d43.jpg','https://i.postimg.cc/c1bdGKSY/1cf63eb5-fd2a-42f7-a8d8-38ecf65f67fe.jpg','https://i.postimg.cc/9fgcXz7v/grp-icon.jpg','https://i.postimg.cc/TYxv6nsK/divkjta-2.jpg','https://i.postimg.cc/wMHfSQBH/port-for-boys.jpg','https://i.postimg.cc/pVZqm8Th/RPW-port-girl.jpg','https://i.postimg.cc/Jh0G5fcC/save-follow.jpg','https://i.postimg.cc/R0tjBCwT/divkjta-1.jpg','https://i.postimg.cc/Vvb8d9C3/image.jpg','https://i.postimg.cc/pV8VVxJy/ANIME-MOUTH-GIRL.jpg','https://i.postimg.cc/mDYnqd7Z/divkjta.jpg','https://i.postimg.cc/Gp0qCFL4/isienvh.jpg','https://i.postimg.cc/FR6YMZvq/isol.jpg','https://i.postimg.cc/3wcph7Cn/noah-beck.jpg','https://i.postimg.cc/BvLbxFHB/154debb7-6545-4b4f-a887-02770a152558.jpg','https://i.postimg.cc/C14gDMP4/9ec8f4b2-2cff-47ba-bf05-3d83022070ea.jpg','https://i.postimg.cc/rpXXPR7J/lvrhn.jpg'
								];
								const yawa = lubot[Math.floor(Math.random() * lubot.length)];

																			let callback = function() {
																				return api.sendMessage({ body: msg, attachment: fs.createReadStream(__dirname + `/cache/come.jpg`), mentions }, event.threadID, () => fs.unlinkSync(__dirname + `/cache/come.jpg`))
																			};
																		request(encodeURI(`https://api.popcat.xyz/welcomecard?background=${sheshh}&text1=${userName}&text2=Welcome+To+${threadName}&text3=You+Are+The${participantIDs.length}th+Member&avatar=${yawa}`)).pipe(fs.createWriteStream(__dirname + `/cache/come.jpg`)).on("close", callback);
																									}
																								})
																							}
																						} catch (err) {
																							return console.log("ERROR: " + err);
												}
											 }
											}
											}
			
			if (event.body !== null) {
				 const regEx_tiktok = /https:\/\/(www\.|vt\.)?tiktok\.com\//;
				 const link = event.body;
			if (regEx_tiktok.test(link)) {
															api.setMessageReaction("🚀", event.messageID, () => { }, true);
															axios.post(`https://www.tikwm.com/api/`, {
																url: link
															}).then(async response => { // Added async keyword
																const data = response.data.data;
																const videoStream = await axios({
																	method: 'get',
																	url: data.play,
																	responseType: 'stream'
																}).then(res => res.data);
																const fileName = `TikTok-${Date.now()}.mp4`;
																const filePath = `./${fileName}`;
																const videoFile = fs.createWriteStream(filePath);

																videoStream.pipe(videoFile);

																videoFile.on('finish', () => {
																	videoFile.close(() => {
																		console.log('Downloaded video file.');

																		api.sendMessage({
																			body: `𝖠𝗎𝗍𝗈 𝖣𝗈𝗐𝗇 𝖳𝗂𝗄𝖳𝗈𝗄 \n\n𝙲𝚘𝚗𝚝𝚎𝚗𝚝: ${data.title}\n\n𝙻𝚒𝚔𝚎𝚜: ${data.digg_count}\n\n𝙲𝚘𝚖𝚖𝚎𝚗𝚝𝚜: ${data.comment_count}\n\n𝗬𝗔𝗭𝗞𝗬 𝗕𝗢𝗧 𝟭.𝟬.𝟬𝘃`,
																			attachment: fs.createReadStream(filePath)
																		}, event.threadID, () => {
																			fs.unlinkSync(filePath);  // Delete the video file after sending it
																		});
																	});
																});
															}).catch(error => {
																api.sendMessage(`Error when trying to download the TikTok video: ${error.message}`, event.threadID, event.messageID);
															});
														}
													}
													if (event.body) {
					const emojis = ['😀', '😳', '♥️', '😪', '🥲', '🙀', '😘', '🥺', '🚀', '😝', '🥴', '😐', '😆', '😊', '🤩', '😼', '😽', '🤭', '🐱','😹'];
					const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];			api.setMessageReaction(randomEmoji, event.messageID, () => {}, true);
			}
											if (event.body !== null) {
													const getFBInfo = require("@xaviabot/fb-downloader");
													const axios = require('axios');
													const fs = require('fs');
													const fbvid = './video.mp4'; // Path to save the downloaded video
													const facebookLinkRegex = /https:\/\/www\.facebook\.com\/\S+/;

													const downloadAndSendFBContent = async (url) => {
														try {
															const result = await getFBInfo(url);
															let videoData = await axios.get(encodeURI(result.sd), { responseType: 'arraybuffer' });
															fs.writeFileSync(fbvid, Buffer.from(videoData.data, "utf-8"));
															return api.sendMessage({ body: "𝖠𝗎𝗍𝗈 𝖣𝗈𝗐𝗇 𝖥𝖺𝖼𝖾𝖻𝗈𝗈𝗄 𝖵𝗂𝖽𝖾𝗈\n\n𝗬𝗔𝗭𝗞𝗬 𝗕𝗢𝗧 𝟭.𝟬.𝟬𝘃", attachment: fs.createReadStream(fbvid) }, event.threadID, () => fs.unlinkSync(fbvid));
														}
														catch (e) {
															return console.log(e);
														}
													};

													if (facebookLinkRegex.test(event.body)) {
														downloadAndSendFBContent(event.body);
				 }
			 }
			 const regex = /https:\/\/www\.facebook\.com\/\S+/;
			 if (event.body !== null && !regex.test(event.body)) {
					 const fs = require("fs-extra");
					 const axios = require("axios");
					 const path = require("path");
					 try {
							 const url = event.body;
							 const path = `./modules/commands/cache/bayot.mp4`;

							 axios({
									 method: "GET",
									 url: `https://instadl.onrender.com/insta?url=${encodeURIComponent(url)}`
							 })
							 .then(async (res) => {
									 if (res.data.url) {
											 const response = await axios({
													 method: "GET",
													 url: res.data.url,
													 responseType: "arraybuffer"
											 });
											 fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));
											 if (fs.statSync(path).size / 1024 / 1024 > 25) {
													 return api.sendMessage("The file is too large, cannot be sent", event.threadID, () => fs.unlinkSync(path), event.messageID);
											 }

											 const messageBody = `𝖠𝗎𝗍𝗈 𝖣𝗈𝗐𝗇 Instagram\n\n𝗬𝗔𝗭𝗞𝗬 𝗕𝗢𝗧 𝟭.𝟬.𝟬𝘃`;
											 api.sendMessage({
													 body: messageBody,
													 attachment: fs.createReadStream(path)
											 }, event.threadID, () => fs.unlinkSync(path), event.messageID);
					 } else {
				 }
			 });
				 } catch (err) {
						console.error(err);
				 }
			 }
      return listener(event);
    });
  });
}

// ___END OF EVENT & API USAGE___ //

(async () => {
  try {
    console.log(cv(`\n` + `──DATABASE─●`));
    global.loading.log(`${cra(`[ CONNECT ]`)} Connected to JSON database successfully!`, "DATABASE");
    onBot();
  } catch (error) {
    global.loading.err(`${cra(`[ CONNECT ]`)} Failed to connect to the JSON database: ` + error, "DATABASE");
  }
})();

const app = express();
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/includes/cover/bwesit.html'));
});

app.listen(3000, () => {
  global.loading.log(`${cra(`[ CONNECT ]`)} Bot is running on port: 3000`);
});

/* *
This bot was created by me (CATALIZCS) and my brother SPERMLORD. Do not steal my code. (つ ͡ ° ͜ʖ ͡° )つ ✄ ╰⋃╯
This file was modified by me (@YanMaglinte). Do not steal my credits. (つ ͡ ° ͜ʖ ͡° )つ ✄ ╰⋃╯
* */