const router = require('koa-router')()
const Captcha = require('../util/captcha')
const Db = require('../async-db/db')
const crypto = require("crypto");
const json = require('koa-json')
const { jwtSign, jwtGetInfo } = require('../util/jwt')
const ObjectId = require('mongodb').ObjectId

router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Hello Koa 2!'
  })
})

router.get('/string', async (ctx, next) => {
  ctx.body = 'koa2 string'
})

router.get('/login/image_code', async (ctx, next) => {
  ctx.response.status = 200;
  // ctx.set('Content-Type', 'application/json');
  const image_code = new Captcha().getCode();
  ctx.body = {
    code: 0,
    message: 'ok',
    data: image_code
  }
})

router.get('/user/info', async (ctx, next) => {
  try{
    ctx.response.status = 200;
    ctx.set('Content-Type', 'application/json');
    const token = ctx.request.header.authorization.split(' ')[1]
    const info = jwtGetInfo(token)
    const userId = info.id
    const dbres = await Db.find('user', { _id: ObjectId(userId) })
    ctx.body = {
      code: 0,
      message: 'ok',
      data: dbres[0]
    }
  } catch(e) {
    tx.body = {
      code: 999,
      message: 'ok',
      data: JSON.stringify(e)
    }
  }
})

router.get('/user/message/list', async (ctx, next) => {
  try{
    ctx.response.status = 200;
    ctx.set('Content-Type', 'application/json');
    const token = ctx.request.header.authorization.split(' ')[1]
    const info = jwtGetInfo(token)
    const userId = info.id
    const dbres = await Db.find('user', { _id: ObjectId(userId) })
    ctx.body = {
      code: 0,
      message: 'ok',
      data: dbres[0]
    }
  } catch(e) {
    tx.body = {
      code: 999,
      message: 'ok',
      data: JSON.stringify(e)
    }
  }
})

router.post('/friend/list', async (ctx, next) => {
  const data = ctx.request.body
  const dataList = []
  for(let i in data) {
    const friendId = data[i]
    console.log(friendId)
    const dbres = await Db.find('user', { _id: ObjectId(friendId) })
    if(dbres.length) {
      dataList.push(dbres[0])
    }
  }
  ctx.body = {
    code: 0,
    message: 'ok',
    data: dataList
  }
})

router.post('/user/login', async (ctx, next) => {
  const data = ctx.request.body
  const dbres = await Db.find('user', { loginname: data.username })
  if(dbres.length) {
    // 找到此用户
    const dbuser = dbres[0]
    const md5 = crypto.createHash("md5");
    const newPas = md5.update(data.password).digest("hex");
    if(newPas === dbuser.password) {
      // 密码一致 登录成功
      ctx.body = {
        code: 0,
        message: 'ok',
        data: jwtSign({ username: dbuser.username, id: dbuser._id, role: dbuser.role })
      }
    } else {
      // 密码不一致
      ctx.body = {
        code: 2,
        message: '密码错误',
        data: null
      }
    }
  } else {
    ctx.body = {
      code: 1,
      message: '用户不存在',
      data: null
    }
  }
})

router.post('/login/register', async (ctx, next) => {
  const dbres = await Db.find('user', { username: ctx.request.body.username })
  if(dbres.length) {
    // 已有此用户
    ctx.body = {
      code: 1,
      message: '已有此用户，请填写新的用户名',
      data: null
    }
  } else {
    const md5 = crypto.createHash("md5");
    const newPwd = md5.update(ctx.request.body.password).digest("hex");
    const data = {
      username: ctx.request.body.username,
      loginname: ctx.request.body.username,
      password: newPwd,
      role: 'user',
      avatar: '',
      friends: [],
      roomlist: []
    }
    const res = await Db.insert('user', data)
    ctx.body = {
      code: 0,
      message: 'ok',
      data: null
    }
  }
})

