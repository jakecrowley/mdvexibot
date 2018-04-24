const Discord = require('discord.js');
const mongodb = require('mongodb');
const util = require('util');

const client = new Discord.Client();
const MongoClient = mongodb.MongoClient;
const token = process.env.VEXIBOT_TOKEN;
const mongodbUri = process.env.MONGODB_URI;
const mongodbOptions = {
	keepAlive: 1,
	connectTimeoutMS: 30000,
	reconnectTries: 30,
	reconnectInterval: 5000
};
const prefix = '^';
const commandInfo = {
	ping: 'Pong!',
	uptime: 'Time since bot last restarted.',
	sub: 'Manage team update subscriptions.',
	team: 'General information about a team.',
	awards: 'Awards earned by a team.',
	skills: 'Skills scores achieved by a team.',
	topskills: 'Official Robot Skills rankings for a grade.'
};
const commands = {};

let db, vexdata, events;

let helpDescription = `\`${prefix}help\`: Provides information about all commands.`;

const clean = text => {
	if (typeof(text) === 'string') {
		return text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203)).slice(0, 1990);
	}
	return text;
};

const handleCommand = message => {
	const slice = message.content.indexOf(' ');
	const cmd = message.content.slice(prefix.length, (slice < 0) ? message.content.length : slice);
	const args = (slice < 0) ? '' : message.content.slice(slice);

	if (commands.hasOwnProperty(cmd)) {
		commands[cmd](message, args);
	} else if (cmd === 'help') {
		const embed = new Discord.MessageEmbed()
			.setColor('RANDOM')
			.setTitle('Commands')
			.setDescription(helpDescription);
		message.channel.send({embed})
			.then(reply => addFooter(message, embed, reply))
			.catch(console.error);
	} else if (cmd === 'eval') {
		if (message.author.id === '197781934116569088') {
			try {
				let evaled = eval(args);
				if (typeof evaled !== 'string') {
					evaled = util.inspect(evaled);
				}
				message.channel.send(clean(evaled), {code: 'xl'});
			} catch (error) {
				message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(error)}\`\`\``);
			}
		} else {
			message.reply('you don\'t have permission to run that command.');
		}
	}
};

const addFooter = (message, embed, reply) => {
	const author = message.member ? message.member.displayName : message.author.username;

	embed.setFooter(`Triggered by ${author}`, message.author.displayAvatarURL)
		.setTimestamp(message.createdAt);
	reply.edit({embed});
};

client.on('ready', () => {
	console.log('Ready!');
	client.user.setPresence({status: 'online', activity: {name: `${prefix}help`, type: 'STREAMING', url: 'https://github.com/jtkiesel/vexibot'}});
	vexdata.update();
});

client.on('error', console.error);

client.on('message', message => {
	if (message.content.startsWith(prefix)) {
		handleCommand(message);
	}
});

MongoClient.connect(mongodbUri, mongodbOptions).then(mongoClient => {
	db = mongoClient.db(mongodbUri.match(/\/([^/]+)$/)[1]);
	module.exports.db = db;
	
	Object.keys(commandInfo).forEach(name => commands[name] = require('./commands/' + name));
	Object.entries(commandInfo).forEach(([name, desc]) => helpDescription += `\n\`${prefix}${name}\`: ${desc}`);

	vexdata = require('./vexdata');
	events = require('./events');
	client.login(token).catch(console.error);
}).catch(console.error);

module.exports.client = client;
module.exports.addFooter = addFooter;
