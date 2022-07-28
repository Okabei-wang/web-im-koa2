const ws = require('ws');
const { StringDecoder } = require('string_decoder')


const wsClient = () => {
  const wss = new ws.WebSocketServer({ port: 8002 });
  const decoder = new StringDecoder('utf8')

  const wslist = []
  const historyMsgList = []
  wss.on('connection', function connection(ws) {
    wslist.push(ws)
    ws.send(JSON.stringify(historyMsgList))
    ws.on('message', (data) => {
      console.log('received: %s', data)
      const dataMsg = decoder.write(data)
      console.log(dataMsg)
      historyMsgList.push(dataMsg)
      for(let i in wslist) {
        wslist[i].send(dataMsg);
      }
    });
  });
}

module.exports = wsClient