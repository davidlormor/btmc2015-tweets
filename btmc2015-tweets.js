Tweets = new Mongo.Collection("tweets");

if (Meteor.isClient) {
  Template.body.helpers({
    tweets: function(){
      return Tweets.find({}, {sort: {tweetedAt: -1}});
    },
    tweetsCount: function(){
      return Tweets.find({}).count();
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    var Twit = Meteor.npmRequire('twit');
    var twitterSettings = Meteor.settings.twitter;
    console.log(twitterSettings.consumerKey);

    var T = new Twit({
        consumer_key:         twitterSettings.consumerKey,
        consumer_secret:      twitterSettings.consumerSecret,
        access_token:         twitterSettings.accessToken, 
        access_token_secret:  twitterSettings.accessTokenSecret
    });

    // subscribe to #BTMC2015 stream
    var stream = T.stream('statuses/filter', { track: '#btmc2015', language: 'en' });

    // save tweets to #BTMC2015 - id, created_at, text, user.id, user.name, user.screen_name
    stream.on('tweet', Meteor.bindEnvironment(function (tweet) {
      console.log('new tweet: ' + tweet.id);
      
      Tweets.insert({
        tweetId: tweet.id,
        tweetedAt: tweet.created_at,
        text: tweet.text,
        userId: tweet.user.id,
        userName: tweet.user.name,
        userScreenName: tweet.user.screen_name
      });
    }));
  });
}
