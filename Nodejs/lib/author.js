var db = require('./db');
var template = require('./template.js');
var qs = require('querystring');
var url = require('url');
exports.home = function(requset, response){
    db.query('SELECT * FROM topic', function(error, topics, ){
        if (error){
            console.log(error);
        }
        db.query('SELECT * FROM author', function(error2, authors){
            if(error2){
                console.log(error2);
            }
            var title = 'author';
            var list = template.list(topics);
            var html = template.html(title,list,
                `
                    ${template.authorTable(authors)}
                    <style>
                    table{
                        border-collapse: collapse;
                    }
                     td{
                        border: 1px solid black;
                     }
                     </style>
                    <form action="/author/create_process" method="post">
                    <p><input type="text" name="name" placeholder="name"></p>
                    <p>
                        <textarea name="profile" placeholder="profile"></textarea>
                    </p>
                        <input type="submit">
                    </p>
                    </form>
                    `,
                ``);
            response.writeHead(200);
            response.end(html);
        });

    });
};

exports.create_process = function(request, response){
    var body = '';
    request.on('data', function(data){
        body = body + data;
    });
    request.on('end', function() {
        //body에서 querystring을 읽어 객체화한다.
        var post = qs.parse(body);
        db.query(`INSERT INTO author (name, profile)
                        VALUES(?,?)`,
            [post.name , post.profile ],
            function (error, result) {
                if (error) {
                    throw error;
                }
                response.writeHead(302, {Location: `/author`});
                response.end();
            });
    });
};
exports.update = function(request, response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    db.query('SELECT * FROM topic', function(error, topics){
        if (error){
            console.log(error);
        }
        db.query('SELECT * FROM author', function(error2, authors){
            if(error2){
                console.log(error2);
            }
            db.query('SELECT * FROM author WHERE id=?', [queryData.id], function(error3, author){
                var title = 'author';
                var list = template.list(topics);
                var html = template.html(title,list,
                    `
                    ${template.authorTable(authors)}
                    <style>
                    table{
                        border-collapse: collapse;
                    }
                     td{
                        border: 1px solid black;
                     }
                     </style>
                    <form action="/author/update_process" method="post">
                    <input type="hidden" name="id" value="${author[0].id}">
                    <p><input type="text" name="name" placeholder="name" value="${author[0].name}"></p>
                    <p>
                        <textarea name="profile" placeholder="profile">${author[0].profile}</textarea>
                    </p>
                        <input type="submit">
                    </p>
                    </form>
                    `,
                    ``);
                response.writeHead(200);
                response.end(html);
            });

        });

    });
};

exports.update_process = function(request, response){
    var body = '';
    request.on('data', function(data){
        body = body + data;
        //만약 data가 너무 많으면 제한할 수도 있다.
    });
    //end라는 수신호가 오면 callback을 실행한다.
    request.on('end', function(){
        //body에서 querystring을 읽어 객체화한다.
        var post = qs.parse(body);
        db.query(`UPDATE author SET name=?, profile=? WHERE id =?`,
            [post.name , post.profile ,post.id], function(error, result){
                response.writeHead(302, {Location: `/author`});
                response.end();
            });
    });
};

exports.delete_process = function(request, response){
    var body = '';
    request.on('data', function(data){
        body = body + data;
    });
    request.on('end', function(){
        var post = qs.parse(body);
        db.query(`DELETE FROM author WHERE id= ?`, [post.id],function(error, result){
            if(error){
                throw error;
            }
            response.writeHead(302, {Location: `/author`});
            response.end();
        });
    });
};