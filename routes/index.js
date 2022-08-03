const router = require('koa-router')()
const Captcha = require('../util/captcha')
const Db = require('../async-db/db')
const crypto = require("crypto");
const json = require('koa-json')
const { jwtSign, jwtCheck } = require('../util/jwt')

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
  ctx.set('Content-Type', 'application/json');
  const image_code = new Captcha().getCode();
  ctx.body = {
    code: 0,
    message: 'ok',
    data: image_code
  }
})

router.post('/user/login', async (ctx, next) => {
  const data = ctx.request.body
  const dbres = await Db.find('user', { username: data.username })
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
      role: 'user'
    }
    const res = await Db.insert('user', data)
    console.log('dbres', res)
    ctx.body = {
      code: 0,
      message: 'ok',
      data: null
    }
  }
})

module.exports = router
