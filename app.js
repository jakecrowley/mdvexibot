const Discord = require('discord.js');
const mongodb = require('mongodb');

const vexdata = require('./vexdata');

const client = new Discord.Client();
const MongoClient = new mongodb.MongoClient();
const token = process.env.VEXIBOT_TOKEN;
const [mongodbUri, username, password, host, port, database] = process.env.VEXIBOT_DB.match(/^(?:mongodb:\/\/)(.+):(.+)@(.+):(.+)\/(.+)$/);
const db = new mongodb.Db(database, new mongodb.Server(host, Number(port)));
const prefix = '^';
const commandInfo = {
	ping: 'Pong!',
	uptime: 'Time since bot last restarted.',
	team: 'General information about a VEX team.',
	awards: 'Awards earned by a VEX team.'
};
const commands = {};

let helpDescription = `\`${prefix}help\`: Provides information about all commands.`;

const handleCommand = message => {
	const [cmd, args] = message.content.substring(prefix.length).split(' ', 2);

	if (commands.hasOwnProperty(cmd)) {
		commands[cmd](message, args);
	} else if (cmd == 'help') {
		const embed = new Discord.RichEmbed()
			.setColor('RANDOM')
			.setTitle('Commands')
			.setDescription(helpDescription);
		message.channel.send({embed});
	}
}

client.on('ready', () => {
	console.log('Ready!');
	vexdata.update();
});

client.on('error', console.error);

client.on('message', message => {
	if (message.content.startsWith(prefix)) {
		handleCommand(message);
	}
});

db.open()
	.then(db => db.authenticate(username, password))
	.then(db => {
		Object.keys(commandInfo).forEach(name => commands[name] = require('./commands/' + name));
		Object.entries(commandInfo).forEach(([name, desc]) => {
			helpDescription += `\n\`${prefix}${name}\`: ${desc}`;
		});
		client.login(token).catch(console.error);
	}).catch(console.error);

module.exports.client = client;
module.exports.db = db;
