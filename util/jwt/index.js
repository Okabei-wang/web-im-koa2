const jwt = require('jsonwebtoken')

// token生成的密匙，根据自己需求定义
const jwtKey = 'Okabei'

// token生成函数(jwtSign)，有效时间为一天 
const jwtSign = (data) => { 
  const token = jwt.sign(data, jwtKey, {expiresIn: Math.floor(Date.now() / 1000) + (24 * 60 * 60)})
  return token
}

const  avoidVerifyUrl = ['/user/login', '/login/register', '/login/image_code']

// token验证函数(jwtCheck)
const jwtGetInfo = (token) => {
  try{
    return jwt.verify(token, jwtKey)
  } catch(e) {
    console.log(e)
    return false
  }
}

const jwtCheck = async (ctx, next) => {
  let url =ctx.request.url;
  if(avoidVerifyUrl.includes(url)) {
    await next()
  } else {
    //拿到token
    const authorization = ctx.get('Authorization').split(' ')[1];
    if (authorization === '') {
      ctx.throw(401, 'no token detected in http headerAuthorization');
    }
    let tokenContent;
    try {
      tokenContent = await jwt.verify(authorization, 'Okabei');//如果token过期或验证失败，将抛出错误
    } catch (err) {
      ctx.throw(401, 'invalid token');
    }
    await next();
  }
}

module.exports = {
  jwtSign,
  jwtCheck,
  jwtGetInfo
}