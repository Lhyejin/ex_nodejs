
var http = require('http');
var fs = require('fs');
var url = require('url'); //nodejs의 url의 모듈을 사용할 것이다. url이라고 하는 모듈은 url변수로 쓸것이다.
var qs = require('querystring');
var template = require('../lib/template.js');
//정보를 보려고 하는것을 차단시키기 위해서 한단계를 거쳐 중요한 정보를 걸러준다.
var path = require('path');
//출력에 대한 정보를 보안하기 위해
//data에 스크립트 태그나 예민한 코드가 있으면 살균해버림. 값은 있지만 나오지 않음.
//제목태그를 하면 태그를 적용하지는 않지만 태그는 쳐버리지만 내용은 살려줌.
var sanitizeHtml = require('sanitize-html');
//mysql 모듈 사용하기
var mysql = require('mysql');
var db = mysql.createConnection( {
    host: 'localhost',
    user: 'root',
    password: '111111',
    database: 'opentutorials'
});
db.connect();
//refactorying 코드를 더 효율적으로 바꾸는 방법
//template object ==> module화
//입력정보에 대한 보안.
//html코드를 return 해줌

//http의 모듈의 createServer는
// createServer 웹브라우저를 실행할 떄마다 서버를 실행시킴
// request 사용자가 요청한 정보 / response 사용자가 받을 정보
var app = http.createServer(function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    // pathname은 query string을 제외한 pathname만을 보여준다.
    //루트를 알아서 정상적인 접근을 했는가를 알아야한다.
    //경로가 syntax안에 있어야 가능했다
    if(pathname === '/') {
        //home
        if(queryData.id === undefined){
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

        } else { //id값이 있는 경우
            db.query('SELECT * FROM topic', function(error, topics){
                if (error){
                    throw error;
                }
                //queryData.id값을 그대로 넘겨주면 id값이 database를 통해서 공격당할 수 있기 때문에 ?를 해주고 2번째 인자에 값을 넣어준다. ?는 공격적인 코드는 자동으로 막아준다.
                db.query(`SELECT * FROM topic WHERE id=?`,[queryData.id], function(error2, topic){
                   if(error2){
                       throw error2;
                   }
                   //topic의 값이 배열로 들어오기 때문에 topic[0]을 해야지 object가 된다.
                   // console.log(topic[0].title);
                    var title = topic[0].title;
                    var description = topic[0].description;
                    var list = template.list(topics);
                    var html = template.html(title,list,
                        `<h2>${title}</h2>${description}`,
                        `<a href="/create">create</a>
                                <a href="/update?id=${queryData.id}">update</a>
                                <form action="delete_process" method="post">
                                <input type="hidden" name="id" value="${queryData.id}">
                                <input type="submit" value="delete">
</form>`);
                    response.writeHead(200);
                    response.end(html);
                });

            });
            /*fs.readdir('./data',function(error, filelist){
                //path.parse는 경로를 객체화 시켜서 보여주는데 base는 자기자신의 값만 보여줌.
                var filteredId = path.parse(queryData.id).base;
                fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
                    var title = queryData.id;
                    //자신이 사용하는 변수가 살균 소독이 되었는지 알수있다.

                    var sanitizedTitle = sanitizeHtml(title);
                    //allowedTags는 특정한 태그를 허용하겠다라는 옵션을 주는 것.
                    var sanitizedDescription = sanitizeHtml(description, {allowedTags: ['h1']});
                    var list = template.list(filelist);
                    var html = template.html(sanitizedTitle,list,
                        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
                        `<a href="/create">create</a>
                                <a href="/update?id=${sanitizedTitle}">update</a>
                                <form action="delete_process" method="post">
                                <input type="hidden" name="id" value="${sanitizedTitle}">
                                <input type="submit" value="delete">
</form>`); //update를 눌렀을 때 누른 글이 뭔지 알아야함
                    response.writeHead(200);
                    response.end(html);
                });
            });
            */
        }

    }else if(pathname === "/create"){
        fs.readdir('./data',function(error, filelist){
            var title = 'WEB - create';
            var list = template.list(filelist);
            var html = template.html(title,list, `
              <form action="/create_process" method="post" >
                <p><input type="text" name="title" placeholder="title"></p>
                <p>
                    <textarea name="description" placeholder="description"></textarea>
                </p>
                <p>
                    <input type="submit">
                </p>
                </form>
            `, '');
            response.writeHead(200);
            response.end(html);
        });
    } else if(pathname === '/create_process'){
        //create를 하고 출력을 했을때 html코드가 그대로 반영되기 때문에 보안이 위험해진다.
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
            var title = post.title;
            var description = post.description;
            fs.writeFile(`data/${title}`, description, 'utf8', function(err){
                //302번은 Location의 주소로 redirect시켜주는 번호이다.
                response.writeHead(302, {Location: `/?id=${title}`});
                response.end();
                //redirection 사용자를 다른 페이지로 튕겨버리기
            });
        });

    }else if(pathname === '/update')
    {
        fs.readdir('./data',function(error, filelist){
            //..의 정보를 차단시키기 위해 입력정보에 접근할수없게 하기 위해 filter를 씌워줌.
            var filteredId = path.parse(queryData.id).base;
            fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
                var title = queryData.id;
                var list = template.list(filelist);
                var html = template.html(title,list, `
              <form action="/update_process" method="post" >
                <!--title의 값을 다시쓰면 파일을 찾지 못하기 때문에 id를 만들고 숨겨준다, title은 변경되지 않음.-->
                <input type="hidden" name="id" value="${title}">
                <p><input type="text" name="title" placeholder="title" value="${title}"></p>
                <p>
                    <textarea name="description" placeholder="description">${description}</textarea>
                </p>
                <p>
                    <input type="submit">
                </p>
                </form>
            `, `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`); //update를 눌렀을 때 누른 글이 뭔지 알아야함
                response.writeHead(200);
                response.end(html);
            });
        });
    }else if(pathname === '/update_process'){
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
            var id = post.id;
            var title = post.title;
            var description = post.description;
            //파일이름을 첫번째인자에서 두번째 인자로 바꾼다.
            fs.rename(`data/${id}`, `data/${title}`, function(error){
                fs.writeFile(`data/${title}`, description, 'utf8', function(err){
                    //302번은 Location의 주소로 redirect시켜주는 번호이다.
                    response.writeHead(302, {Location: `/?id=${title}`});
                    response.end();
                    //redirection 사용자를 다른 페이지로 튕겨버리기
                });
            });
            // console.log(post);

        });

    }else if(pathname === '/delete_process'){
        var body = '';
        request.on('data', function(data){
            body = body + data;
        });
        request.on('end', function(){
            var post = qs.parse(body);
            var id = post.id;
            var filteredId = path.parse(id).base;
            fs.unlink(`data/${filteredId}`, function(error){
                response.writeHead(302, {Location: `/`});
                response.end();
            })
        });
    }
    else {
        response.writeHead(404);
        response.end('Not found');
    }
    //nodejs가 경로에 해당되는 파일을 읽어서 respondse.end에 위치 시키라는거다.

    // console.log(__dirname + url);
    // response.end('egoing : '+url);


});
app.listen(3000);