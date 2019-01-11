//mysql 모듈을 사용하겠다.
var mysql      = require('mysql');
//mysql createConnection 인자로 객체를 주고 host,
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '111111',
    database : 'opentutorials'
});

//접속하기
connection.connect();

//접속이 끝나면 query로 나오고 callback을 실행시킨다.
connection.query('SELECT * FROM topic', function (error, results, fields) {
    if (error){
      console.log(error);
    }
    console.log(results);
});
//실행을 끝내기
connection.end();