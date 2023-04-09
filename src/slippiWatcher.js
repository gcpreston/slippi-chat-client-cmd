const { Ports } = require('@slippi/slippi-js');
const { SlpLiveStream, SlpRealTime } = require("@vinceau/slp-realtime");

const ADDRESS = '127.0.0.1';
const PORT = Ports.DEFAULT;
const CONNECTION_TYPE = 'dolphin';

const formatPlayer = (player) => `${player.displayName} (${player.connectCode})`

function watchForGames(clientCode, channel) {
  // Connect to the relay
  const livestream = new SlpLiveStream(CONNECTION_TYPE);

  livestream.start(ADDRESS, PORT)
    .then(() => {
      console.log('Connected to Slipi.');
    })
    .catch(console.error);

  livestream.connection.on('statusChange', (status) => {
    console.log('Slippi connection status changed:', status);
  });

  const realtime = new SlpRealTime();
  realtime.setStream(livestream);

  // Monitor for game start and end
  realtime.game.start$.subscribe((payload) => {
    const players = payload.players;
    console.log(`Game started between ${formatPlayer(players[0])} and ${formatPlayer(players[1])}`);
    channel.push('game_started', { client: clientCode, players: players.map(p => p.connectCode) })
  });

  realtime.game.end$.subscribe((payload) => {
    console.log('Game ended', payload);
  });

  // Handle interrupt
  process.on("SIGINT", function() {
    console.log('Bye.');
    process.exit();
  });
}

exports.watchForGames = watchForGames;
