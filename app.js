// todo:
// * add check if artist name matches the response
//   (e.g. 'Whitney' results in 'Whitney Houston' instead of the actual band 'Whitney')

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var SpotifyWebApi = require('spotify-web-api-node');

var client_id = ''; // Your client id
var client_secret = ''; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

let playlistId = "";

// clears the playlist before we populate it
let clearPlaylist = true;

// number of songs we add to the playlist per artist
let numberOfSongs = 5;

// example arrays of artists
let hurricane2019Artists = [
  // friday
  "DIE TOTEN HOSEN", "TAME IMPALA", "PARKWAY DRIVE", "BILDERBUCH",
  "PAPA ROACH", "BOSSE", "ENTER SHIKARI", "TRETTMANN", "CIGARETTES AFTER SEX",
  "UFO361", "ALICE MERTON", "TEESY", "BETONTOD", "DIE HÖCHSTE EISENBAHN",
  "LEONIDEN", "SPECIAL GUEST", "POND", "FLUX PAVILION", "NEONSCHWARZ",
  "SAM FENDER", "GURR", "BLACK HONEY", "STEINER & MADLAINA",
  // saturday
  "MUMFORD & SONS", "MACKLEMORE",
  "STEVE AOKI", "ANNENMAYKANTEREIT", "BLOC PARTY",
  "FLOGGING MOLLY", "FRANK TURNER & THE SLEEPING SOULS",
  "THE WOMBATS", "257ERS", "DESCENDENTS", "DIE ORSONS",
  "MUFF POTTER", "FÜNF STERNE DELUXE", "LA DISPUTE",
  "ME FIRST AND THE GIMME GIMMES", "JOHNNY MARR",
  "ZEBRAHEAD", "SCHMUTZKI", "MONTREAL", "PASCOW", "IDLES",
  "ENNO BUNGER" , "SYML", "MOGUAI", "RAZZ", "ALEX MOFA GANG",
  "THE TOTEN CRACKHUREN IM KOFFERRAUM", "ROSBOROUGH",
  "THE DIRTY NIL", "ABRAMOWICZ", "ULF", "HIGHHEELSNEAKERS",
  // sunday
  "FOO FIGHTERS", "THE CURE",
  "INTERPOL", "WOLFMOTHER", "THE STREETS",
  "CHRISTINE AND THE QUEENS", "ROYAL REPUBLIC", "FABER",
  "BAUSA", "OK KID", "ELDERBROOK", "YUNG HURN", "YOU ME AT SIX",
  "BEAR'S DEN, GROSSSTADTGEFLÜSTER", "LAUV", "ALMA",
  "MAVI PHOENIX", "THE GARDENER & THE TREE",
  "SKINNY LISTER", "SWMRS", "DANGER DAN", "SOOKEE",
  "TEN TONNES", "THE SHERLOCKS", "LION", "SEA GIRLS",
  // warmup
  "QUERBEAT", "MONTREAL", "RADIO HAVANNA",
  "BEAUTY & THE BEATS", "D.KLANG",
  "OPENING MIT DEN HANSEMÄDCHEN"
];

let appleTreeGarden2019Artists = [
  "ALLI NEUMANN", "AMELI PAUL", "ANNA LEONE",
  "BALTHAZAR", "BARNS COURTNEY", "BLOND",
  "BONAPARTE", "CHILDREN", "FACES ON TV",
  "FIL BO RIVA", "GIANT ROOKS", "GOLDEN DAWN ARKESTRA",
  "IBEYI", "INTERNATIONAL MUSIC", "IORIE",
  "JAN OBERLÄNDER", "JOAN AS POLICE WOMAN", "JUNGSTÖTTER",
  "KÄPTN PENG", "KATE TEMPEST", "KERALA DUST", "KID SIMIUS",
  "KLAUS JOHANN GROBE", "LISA MORGENSTERN", 
  "MEUTE", "MY BABY", "NEUFUNDLAND", "O/Y",
  "PAUL BOKOWSKI", "PIP BLOM",
  "ROBERTO BIANCO & DIE ABBRUNZATI BOYS", "SAY YES DOG",
  "SHKOON", "STEFANIE SARGNAGEL", "TAMINO", 
  "TEMPESST", "TSHEGUE", "WHITNEY", "YIN YIN"
];

var stateKey = 'spotify_auth_state';
var app = express();

// credentials are optional
var spotifyApi = new SpotifyWebApi({
  clientId: client_id,
  clientSecret: client_secret,
  redirectUri: redirect_uri
});

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-modify-private playlist-modify-public';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

            spotifyApi.setAccessToken(access_token);

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        if(clearPlaylist === true)
          emptyPlaylist(walkArtists());

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

function emptyPlaylist(callback){
  spotifyApi.getPlaylist(playlistId)
  .then(function(data) {
    if(data.body.tracks.total > 0){
      // console.log(data.body);
      let trackIds = [];
      for (i = 0; i < data.body.tracks.total; i++) {
        trackIds.push(i);
      } 

      // Remove tracks from a playlist at a specific position
      spotifyApi.removeTracksFromPlaylistByPosition(playlistId, trackIds, data.body.snapshot_id)
      .then(function(data) {
        emptyPlaylist();
      }, function(err) {
        console.log('removeTracksFromPlaylistByPosition: Something went wrong!', err);
      });

    }
    else if(data.body.tracks.total === 0){
      if(callback)
        setTimeout(callback, 1000);
    }
  }, function(err) {
    console.log('getPlaylist: Something went wrong!', err);
  });
}

function addSongsOfArtist(artist) {
  spotifyApi.searchArtists(artist)
  .then(function(data) {
    if(data.body.artists.items.length > 0){
      spotifyApi.getArtistTopTracks(data.body.artists.items[0].id, 'DE')
      .then(function(data) {
        let tracks = [];
        for (let index = 0; index < numberOfSongs; index++) {
          if(index < data.body.tracks.length){
            tracks.push("spotify:track:" + data.body.tracks[index].id)
          }      
        }
        addTracksToPlaylist(tracks, artist);
        }, function(err) {
        console.log('getArtistTopTracks : Something went wrong!', err);
      });
    } else {
      walkArtists();
    }
  }, function(err) {
    console.error(err);
  });
}

function walkArtists() {
  if(appleTreeGarden2019Artists.length > 0){
    let artist = appleTreeGarden2019Artists.pop()
    addSongsOfArtist(artist);
  } else {
    console.log("Walked all artists.");
  }
}

function addTracksToPlaylist(tracks, artist){
  // Add tracks to a playlist
  spotifyApi.addTracksToPlaylist(playlistId, tracks)
  .then(function(data) {
    console.log('Added tracks for artist "' + artist + '" to playlist!');
    walkArtists();
  }, function(err) {
    console.log('addTrackToPlaylist: Something went wrong!', err);
  });
}

function addTrackToPlaylist(trackId, artist){
  // Add tracks to a playlist
  spotifyApi.addTracksToPlaylist(playlistId, ["spotify:track:" + trackId])
  .then(function(data) {
    if(artist)
      addSongsOfArtist(artist);
  }, function(err) {
    console.log('addTrackToPlaylist: Something went wrong!', err);
  });
}

app.get('/refresh_token', function(req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);