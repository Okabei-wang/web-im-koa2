const router = require('koa-router')()
const Captcha = require('../util/captcha')
const Db = require('../async-db/db')
const crypto = require("crypto");
const json = require('koa-json')
const { jwtSign, jwtGetInfo, getObjectId } = require('../util/jwt')
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

router.post('/room/history', async (ctx, next) => {
  // 获取房间历史
  const data = ctx.request.body
  const dbres = await Db.find('message', { roomId: data.roomId })
  ctx.body = {
    code: 0,
    message: 'ok',
    data: dbres
  }
})

module.exports = router
