var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var Config = require('./config')

class Db {
  static getInstance() {
    if(!Db.instance) {
      Db.instance = new Db();
    }
    return Db.instance
  }
  constructor() {
    // 属性放db对象
    this.dbClient = ''
    this.connect()
  }
  // 连接数据库
  connect () {
    let that = this
    return new Promise((resolve, reject) => {
      //解决数据库多次链接
      if(!that.dbClient) {
        MongoClient.connect(Config.dbUrl, function(err, client) {
          if(err) {
            reject(err)
            return;
          }
          console.log('db connect successful!')
          var db = client.db(Config.dbName);
          that.dbClient = db
          resolve(that.dbClient)
        })
      } else {
        resolve(this.dbClient)
      }
    })
  }
  find (collectionName,json={}) {
    return new Promise((resolve, reject) => {
      this.connect().then((db) => {
        db.collection(collectionName).find(json).toArray(function(err, data) {
          if(err) {
            reject(err)
            return;
          }
          resolve(data)
        })
      })
    })
  }

  insert (collectionName, json={}) {
    return new Promise((resolve, reject) => {
      this.connect().then((db) => {
        db.collection(collectionName).insertOne(json, function(err, data) {
          if(err) {
            reject(err)
            return;
          }
          resolve(data)
        })
      })
    })
  }

  update (collectionName,json1,json2) {
    return new Promise((resolve, reject) => {
      this.connect().then(db => {
        db.collection(collectionName)
        .updateOne(json1, {$set:json2},function(err,data){
          if(err){
            reject(err)
            return;
          }
          resolve(data)
        })
      })
    })
  }

  remove (collectionName, json) {
    return new Promise((resolve, reject) => {
      this.connect().then((db) => {
        db.collection(collectionName)
        .deleteMany(json, function(err, data) {
          if(err) {
            reject(err)
            return;
          }
          resolve(data)
        })
      })
    })
  }

  //mongodb里面查询_id把字符串转换成对象
	getObjectId(id){
		return new ObjectId(id)
	}
}

module.exports = Db.getInstance()