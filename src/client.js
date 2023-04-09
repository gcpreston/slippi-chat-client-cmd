const { Socket } = require('phoenix-channels');
const prompt = require('prompt-sync')();
const { watchForGames } = require('./slippiWatcher');

const code = prompt('What is your connect code? ');

const socket = new Socket('ws://localhost:4000/socket');
socket.connect();

const topic = `players:${code}`;
const channel = socket.channel(topic, {});

console.log(`Joining topic ${topic}...`);
channel.join()
  .receive('ok', resp => {
    console.log('Joined successfully, reply:', resp);
    watchForGames(code, channel);
  })
  .receive('error', resp => { console.log('Unable to join:', resp) });
