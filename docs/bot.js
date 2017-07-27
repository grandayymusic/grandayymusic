var Settings = require("./settings.json");
var Discord = require("discord.js");
const ytdl = require('ytdl-core');
var util = require("util");
var youtube = require("./youtube");

var client = new Discord.Client();

var queue = [];
var commandchannel = null;

client.on('message', message => {
    // Voice only works in guilds, if the message does not come from a guild,
    // we ignore it
    if (!message.guild) return;

    if (message.content === 'g.join') {
        if (!message.member.hasPermission("MOVE_MEMBERS")) {
            message.channel.send(message.author + ", you need the permission `MOVE_MEMBERS`")
                .then(x => setTimeout(() => x.delete(), 10000));
            return;
        }
        // Only try to join the sender's voice channel if they are in one themselves
        if (message.member.voiceChannel) {
            message.member.voiceChannel.join()
                .then(connection => { // Connection is an instance of VoiceConnection
                    message.channel.send('Connected. Lets play that noteblock nicely! | Do g.list for songs and g.credits for the credits on this bot!')
                        .then(x => setTimeout(() => x.delete(), 10000));
                })
                .catch(console.error);
        } else {
            message.channel.send('You need to join a voice channel first!')
                .then(x => setTimeout(() => x.delete(), 10000));
        }
    }
    if (message.content === 'g.leave') {
        if (!message.member.hasPermission("MOVE_MEMBERS")) {
            message.channel.send(message.author + ", you need the permission `MOVE_MEMBERS`")
                .then(x => setTimeout(() => x.delete(), 10000));
            return;
        }
        // Only try to join the sender's voice channel if they are in one themselves
        if (message.member.voiceChannel) {
            queue = [];
            message.member.voiceChannel.leave();
            message.channel.send('Adios')
                .then(x => setTimeout(() => x.delete(), 10000));
        } else {
            message.channel.send('You need to join a voice channel first!')
                .then(x => setTimeout(() => x.delete(), 10000));
        }
    }

    if (message.content === 'g.credits') {
        const embed = new Discord.RichEmbed()
            .setColor(0x00AE86)
            .setTimestamp()
            .addField(':musical_note: Credits on making is bot and the dank music!', `Special thanks to these guys!`)
            .addField(`Music provided for the bot`, `The one and only <@!215826291977486336>`)
            .addField(`Main developers:`, `Devs - <@204483358909136896> and <@168827261682843648>\nProfile picture - <@205654142302027777> \nAdded edge - <@140762569056059392>`)
            .setThumbnail(client.avatarURL)
            .setFooter(`Requested by ${message.author.username}`);
        message.channel.send({ embed: embed });
    }
    if (message.content === 'g.help') {
        let embed = new Discord.RichEmbed();

        embed.setTitle("Help");

        embed.setDescription(
            "**Music Commands:**\n" +
            "g.grandayy [song] - *Plays a song from the Grandayy YouTube channel*\n" +
            "g.grande1899 [song] - *Plays a song from the Grande1899 YouTube channel*\n" +
            "g.queue - *Get the current queue*\n" +
            "g.skip - *Skips the current song* **(Admin)**\n" +
            "g.join - *Move the bot into your channel* **(Admin)**\n" +
            "g.leave - *Moves the bot far, far away* **(Admin)**\n" +
            "**Help Commands:**\n" +
            "g.credits - *See whomst'd've made this bot*\n" +
            "g.help - *Shows this help embed*\n");

        message.channel.send({ embed: embed });
    }
    if (message.content.startsWith('g.queue')) {
        message.channel.send({ embed: createQueueEmbed() });
    }

    if (message.content.startsWith('g.skip')) {
        if (!message.member.hasPermission("MOVE_MEMBERS")) {
            message.channel.send(message.author + ", you need the permission `MOVE_MEMBERS`")
                .then(x => setTimeout(() => x.delete(), 10000));
            return;
        }

        let connection = client.guilds.get(Settings.guild).voiceConnection;
        connection.dispatcher.end();
    }
    if (message.content.startsWith('g.grandayy')) {
        let search = message.content.replace('g.grandayy', '');

        youtube.search("UCa6TeYZ2DlueFRne5DyAnyg", search, body => youtube.getIcon("UCa6TeYZ2DlueFRne5DyAnyg", url => {
            add2Queue(body, url, message);
        }));
    }
    if (message.content.startsWith('g.grande1899')) {
        let search = message.content.replace('g.grande1899', '');

        youtube.search("UC9sY9S-ddN-1E0jD2fFWLig", search, body => youtube.getIcon("UC9sY9S-ddN-1E0jD2fFWLig", url => {
            add2Queue(body, url, message);
        }));
    }
});

client.on("ready", () => {
    commandchannel = client.guilds.get(Settings.guild).channels.get(Settings.commands);

    client.user.setGame("grandayy's muzeek | Made by Duster and ItsJustNasty | ", "https://www.twitch.tv/heythatisnasty");
    console.log(`Logged in as ${client.user.username}!`);
});

client.login(Settings.token);

function createVidEmbed(item, channelicon) {
    var embed = new Discord.RichEmbed();

    embed.setThumbnail(item.snippet.thumbnails.high.url);
    embed.setTitle('NOW PLAYING: ' + item.snippet.title);
    embed.setURL(`https://www.youtube.com/watch?v=${item.id.videoId}`);
    embed.setAuthor(item.snippet.channelTitle, channelicon, `https://www.youtube.com/channel/${item.snippet.channelId}`);
    embed.setColor("#cc181e");
    embed.setFooter("YouTube", "https://s.ytimg.com/yts/img/favicon-vflz7uhzw.ico");
    embed.setTimestamp(item.snippet.publishedAt);

    return embed;
}

function createQueueEmbed() {
    var embed = new Discord.RichEmbed();

    for (let i = 0; i < queue.length; i++) {
        let item = queue[i];
        embed.addField(`${i === 0 ? "Now Playing:" : i + ":"}`, `[${item.vid.snippet.title}](https://www.youtube.com/channel/${item.vid.snippet.channelId})`);
    }

    if (queue.length === 0) {
        embed.setDescription("Nothing to see here..");
    }
    
    embed.setColor("#cc181e");
    embed.setFooter("YouTube", "https://s.ytimg.com/yts/img/favicon-vflz7uhzw.ico");

    return embed;
}

function add2Queue(body, url, message) {
    let connection = client.guilds.get(Settings.guild).voiceConnection;
    if (connection === null) {
        message.channel.send("Use g.join to summon me first");
        return;
    }
    if (body.items.length === 0) {
        message.channel.send("Song not found");
        return;
    }

    message.channel.send(`Added ***${body.items[0].snippet.title}*** to the queue`);
    let length = queue.length;
    queue.push({ vid: body.items[0], user: url });
    if (length === 0)
        playNext(message);
}

function playNext(message) {
    if (queue.length === 0) {
        message.channel.send("Queue concluded");
        return;
    }
    message.channel.send({ embed: createVidEmbed(queue[0].vid, queue[0].user) });
    play(queue[0].vid, () => {
        queue.shift();
        playNext(message);
    });
}

function play(item, callback) {
    let connection = client.guilds.get(Settings.guild).voiceConnection;
    const stream = ytdl(`https://www.youtube.com/watch?v=${item.id.videoId}`, { filter: 'audioonly' });
    const dispatcher = connection.playStream(stream);
    dispatcher.on('end', () => callback());
}

function isUrl(s) {
    var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return regexp.test(s);
}
