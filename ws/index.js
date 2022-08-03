const ws = require('ws');
const { StringDecoder } = require('string_decoder')
const Db = require('../async-db/db')

const wsClient = () => {
  const wss = new ws.WebSocketServer({ port: 8002 });
  const decoder = new StringDecoder('utf8')

  const wslist = []
  // const historyMsgList = []
  wss.on('connection', async function connection(ws) {
    wslist.push(ws)
    const data = await findMsgHistory()
    ws.send(JSON.stringify(data))
    // ws.send(JSON.stringify(historyMsgList))
    ws.on('message', (data) => {
      console.log('received: %s', data)
      const dataMsg = decoder.write(data)
      insertMsgToRoom(JSON.parse(dataMsg))
      console.log(dataMsg)
      // historyMsgList.push(dataMsg)
      for(let i in wslist) {
        wslist[i].send(dataMsg);
      }
    });
  });
}

const insertMsgToRoom = (MsgJson) => {
  Db.insert('room', MsgJson)
}

const findMsgHistory = async () => {
  const data = await Db.find('room')
  console.log('findHistory', data)
  return data
}

module.exports = wsClient