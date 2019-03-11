const Discord = require('discord.io-gateway6');
const winston = require('winston');
const ax = require('axios');
const DBLapi = require("dblapi.js");
const dbl = new DBLapi('', Discord);
const auth = require('./auth.json');

// Logger
const form = winston.format.printf(({timestamp,level,message}) => {
  return `${timestamp} ${level}: ${message}`;
});
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(),form),
  transports: [
	new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'info.log', level: 'info' })
  ]
});

// Initialize
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

// Functions
function getRelic(tier,name,channelID){
	if (name==''||name==null||tier==''||tier==null){
		return;
	}
	var t = tier.charAt(0).toUpperCase();
	t = t.concat(tier.substring(1).toLowerCase());
	var n = name.toUpperCase();
	var request = 'http://drops.warframestat.us/data/relics/'+t+'/'+n+'.json'
	ax.get(request)
	.then(response => {
		const rewards = response.data.rewards.Intact;
		var response = '```md\n# Rewards from '+response.data.tier+' '+response.data.name+':\n';
		for (i = 0; i < rewards.length; i++) {
			var rarity = 'common';
			if (rewards[i].chance==2){rarity='rare'};
			if (rewards[i].chance==11){rarity='uncommon'};
			response = response.concat('< '+rarity.padEnd(8,' ')+' > '+rewards[i].itemName+'\n');
		};
		response = response.concat('```')
		bot.sendMessage({
			to: channelID,
			message: response
		});
	})
	.catch(error => {
		logger.log({
		level: 'error',
		message: error
		});
	});
}

function getPrime(name,channelID){
	if (name==''||name==null){
		return;
	}
	var request = 'http://drops.warframestat.us/data/relics.json'
	
	ax.get(request)
	.then(response => {
		const relics = response.data.relics;
		var response = '```md\n# Relics containing \''+name+'\':\n';
		for (i = 0; i < relics.length; i++) {
			if (relics[i].state=='Intact'){
				for (j = 0; j < relics[i].rewards.length; j++){
					if (relics[i].rewards[j].itemName.toLowerCase().includes(name.toLowerCase())){
						var rarity = 'common';
						if (relics[i].rewards[j].chance==2){rarity='rare'};
						if (relics[i].rewards[j].chance==11){rarity='uncommon'};
						response = response.concat('< '+rarity.padEnd(8,' ')+' > '+relics[i].tier.padEnd(4,' ')+' '+relics[i].relicName+': '+relics[i].rewards[j].itemName+'\n');
					}
				}
			}
		};
		response = response.concat('```')
		bot.sendMessage({
			to: channelID,
			message: response
		});
	})
	.catch(error => {
		logger.log({
		level: 'error',
		message: error
		});
	});
}

function getPrice(name,channelID){
	if (name==''||name==null){
		return;
	}
	var n = name.toLowerCase().split(' ').join('_');
	var request = 'https://api.warframe.market/v1/items/'+n+'/statistics';
	ax.get(request)
	.then(response => {
		const stats = response.data.payload.statistics_live;
		var date48 = new Date(stats['48hours'][stats['48hours'].length-1].datetime);
		var date90 = new Date(stats['90days'][stats['90days'].length-1].datetime);
		var response = '\n__**Price statistics from warframe.market on '+name+':**__\n';
		response = response.concat('```md\n# Prices last 48hrs ('+date48.toUTCString()+')\n');
		response = response.concat('> '+stats['48hours'][stats['48hours'].length-1].order_type+'ing\n');
		response = response.concat('Average price: < '+stats['48hours'][stats['48hours'].length-1].avg_price+' >\n');
		response = response.concat('Min price:     < '+stats['48hours'][stats['48hours'].length-1].min_price+' >\n');
		response = response.concat('Max price:     < '+stats['48hours'][stats['48hours'].length-1].max_price+' >\n');
		
		response = response.concat('> '+stats['48hours'][stats['48hours'].length-2].order_type+'ing\n');
		response = response.concat('Average price: < '+stats['48hours'][stats['48hours'].length-2].avg_price+' >\n');
		response = response.concat('Min price:     < '+stats['48hours'][stats['48hours'].length-2].min_price+' >\n');
		response = response.concat('Max price:     < '+stats['48hours'][stats['48hours'].length-2].max_price+' >\n');
		
		response = response.concat('```\n');
		
		response = response.concat('```md\n# Prices last 90days ('+date90.toUTCString()+')\n');
		response = response.concat('> '+stats['90days'][stats['90days'].length-1].order_type+'ing\n');
		response = response.concat('Average price: < '+stats['90days'][stats['90days'].length-1].avg_price+' >\n');
		response = response.concat('Min price:     < '+stats['90days'][stats['90days'].length-1].min_price+' >\n');
		response = response.concat('Max price:     < '+stats['90days'][stats['90days'].length-1].max_price+' >\n');
		
		response = response.concat('> '+stats['90days'][stats['90days'].length-2].order_type+'ing\n');
		response = response.concat('Average price: < '+stats['90days'][stats['90days'].length-2].avg_price+' >\n');
		response = response.concat('Min price:     < '+stats['90days'][stats['90days'].length-2].min_price+' >\n');
		response = response.concat('Max price:     < '+stats['90days'][stats['90days'].length-2].max_price+' >\n');
		
		response = response.concat('```');
		bot.sendMessage({
			to: channelID,
			message: response
		});
	})
	.catch(error => {
		logger.log({
		level: 'error',
		message: error
		});
	});
}

// Events
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ' + bot.username + ' - (' + bot.id + ')');
	dbl.postStats(Object.keys(bot.servers).length, 0, 1);
	setInterval(() => {
        dbl.postStats(Object.keys(bot.servers).length, 0, 1);
    }, 1800000);
});

bot.on('message', async function (user, userID, channelID, message, evt) {
	var args = message.split(' ');
    if (args[0] == '<@550696184742674442>') {
        var cmd = args[1];
       
        args = args.splice(2);
        switch(cmd.toLowerCase()) {
			case 'hello'||'hi'||'yo':
				bot.sendMessage({
                    to: channelID,
                    message: 'Hello!'
                });
				break;
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
				break;
			case 'relic':
				getRelic(args[0],args[1],channelID);
				break;
			case 'prime':
				getPrime(args.join(' '),channelID);
				break;
			case 'price':
				getPrice(args.join(' '),channelID);
				break;
			case 'stats':
				dbl.getStats("550696184742674442")
				.then(stats => {
					bot.sendMessage({
						to: channelID,
						message: '```Server count: '+stats.server_count+' Shards: '+stats.shard_count+'```'
					});
				});
				break;
			case 'help':
				bot.sendMessage({
                    to: channelID,
                    message: '**Commands:**\n```relic <tier> <name> to check a relic (ex: !relic Axi A4)\nprime <name> to check where to find a part (ex: prime nyx)\nprice <name> to check prices from online sellers at warframe.market (needs to be full part name)```'
                });
				break;
			default:
				bot.sendMessage({
                    to: channelID,
                    message: '<@'+userID+'> no such command!'
                });
         }
     }
});
