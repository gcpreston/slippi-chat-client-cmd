/* WANTS
 * - Slippi client disconnect => channel disconnect
 * - Channel disconnect -> channel reconnect without client change
 *   (right now, channel reconnect => client reconnect)
 */

const { Socket } = require('phoenix-channels');
const { Ports, ConnectionStatus, ConnectionEvent } = require('@slippi/slippi-js');
const { SlpLiveStream, SlpRealTime } = require("@vinceau/slp-realtime");

const SLIPPI_ADDRESS = '127.0.0.1';
const SLIPPI_PORT = Ports.DEFAULT;
const CONNECTION_TYPE = 'dolphin';

const SOCKET_URL = 'ws://192.168.0.38:4000/socket';
const CLIENT_CODE = 'WAFF#715';

const formatPlayer = (player) => `${player.displayName} (${player.connectCode})`

class Client {  
  constructor(socketUrl, clientCode) {
    this.topic = `players:${clientCode}`;
    this.socket = new Socket(socketUrl);
    this.initializeChannel();

    this.livestream = new SlpLiveStream(CONNECTION_TYPE);
    const realtime = new SlpRealTime();
    realtime.setStream(this.livestream);

    this.livestream.connection.on(ConnectionEvent.STATUS_CHANGE, (status) => {
      if (status === ConnectionStatus.DISCONNECTED) {
        this.channel.leave();
      }
    });

    realtime.game.start$.subscribe((payload) => {
      const players = payload.players;
      console.log(`Game started between ${formatPlayer(players[0])} and ${formatPlayer(players[1])}`);
      this.channel.isJoined() && this.channel.push('game_started', { client: clientCode, players: players.map(p => p.connectCode) })
    });

    realtime.game.end$.subscribe((payload) => {
      console.log('Game ended', payload);
      this.channel.isJoined() && this.channel.push('game_ended', { client: clientCode });
    });
  }

  connectToSlippi = () => {
    return this.livestream.start(SLIPPI_ADDRESS, SLIPPI_PORT)
      .then(() => {
        console.log('Connected to Slipi.');
      })
      .catch(console.error);
  }

  connectToPhoenix = () => {
    if (this.channel.isClosed()) {
      this.initializeChannel();
    }

    this.socket.connect();

    this.channel.join()
      .receive('ok', (resp) => {
        console.log('Joined successfully, reply:', resp);
      })
      .receive('error', (resp) => { 
        console.log('Unable to join:', resp) 
      });
  }

  initializeChannel = () => {
    this.channel = this.socket.channel(this.topic, {});
  }
}

const client = new Client(SOCKET_URL, CLIENT_CODE);
client.connectToSlippi();
client.connectToPhoenix();

process.on("SIGINT", function() {
  console.log('Bye.');
  process.exit();
});