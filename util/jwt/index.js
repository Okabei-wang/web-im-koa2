const jwt = require('jsonwebtoken')

// token生成的密匙，根据自己需求定义
const jwtKey = 'Okabei'

// token生成函数(jwtSign)，有效时间为一天 
const jwtSign = (data) => { 
  const token = jwt.sign(data, jwtKey, {expiresIn: Math.floor(Date.now() / 1000) + (24 * 60 * 60)})
  return token
}

// token验证函数(jwtCheck)
const jwtCheck = (req, res, next) => { 
  //前端headers传来的token值:
  const token = req.headers.token
  jwt.verify(token, jwtKey, (err, data) => {
    if (err) {
      res.send({
        status: '401',
        msg: 'token无效'
      })
    } else {
      req.jwtInfo = data
      next()
    }
  })
}

module.exports = {
  jwtSign,
  jwtCheck
}