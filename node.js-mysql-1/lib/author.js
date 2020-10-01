var db = require('./db');
var template = require('./template.js');
var url = require('url');
var qs = require('querystring');
var sanitizeHtml = require('sanitize-html');

exports.index = function (request, response){
    db.query(`SELECT * FROM topic`, function(error, topics){
        db.query(`SELECT * FROM author`, function(error2, authors){
            var title = 'author';
            var list = template.list(topics);
            var html = template.HTML(title, list,
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
                </form>`,
                ``    
            );
            response.writeHead(200);
            response.end(html);
        });
    });
}
exports.create_process = function (request, response){
    var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          db.query(`
          INSERT INTO author (name, profile)
           VALUES(?, ?)`,
           [post.name, post.profile],
           function(error, result){
             if(error){
               throw error;
             }
             response.writeHead(302, {Location: `/author`});
             response.end();
          })
      });
}
exports.update = function (request, response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    db.query(`SELECT * FROM topic`, function(error, topics){
        db.query(`SELECT * FROM author`, function(error2, authors){
            db.query(`SELECT * FROM author WHERE id = ?`,[queryData.id], function(error3, author){
                var title = 'Welcome';
                var description = 'Hello, Node.js';
                var list = template.list(topics);
                var html = template.HTML(title, list,
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
                        <input type = "hidden" name = "id" value="${queryData.id}">
                        <p><input type="text" name="name" placeholder="name" value="${sanitizeHtml(author[0].name)}"></p>
                        <p>
                        <textarea name="profile" placeholder="profile">${sanitizeHtml(author[0].profile)}</textarea>
                        </p>
                        <input type="submit" value ="update">
                        </p>
                    </form>`,
                    ``    
                );
                response.writeHead(200);
                response.end(html);
            })
        });
    });
}
exports.update_process = function (request, response){
    var body = '';
    request.on('data', function(data){
        body = body + data;
    });
    request.on('end', function(){
        var post = qs.parse(body);
        db.query(`UPDATE author SET name=?, profile=? WHERE id=?`, [post.name, post.profile, post.id],function(error, result){
            response.writeHead(302, {Location: `/author/update?id=${post.id}`});
            response.end();
        })
    });
}
exports.delete_process = function (request, response){
    var body = '';
    request.on('data', function(data){
        body = body + data;
    });
    request.on('end', function(){
        var post = qs.parse(body);
        db.query(`DELETE FROM topic WHERE author_id=?`,
        [post.id], function(error1, result1){
            if(error1){
                throw error1;
            }

            var id = post.id;
            db.query(`DELETE FROM author WHERE id = ?`, [post.id], function(error2, result2){
                if(error2){
                throw error2;
                }
                response.writeHead(302, {Location: `/author`});
                response.end();
            })
        })
    });
}