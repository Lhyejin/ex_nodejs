//mysql 모듈 사용하기
var mysql = require('mysql');
var db = mysql.createConnection( {
    host: '',
    user: '',
    password: '',
    database: ''
});
db.connect();
module.exports = db;

//여러개를 exports하려면 exports만 해주면된다.