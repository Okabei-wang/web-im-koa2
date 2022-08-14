#!/usr/bin/env node

/**
 * Module dependencies.
 */
 var app = require('../app');
 var debug = require('debug')('demo:server');
 var http = require('http');
 var Db = require('../async-db/db')
 
 /**
  * Get port from environment and store in Express.
  */
 
 var port = normalizePort(process.env.PORT || '3000');
 // app.set('port', port);
 
 /**
  * Create HTTP server.
  */
 
 var server = http.createServer(app.callback());
 
 /**
  * socket.io通信，transports这里需要加上websocket，否则会跨域
  */
 
 var io = require('socket.io')(server, { transports: ['websocket'] });
 
 /**
  * Listen on provided port, on all network interfaces.
  */
 
 server.listen(port);
 server.on('error', onError);
 server.on('listening', onListening);

 var heartList = {}
 
  // 客户端发起连接时触发
  io.on('connection', (socket) => {
    // console.log('a user connected', socket);
    socket.on('sendMsg', (data) => {
      setMessage(data)
      // heartList[`${data.userId}`].heartTime = 0
      // heartList[`${data.userId}`].heartTimer = null
    })
    socket.on('disconnect', () => {
      console.log('链接中断')
    })
    // socket.on('heartbeat', (data) => {
    //   initHeartIntervial(data)
    // })
  })

  // function initHeartIntervial(data) {
  //   // 初始化心跳检测
  //   clearInterval(heartList[`${data.userId}`].heartTimer)
  //   heartList[`${data.userId}`].heartTime = 0
  //   heartList[`${data.userId}`].heartTimer = setInterval(() => {
  //     heartList[`${data.userId}`].heartTime++
  //     if (heartList[`${data.userId}`].heartTime > 1800) {
  //       // 超过30分钟没有收到心跳，则断开连接
  //       console.log('heartbeat timeout')
  //       io.emit('connectionClose', {})
  //       setMessage({ type: 3, time: new Date(), message: `${data.username} 链接 websocket`, userId: data.userId })
  //       clearUserConnectInfo(data.userId)
  //     }
  //   }, 1000)
  // }

  async function clearUserConnectInfo(userId) {
    await Db.remove('user', { userId: userId, type: 0 })
    await Db.remove('user', { userId: userId, type: 3 })
  }
 
  async function setMessage(data) {
    switch (data.type) {
      case 0:
        // 开始链接ws
        await Db.insert('message', data)
        break;
      case 1:
        // 人对人私聊message
        await Db.insert('message', data)
        break;
      case 2:
        // 房间message
        await Db.insert('message', data)
        break;
      case 3:
        // ws断开
        await Db.insert('message', data)
        break;
    }
  }
 
 /**
  * Normalize a port into a number, string, or false.
  */
 
 function normalizePort(val) {
   var port = parseInt(val, 10);
 
   if (isNaN(port)) {
     // named pipe
     return val;
   }
 
   if (port >= 0) {
     // port number
     return port;
   }
 
   return false;
 }
 
 /**
  * Event listener for HTTP server "error" event.
  */
 
 function onError(error) {
   if (error.syscall !== 'listen') {
     throw error;
   }
 
   var bind = typeof port === 'string'
     ? 'Pipe ' + port
     : 'Port ' + port;
 
   // handle specific listen errors with friendly messages
   switch (error.code) {
     case 'EACCES':
       console.error(bind + ' requires elevated privileges');
       process.exit(1);
       break;
     case 'EADDRINUSE':
       console.error(bind + ' is already in use');
       process.exit(1);
       break;
     default:
       throw error;
   }
 }
 
 /**
  * Event listener for HTTP server "listening" event.
  */
 
 function onListening() {
   var addr = server.address();
   var bind = typeof addr === 'string'
     ? 'pipe ' + addr
     : 'port ' + addr.port;
   debug('Listening on ' + bind);
 }
 