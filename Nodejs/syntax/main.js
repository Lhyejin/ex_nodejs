
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
var db = require('../lib/db');
var topic = require('../lib/topic');
var author = require('../lib/author');
//http의 모듈의 createServer는
// createServer 웹브라우저를 실행할 떄마다 서버를 실행시킴
// request 사용자가 요청한 정보 / response 사용자가 받을 정보
var app = http.createServer(function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;

    if(pathname === '/') {
        if(queryData.id === undefined){
            topic.home(request,response);
        } else { //id값이 있는 경우
            topic.page(request, response);
        }
    }else if(pathname === "/create"){
        topic.create(request, response);
    } else if(pathname === '/create_process'){
        topic.create_process(request, response);
    }else if(pathname === '/update') {
        topic.update(request, response);
    }else if(pathname === '/update_process'){
        topic.update_process(request, response);
    }else if(pathname === '/delete_process'){
        topic.delete_process(request, response);
    }else if(pathname === '/author'){
        author.home(request, response);
    }else if(pathname === '/author/create_process'){
        author.create_process(request, response);
    }else if(pathname === '/author/update'){
        author.update(request, response);
    }else if(pathname === '/author/update_process'){
        author.update_process(request, response);
    }else if(pathname === '/author/delete_process'){
        author.delete_process(request, response);
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