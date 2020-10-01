var db = require('./db');
var template = require('./template.js');
var url = require('url');
var qs = require('querystring');
var sanitizeHtml = require(`sanitize-html`)

exports.home = function(requset, response){
    db.query(`SELECT * FROM topic`, function(error, topics){
        var title = 'Welcome';
        var description = 'Hello, Node.js';
        var list = template.list(topics);
        var html = template.HTML(title, list,
          `<h2>${title}</h2>${description}`,
          `<a href="/create">create</a>`
        );
        response.writeHead(200);
        response.end(html);
    });
}
exports.page = function(request, response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    db.query(`SELECT * FROM topic`, function(error, topics){
        if(error){
          throw error; // 다음 코드를 실행시키지 않고 에러를 콘솔에 표현하면서 즉시 애플리케이션 중지시킴
        }
        db.query(`SELECT * FROM topic LEFT JOIN author ON topic.author_id = author.id WHERE topic.id=?`,[queryData.id], function(error2, topic){
            //var sql = `SELECT * FROM topic LEFT JOIN author ON topic.author.id WHERE topic.id =${db.escape(queryData.id)}`;와 똑같다. 
          // sql ? 치환 [queryData.id], 공격 의도가 있는 코드의 가능성들을 세탁. 요렇게 치환해라
          if(error2){
            throw error2;
          }
          // console.log(topic[0].title);
          var title = topic[0].title;
          var description = topic[0].description;
          var list = template.list(topics);
          var html = template.HTML(title, list,
            `<h2>${sanitizeHtml(title)}</h2>${sanitizeHtml(description)}
            <p>by ${sanitizeHtml(topic[0].name)}</p>
            `,
            `<a href="/create">create</a>
            <a href="/update?id=${queryData.id}">update</a>
            <form action="delete_process" method="post">
              <input type="hidden" name="id" value="${queryData.id}">
              <input type="submit" value="delete">
            </form>`
          );
          response.writeHead(200);
          response.end(html);
        })
      });
}

exports.create = function (request, response){
    db.query(`SELECT * FROM topic`, function(error, topics){
        db.query(`SELECT * FROM author`, function(erro2, authors){
          var title = 'Create';
          var list = template.list(topics);     
          var html = template.HTML(sanitizeHtml(title), list,
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
          </form>`,
            `<a href="/create">create</a>`
          );
          response.writeHead(200);
          response.end(html);
        })
      });
}

exports.create_process = function(request, response){
    var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          db.query(`
          INSERT INTO topic (title, description, created, author_id)
           VALUES(?, ?, NOW(), ?)`,
           [post.title, post.description, post.author],
           function(error, result){
             if(error){
               throw error;
             }
             response.writeHead(302, {Location: `/?id=${result.insertId}`});
             response.end();
          })
      });
}

exports.update = function(request, response){
    db.query(`SELECT * FROM topic`, function (error,topics){
        if(error){
          throw error;
        }
        var _url = request.url;
        var queryData = url.parse(_url, true).query;
        db.query(`SELECT * FROM topic WHERE id=?`,[queryData.id], function(error2, topic){
          if(error2){
            throw error2;
          }
          db.query(`SELECT * FROM author`, function(error2, authors){
            var list = template.list(topics);
            var html = template.HTML(sanitizeHtml(topic[0].title), list,
              `
              <form action="/update_process" method="post">
                <input type="hidden" name="id" value="${topic[0].id}">
                <p><input type="text" name="title" placeholder="title" value="${sanitizeHtml(topic[0].title)}"></p>
                <p>
                  <textarea name="description" placeholder="description">${sanitizeHtml(topic[0].description)}</textarea>
                </p>
                <p>
                  ${template.authorSelect(authors, topic[0].author_id)}
                </p>
                <p>
                  <input type="submit">
                </p>
              </form>
              `,
              `<a href="/create">create</a> <a href="/update?id=${topic[0].id}">update</a>`
            );
            response.writeHead(200);
            response.end(html);
          })
        });
      })
}
exports.update_process =function (request, response){
    var body = '';
    request.on('data', function(data){
        body = body + data;
    });
    request.on('end', function(){
        var post = qs.parse(body);
        db.query(`UPDATE topic SET title=?, description=?, author_id=? WHERE id=?`, [post.title, post.description, post.author, post.id],function(error, result){
        response.writeHead(302, {Location: `/?id=${post.id}`});
        response.end();
        })
    });
}

exports.delete_process = function(request, response){
    var body = '';
    request.on('data', function(data){
        body = body + data;
    });
    request.on('end', function(){
        var post = qs.parse(body);
        var id = post.id;
        db.query(`DELETE FROM topic WHERE id = ?`, [post.id], function(error, result){
            if(error){
            throw error;
            }
            response.writeHead(302, {Location: `/`});
            response.end();
        })
    });
}