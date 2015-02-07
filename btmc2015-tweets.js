Tweets = new Mongo.Collection("tweets");

if (Meteor.isClient) {
  Router.route('/', function () {
    this.render('home');
  });
  Template.body.helpers({
    tweets: function(){
      return Tweets.find({}, {sort: {tweetedAt: -1}});
    },
    mentions: function(){
      return Tweets.find({}).count();
    },
    winnerExists: function() {
      return Session.get('winner');
    },
    winnerText: function() {
      var winner = Session.get('winner');
      return winner.userName + '(@' + winner.userScreenName + '): ' + winner.text;
    }
  });
  Template.body.events({
    "click #get-winner": function(e) {
      var winner;
      function getNewWinner(){
        var random = Math.floor(Math.random() * Tweets.find({}).count());
        var tweets = Tweets.find().fetch();
        winner = tweets[random];
        setWinner();
      }
      function setWinner() {
        if(winner.userScreenName !== 'btmarriage15') {
          Session.set("winner", winner);
        } else {
          getNewWinner();
        }
      }
      getNewWinner();
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // Collect all prior Instagrams
    var baseUrl = "https://api.instagram.com/v1/tags/btmc15/media/recent?access_token=";
    var instagramsUrl = baseUrl + Meteor.settings.instagram.accessToken;
    function retrieveInstagrams(url){
      HTTP.get(url, function(err, res) {
        var posts = res.data;
        posts.data.forEach(function(post){
          Tweets.insert({
            tweetId: post.id,
            tweetedAt: post.created_time,
            text: post.caption.text,
            userId: post.user.id,
            userName: post.user.full_name,
            userScreenName: post.user.username,
          });
        });
        if(posts.pagination.next_url) {
          retrieveInstagrams(posts.pagination.next_url);
        }
      });
    }
    retrieveInstagrams(instagramsUrl);
    
    // Endpoint to get Instagrams from Zapier
    Router.route('/api/instagram/posts', {where: 'server'})
      .post(function () {
        var post = this.request.body;
        console.log('new instagram: ' + post.tweetId);
        Tweets.insert({
          tweetId: post.tweetId,
          tweetedAt: post.tweetedAt,
          text: post.text,
          userId: post.userId,
          userName: post.userName,
          userScreenName: post.userScreenName
        });
        this.response.end('{"success" : "Updated Successfully", "status" : 200}');
      });
    
    // access twitter using the twit package
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
    var stream = T.stream('statuses/filter', { track: '#btmc15', language: 'en' });

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
