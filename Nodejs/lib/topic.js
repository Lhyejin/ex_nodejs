var db = require('./db');
var template = require('./template.js');
var url = require('url');
var qs = require('querystring');
var sanitizehtml = require('sanitize-html');
exports.home = function(request, response){
    db.query('SELECT * FROM topic', function(error, topics, fields){
        if (error){
            console.log(error);
        }
        var title = 'Welcome';
        var description = 'Hello, Node.js';
        var list = template.list(topics);
        var html = template.html(title,list,
            `<h2>${title}</h2>${description}`,
            `<a href="/create">create</a> `);
        response.writeHead(200);
        response.end(html);
    });
};

exports.page = function(request, response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    db.query('SELECT * FROM topic', function(error, topics){
        if (error){
            throw error;
        }
        //queryData.id값을 그대로 넘겨주면 id값이 database를 통해서 공격당할 수 있기 때문에 ?를 해주고 2번째 인자에 값을 넣어준다. ?는 공격적인 코드는 자동으로 막아준다.
        db.query(`SELECT * FROM topic LEFT JOIN author ON topic.author_id= author.id WHERE topic.id=?`,[queryData.id],
            function(error2, topic){
            if(error2){
                throw error2;
            }
            //topic의 값이 배열로 들어오기 때문에 topic[0]을 해야지 object가 된다.
            // console.log(topic);
            var title = topic[0].title;
            var description = topic[0].description;
            var list = template.list(topics);
            var html = template.html(title,list,
                `<h2>${sanitizehtml(title)}</h2>
                                ${sanitizehtml(description)}
                                <p>by ${topic[0].name}</p>`,
                `<a href="/create">create</a>
                                <a href="/update?id=${sanitizehtml(queryData.id)}">update</a>
                                <form action="delete_process" method="post">
                                <input type="hidden" name="id" value="${queryData.id}">
                                <input type="submit" value="delete">
</form>`);
            response.writeHead(200);
            response.end(html);
        });

    });
};
exports.create = function(request, response){
    db.query('SELECT * FROM topic', function(error, topics){
        if (error){
            console.log(error);
        }
        db.query('SELECT * FROM author', function(error2, authors){
            var title = 'Create';
            var list = template.list(topics);
            var html = template.html(title,list,
                `<form action="/create_process" method="post">
                <p><input type="text" name="title" placeholder="title"></p>
                <p>
                    <textarea name="description" placeholder="description"></textarea>
                </p>
                <p> 
                    ${template.authorSelect(authors)}
                <p>
                    <input type="submit">
                </p>
                </form>
            `, ``);
            response.writeHead(200);
            response.end(html);
        });
    });
};

exports.create_process = function(request, response){
    //create를 하고 출력을 했을때 html코드가 그대로 반영되기 때문에 보안이 위험해진다.
    var body = '';
    //data는 조각조각의 양들을 수신할 때마다 callback을 호출하도록 알려져있다.
    request.on('data', function(data){
        body = body + data;
        //만약 data가 너무 많으면 제한할 수도 있다.
    });
    //database에 글 저장하기.
    //end라는 수신호가 오면 callback을 실행한다.
    request.on('end', function() {
        //body에서 querystring을 읽어 객체화한다.
        var post = qs.parse(body);
        db.query(`INSERT INTO topic (title, description, created, author_id)
                        VALUES(?,?,NOW(),?)`,
            [post.title, post.description, post.author],
            function (error, result) {
                if (error) {
                    throw error;
                }
                response.writeHead(302, {Location: `/?id=${result.insertId}`});
                response.end();
            });
    });
};

exports.update = function(request, response) {
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    db.query('SELECT * FROM topic', function(error, topics){
        if (error){
            throw error;
        }
        db.query(`SELECT * FROM topic WHERE id=?`,[queryData.id],function(error2, topic){
            if(error2){
                throw error2;
            }
            db.query('SELECT * FROM author', function(error3, authors) {
                //topic의 값이 배열로 들어오기 때문에 topic[0]을 해야지 object가 된다.
                var list = template.list(topics);
                var html = template.html(topic[0].title, list,
                    `<form action="/update_process" method="post" >
                            <!--title의 값을 다시쓰면 파일을 찾지 못하기 때문에 id를 만들고 숨겨준다, title은 변경되지 않음.-->
                            <input type="hidden" name="id" value="${topic[0].id}">
                            <p><input type="text" name="title" placeholder="title" value="${topic[0].title}"></p>
                            <p>
                                <textarea name="description" placeholder="description">${topic[0].description}</textarea>
                            </p>
                            <p>
                                ${template.authorSelect(authors, topic[0].author_id)}
                            </p>
                            <p>
                                <input type="submit">
                            </p>
                            </form>`,
                    `<a href="/create">create</a> <a href="/update?id=${topic[0].id}">update</a>`);
                response.writeHead(200);
                response.end(html);
            });
        });
    });
};

exports.update_process = function(request, response){
    var body = '';
    //data는 조각조각의 양들을 수신할 때마다 callback을 호출하도록 알려져있다.
    request.on('data', function(data){
        body = body + data;
        //만약 data가 너무 많으면 제한할 수도 있다.
    });
    //end라는 수신호가 오면 callback을 실행한다.
    request.on('end', function(){
        //body에서 querystring을 읽어 객체화한다.
        var post = qs.parse(body);
        //SET 다음에 연결을 ,로 안시켜주면 연결이 되지않음
        db.query(`UPDATE topic SET title=?, description=?, author_id=? WHERE id =?`,
            [post.title, post.description, post.author ,post.id], function(error, result){
                response.writeHead(302, {Location: `/?id=${post.id}`});
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
        db.query(`DELETE FROM topic WHERE id= ?`, [post.id],function(error, result){
            if(error){
                throw error;
            }
            response.writeHead(302, {Location: `/`});
            response.end();
        });
    });
};
