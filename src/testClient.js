const prompt = require('prompt-sync')();
const { Socket } = require('phoenix-channels');

const SOCKET_URL = 'ws://127.0.0.1:4000/socket';

function exit() {
  console.log('Bye.');
  process.exit();
}

class TestClient {
  opponentCode = null;

  constructor(playerCode) {
    this.playerCode = playerCode;
    this.socket = new Socket(SOCKET_URL);
    this.initializeChannel();
  }

  topic = () => `players:${this.playerCode}`;

  setPlayerCode = (code) => {
    this.playerCode = code;
  }

  whoami = () => {
    console.log(this.playerCode);
  }

  setOpponent = (code) => {
    this.opponentCode = code;
  }

  gameStart = () => {
    const players = [this.playerCode, this.opponentCode].sort();
    console.log(`Game started between ${players[0]} and ${players[1]}`);
    this.channel.isJoined() && this.channel.push('game_started', { client: this.playerCode, players })
  }

  gameStop = () => {
    console.log('Game ended.');
    this.channel.isJoined() && this.channel.push('game_ended', { client: this.playerCode });
  }

  execute = (command, args) => {
    switch (command) {
      case 'q':
        return exit();
      case 'set':
        return this.setPlayerCode(args[0]);
      case 'whoami':
        return this.whoami();
      case 'foe':
        return this.setOpponent(args[0]);
      case 'start':
        return this.gameStart();
      case 'stop':
        return this.gameStop();
    }
  }

  run = async () => {
    await this.connectToPhoenix();

    while (true) {
      const input = prompt('> ');

      if (input) {
        const parsed = input.trim().replace(/\s+/g, ' ').split(' ');

        if (parsed.length > 0) {
          const command = parsed[0];
          const args = parsed.slice(1);

          this.execute(command, args);
        }
      }
    }
  }

  connectToPhoenix = async () => {
    console.log('connecting');
    if (this.channel.isClosed()) {
      this.initializeChannel();
    }

    this.socket.connect();

    console.log('joining channel');
    return new Promise((resolve, reject) => {
      this.channel.join()
        .receive('ok', (resp) => {
          console.log('Joined successfully, reply:', resp);
          resolve();
        })
        .receive('error', (resp) => {
          console.log('Unable to join:', resp);
          reject();
        });
    });
  }

  initializeChannel = () => {
    this.channel = this.socket.channel(this.topic(), {});
  }
}

process.on('SIGINT', () => {
  exit()
});

const playerCode = process.argv.length > 2 ? process.argv[2] : null;
const client = new TestClient(playerCode);
client.run();
