var superagent = require('superagent');
var cheerio = require('cheerio');
var fs = require('fs');

var types = '青光眼|||白内障|||眼底病|||角膜|||小儿眼病|||眼外伤|||斜弱视|||近视远视|||眼肿瘤|||眼肌|||眼整形|||眼中医'.split('|||');

// debug
// types = [types[0]];

var len = types.length;

var doctors = [];

var count = [];

var typeindex = 1;


function spider(params) {

  console.log(params);

  params['area'] = '全部';
  params['doctor'] = '';

  if (typeindex > len -1) {
    return;
  }

  function callback(err, res){
      // 常规的错误处理
      if (err || !res.ok) {
        console.log(err);
      } else {
        // sres.text 里面存储着网页的 html 内容，将它传给 cheerio.load 之后
        // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
        // 剩下就都是 jquery 的内容了
        var $ = cheerio.load(res.text);

        var p = new RegExp('共([0-9]+)页').exec(res.text);
        var page = parseInt(p[1], 10);
        // page = 1;

        $('tr.list').each(function (idx, element) {
          var $element = $(element);
          var $td = $element.find('td');
          var face = $td.eq(0).find('img').attr('src');
          var name = $td.eq(0).find('.lefts p a').text();
          var title = $td.eq(0).find('.lefts p').eq(1).text();
          var yiyuan = $td.eq(1).find('b').eq(0).text();
          var keshi = $td.eq(1).find('b').eq(1).text();
          var shanchang = $td.eq(2).find('b').eq(0).text();

          var item = {
            face: 'http://www.yk2020.com/' + face,
            name: name,
            title: title,
            yiyuan: yiyuan,
            keshi: keshi,
            shanchang: shanchang
          };
          // console.log(item);
          doctors.push(item);
        });

        if (params.page - page < 0) {
          spider({type: params.type, page: params.page + 1});
        } else {

          fs.writeFile('doctors-'+ params.type +'.json', JSON.stringify(doctors), function(err){
            if (err) throw err;
            doctors = [];

            spider({type: types[typeindex++], page: 1});

            console.log('It\'s saved!');
          });

          console.log('done');
        }

      }

    }

  superagent
    .post('http://www.yk2020.com/plus/ListAccordingConOrderByJiBing.php')
    .set('User-Agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/50.0.2661.102 Chrome/50.0.2661.102 Safari/537.36')
    .set('X-Requested-With', 'XMLHttpRequest')
    .set('Referer', 'http://www.yk2020.com/yuyueguahao/anjibingyuyue/')
    .set('Cache-Control', 'no-cache')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .set('Cookie', 'PHPSESSID=vtimf6f1cf6l3ug8r2o6bqq4s2; CNZZDATA1253691553=1378041413-1465875510-http%253A%252F%252Fwww.yk2020.com%252F%7C1465875510; CNZZDATA1000462362=776072771-1465873977-null%7C1465897355')
    .send(params)
    .end(callback);
}


spider({type: types[len - 1], page: 1});
