var google = require('googleapis');
var util = require('util');
var https = require('https');
var Settings = require('./settings.json');
var youtube = google.youtube({
    version: 'v3',
    auth: Settings.gapi
});

module.exports.search = function (user, word, callback) {
    youtube.search.list({
        part: 'id, snippet',
        q: word,
        channelId: user,
        maxResults: 1
    },
    function (err, data) {
        if (err) {
            console.error(err);
        }
        if (data) {
            callback(data);
        }
    });
};

module.exports.getIcon = function (user, callback) {
    youtube.channels.list({
        part: "snippet",
        id: user
    },
    function (err, data) {
        if (err) {
            console.error(err);
        }
        if (data) {
            callback(data.items[0].snippet.thumbnails.high.url);
        }
    });
};