router.post('/room/create', async (ctx, next) => {
  const data = ctx.request.body
  const insertJson = {
    roomname: data.roomname,
    admin: data.admin,
    memberlist: [data.admin],
    roomId: new Date().getTime().toString()
  }
  try {
    const dbres = await Db.insert('room', insertJson)
    const userRes = await Db.find('user', { _id: ObjectId(data.admin) })
    const user = userRes[0]
    user.roomlist.push(dbres.insertedId.toString())
    await Db.update('user', { _id: ObjectId(data.admin) }, { roomlist: user.roomlist })
    if(dbres.acknowledged) {
      // 成功
      ctx.body = {
        code: 0,
        message: 'ok',
        data: dbres.insertedId
      }
    } else {
      // 失败
      ctx.body = {
        code: 999,
        message: 'error',
        data: null
      }
    }
  } catch(e) {
    console.log(e)
    ctx.body = {
      code: 999,
      message: '创建失败，请联系管理员',
      data: JSON.stringify(e)
    }
  }
})

router.post('/room/info', async (ctx, next) => {
  // 获取room详情
  const data = ctx.request.body
  const dbres = await Db.find('room', { _id: ObjectId(data.roomId) })
  if(dbres.length) {
    // 成功
    if(dbres[0].memberlist.length) {
      const memberlist = []
      for(let i in dbres[0].memberlist) {
        const userRes = await Db.find('user', { _id: ObjectId(dbres[0].memberlist[i]) })
        if(userRes.length) {
          memberlist.push(userRes[0])
        }
      }
      dbres[0].memberlist = memberlist
    }
    ctx.body = {
      code: 0,
      message: 'ok',
      data: dbres[0]
    }
  } else {
    ctx.body = {
      code: 1,
      message: '房间不存在',
      data: null
    }
  }
})

router.post('/friend/info', async (ctx, next) => {
  // 获取好友详情
  const data = ctx.request.body
  const dbres = await Db.find('user', { _id: ObjectId(data.friendId) })
  if(dbres.length) {
    // 成功
    ctx.body = {
      code: 0,
      message: 'ok',
      data: dbres[0]
    }
  } else {
    ctx.body = {
      code: 1,
      message: '房间不存在',
      data: null
    }
  }
})

router.post('/room/list', async (ctx, next) => {
  // 获取room详情
  const data = ctx.request.body
  const roomIdList = data.roomIdList
  let resData = []
  try {
    for(const i in roomIdList) {
      const dbres = await Db.find('room', { _id: ObjectId(roomIdList[i]) })
      if(dbres.length) {
        // 成功
        resData.push(dbres[0])
      } else {
        throw new Error('房间不存在')
      }
    }
    ctx.body = {
      code: 0,
      message: 'ok',
      data: resData
    }
  } catch(e) {
    ctx.body = {
      code: 1,
      message: e,
      data: null
    }
  }
})

// router.post('/friend/history', async (ctx, next) => {
//   // 获取私聊历史
//   const data = ctx.request.body
//   const dbres = await Db.find('message', { roomId: data.friendId })
//   let resData = []
//   if(dbres.length) {
//     for(const i in dbres) {
//       const user_dbres = await Db.find('user', { _id: ObjectId(dbres[i].sendUserId) })
//       if(!user_dbres) {
//         throw new Error('用户不存在')
//       }
//       dbres[i].userInfo = user_dbres[0]
//     }
//   }
//   resData = dbres
//   ctx.body = {
//     code: 0,
//     message: 'ok',
//     data: resData
//   }
// })

router.post('/room/history', async (ctx, next) => {
  // 获取房间历史
  const data = ctx.request.body
  const dbres = await Db.find('message', { receiveId: data.roomId })
  let resData = []
  if(dbres.length) {
    for(const i in dbres) {
      const user_dbres = await Db.find('user', { _id: ObjectId(dbres[i].sendUserId) })
      if(!user_dbres) {
        throw new Error('用户不存在')
      }
      dbres[i].userInfo = user_dbres[0]
    }
  }
  resData = dbres
  ctx.body = {
    code: 0,
    message: 'ok',
    data: resData
  }
})

