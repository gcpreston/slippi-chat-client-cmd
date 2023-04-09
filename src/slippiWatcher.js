const formatPlayer = (player) => `${player.displayName} (${player.connectCode})`

function watchForGames(clientCode, channel) {
  console.log('new watching for games');
  const { SlpParser, SlpStream, SlpStreamEvent } = require('@slippi/slippi-js');

  const parser = new SlpParser();
  const slpStream = new SlpStream();

  slpStream.on(SlpStreamEvent.COMMAND, (event) => {
		console.log("Commmand parsed by SlpStream: " + event.command + event.payload)
		parser.handleCommand(event.command, event.payload);
		if (event.command == 54) {
			console.log('Game started:', parser.getSettings());
		}
	});
}

function watchForGamesOld(clientCode, channel) {
  const { SlpFolderStream, SlpRealTime } = require("@vinceau/slp-realtime");

  const slpLiveFolderPath = "/Users/graham.preston/Slippi";
  console.log(`Monitoring ${slpLiveFolderPath} for new SLP files`);

  // Connect to the relay
  const stream = new SlpFolderStream();

  const realtime = new SlpRealTime();
  realtime.setStream(stream);

  // Monitor for game start and end
  realtime.game.start$.subscribe((payload) => {
    const players = payload.players;
    console.log(`Game started between ${formatPlayer(players[0])} and ${formatPlayer(players[1])}`);
    channel.push('game_started', { client: clientCode, players: players.map(p => p.connectCode) })
  });

  realtime.game.end$.subscribe(() => {
    console.log('Game ended');
  });

  // Handle interrupt
  process.on("SIGINT", function() {
    console.log('Bye.');
    stream.stop();
    process.exit();
  });

  // Start monitoring the folder for changes
  stream.start(slpLiveFolderPath);
}

exports.watchForGames = watchForGames;
