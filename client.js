// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SlpFolderStream, SlpRealTime } = require("@vinceau/slp-realtime");

// TODO: Make sure you set this value!
const slpLiveFolderPath = "/Users/graham.preston/Slippi";
console.log(`Monitoring ${slpLiveFolderPath} for new SLP files`);

// Connect to the relay
const stream = new SlpFolderStream();

const formatPlayer = (player) => `${player.displayName} (${player.connectCode})`

const realtime = new SlpRealTime();
realtime.setStream(stream);

// Monitor for game start and end
realtime.game.start$.subscribe((payload) => {
  const players = payload.players;
  console.log(`Game started between ${formatPlayer(players[0])} and ${formatPlayer(players[1])}`);
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
