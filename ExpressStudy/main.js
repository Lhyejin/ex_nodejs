const express = require('express');
//express 인스턴스 생성
const app = express();

const fs = require('fs');
const bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');
app.use(helmet());

const topicRouter = require('./routes/topic');
const indexRouter = require('./routes/index');
//route routing : 사용자들이 여러가지 path를 통해 들어올때 path마다 get을 해줘서 페이지를 나타나게 한다.
//=>는 함수인데 (인자) => 표현식 의 형태를 가진다
//get을 함으로써 path경로를 통해 클라이언트에 요청을 보냄.
//app.get('/', (req, res) => res.send('hello world'));

/*form을 사용했을때 씀. post를 내부적으로 분석해서 callback함수를 호출하도록 약속되어있다.
request 즉 callback의 첫번째 인자에서 body라는 property를 만들어준다.
*/

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression()); // compression은 미들웨어가 리턴되고 use를 실행한다. body-parser 다음에 compression로 실행된다.
//미들웨어는 함수이다. filelist가 반복되기 때문에 미들웨어를 만들어줬다.
//하지만 쓰지 않을때도 list를 읽기 때문에 비효율적이다.
//그래서 get방식으로 가져와서 모든 get라우팅을 하는 path에서 실행시킨다.
//여기서 알수있는 것은 라우트가 실행될때 두번쨰 인자로 callback함수를 받는 것은 미들웨어란 것을 알 수 있다. 순서대로 미들웨어를 실행한다. 생각을 해보자.
app.get('*', function(request, response, next){
    fs.readdir('./data', function(error, filelist){
       request.list = filelist;
       next();
    });
});

app.use('/', indexRouter);
app.use('/topic', topicRouter);

//create에서 create_process를 post로 받는 방식이기 때문에 app.post를 쓴다.
//body-parser를 이용하여 더 쉽게 data가 들어오는 것을 처리할 수 있음.
//body는 웹브라우저에서 요청한 정보다. 본체인 데이터를 분석해서 필요한 형태로 바꿔주는 것을 body-parser라고 한다. 그 본체를 설명하는 것을 header라고 한다.
//


//404를 실행시키는 것은 맨 마지막에 넣어야한다. 미들웨어는 순서대로 실행되기 때문에 모든 경로도 못찾으면 마지막까지 오기때문에 마지막에 처리하기위해서 써준다.
app.use(function(req, res, next) {
    res.status(404).send('sorry cant find that!');
});

//에러처리 미들웨어는 인자가 4개이다. next(err)로 넘기면 이 미들웨어가 호출된다.
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(3000, () => console.log('Example app listening on port 3000'));



