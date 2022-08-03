// 验证码模块
var svgCaptcha = require('svg-captcha');

class Captcha{
  getCode() {
    var captcha = svgCaptcha.create({
      inverse: false, // 翻转颜色
      fontSize: 42, // 字体大小
      noise: 2, // 噪声线条数 
      width: 100, // 宽度 
      height: 40, // 高度 
      color: true, //
      size: 4,// 验证码长度
      ignoreChars: '0o1i', // 验证码字符中排除 0o1i
      background: '#ffffff' // 验证码图片背景颜色
    })
    return captcha;
  }
}

module.exports = Captcha