router.post('/friend/history', async (ctx, next) => {
  // 获取好友私聊历史
  const data = ctx.request.body
  const dbres = await Db.find('message', { sendUserId: { $in: [data.friendId, data.userId] }, type: 1 })
  let resData = []
  if(dbres.length) {
    for(const i in dbres) {
      const user_dbres = await Db.find('user', { _id: ObjectId(dbres[i].sendUserId) })
      if(!user_dbres) {
        throw new Error('用户不存在')
      }
      dbres[i].userInfo = user_dbres[0]
    }
  }
  resData = dbres
  ctx.body = {
    code: 0,
    message: 'ok',
    data: resData
  }
})

router.post('/entry/room', async (ctx, next) => {
  // 进入房间
  const data = ctx.request.body
  try {
    const dbres = await Db.find('room', { roomId: data.roomId })
    const token = ctx.request.header.authorization.split(' ')[1]
    const info = jwtGetInfo(token)
    const userId = info.id
    const dbres_user = await Db.find('user', { _id: ObjectId(userId) })
    if (dbres[0].memberlist.indexOf(userId) < 0) {
      // 如果该房间成员列表没有此用户，则添加此用户到房间成员列表
      dbres[0].memberlist.push(userId)
      await Db.update('room', { roomId: data.roomId }, { memberlist: dbres[0].memberlist })
    }
    console.log(dbres[0]._id, dbres_user[0].roomlist)
    if (dbres_user[0].roomlist.indexOf(dbres[0]._id) < 0) {
      // 如果该用户的房间列表没有该房间，则给该用户身上添加该房间，以便下次进入
      dbres_user[0].roomlist.push(dbres[0]._id)
      console.log(dbres_user[0].roomlist)
      await Db.update('user', { _id: ObjectId(userId) }, { roomlist: dbres_user[0].roomlist })
    }
    ctx.body = {
      code: 0,
      message: 'ok',
      data: dbres[0]._id
    }
  } catch(e) {
    ctx.body = {
      code: 1,
      message: '未找到，请确认是否存在该房间',
      data: null
    }
  }
})

router.post('/update/avatar', async (ctx, next) => {
  // 更新用户头像
  const data = ctx.request.body
  const token = ctx.request.header.authorization.split(' ')[1]
  const info = jwtGetInfo(token)
  const userId = info.id
  try {
    const user_dbres = await Db.update('user', { _id: ObjectId(userId) }, { avatar : data.avatar })
    ctx.body = {
      code: 0,
      message: 'ok',
      data: null
    }
  } catch (e) {
    console.log(e)
    ctx.body = {
      code: 1,
      message: '出现错误，请联系管理员',
      data: null
    }
  }
})

router.post('/find/user', async (ctx, next) => {
  // 搜索用户
  const data = ctx.request.body
  const reg = new RegExp(`^.*${data.nickName}.*$`)
  const dbres = await Db.find('user', { username: { $regex: reg, $options: 'i' } })
  ctx.body = {
    code: 0,
    message: 'ok',
    data: dbres
  }
})

router.post('/friend/agree', async (ctx, next) => {
  // 好友申请--同意
  const data = ctx.request.body
  try {
    // 接收人push一个好友id
    const dbres_receive = await Db.find('user', { _id: ObjectId(data.receiveId) })
    const receivedUserFriends = dbres_receive[0].friends
    receivedUserFriends.push(data.sendUserId)
    console.log(receivedUserFriends)
    await Db.update('user', { _id: ObjectId(data.receiveId) }, { friends: receivedUserFriends })
    // 发起人push一个好友id
    const dbres_send = await Db.find('user', { _id: ObjectId(data.sendUserId) })
    const sendUserFriends = dbres_send[0].friends
    sendUserFriends.push(data.receiveId)
    console.log(sendUserFriends)
    await Db.update('user', { _id: ObjectId(data.sendUserId) }, { friends: sendUserFriends })
    await Db.remove('message', { _id: ObjectId(data._id) })
    ctx.body = {
      code: 0,
      message: 'ok',
      data: null
    }
  } catch (e) {
    console.log(e)
    ctx.body = {
      code: 1,
      message: '出现错误，请联系管理员',
      data: null
    }
  }
})

module.exports = router
