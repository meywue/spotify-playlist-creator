# spotify-playlist-creator
Populates a playlist with the most popular songs of given artists


## Installation

### Prerequisites

* [Node.js](http://www.nodejs.org/download/)

Once installed, clone the repository and install its dependencies running:

    $ npm install

### Using your own credentials
You will need to register your app and get your own credentials from the Spotify for Developers Dashboard.

To do so, go to [your Spotify for Developers Dashboard](https://beta.developer.spotify.com/dashboard) and create your application. For the examples, we registered these Redirect URIs:

* http://localhost:8888 (needed for the implicit grant flow)
* http://localhost:8888/callback

Once you have created your app, replace the `client_id` and `client_secret` in the app.js with the ones you get from My Applications.
Also replace the `playlistId`.

In order to run the node.js server do:

    $ node app.js

Then, open `http://localhost:8888` in a browser.