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
    var consumerKey = process.env.TWITTER_CONSUMER_KEY;
    var consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
    var accessToken = process.env.TWITTER_ACCESS_TOKEN;
    var accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
    console.log(consumerKey);

    var T = new Twit({
        consumer_key:         consumerKey, // API key
        consumer_secret:      consumerSecret, // API secret
        access_token:         accessToken, 
        access_token_secret:  accessTokenSecret
    });

    // subscribe to #BTMC2015 stream in Montgomery
    var montgomery = ['-87.2', '31.58', '-85.19', '33.05']
    var stream = T.stream('statuses/filter', { track: '#btmc2015', language: 'en' });

    stream.on('tweet', Meteor.bindEnvironment(function (tweet) {
      console.log('new tweet: ' + tweet.id);
      // save tweet data - id, created_at, text, user.id, user.name, user.screen_name
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
