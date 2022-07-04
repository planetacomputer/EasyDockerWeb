const express = require('express');
const router = express.Router();
const fs = require("fs");
const Docker = require('dockerode');
const stream = require('stream');
const docker = new Docker();

function jsonReader(dataAddress, cb) {
  fs.readFile(dataAddress, (err, fileData) => {
    if (err) {
      return cb && cb(err);
    }
    try {
      const object = JSON.parse(fileData);
      return cb && cb(null, object);
    } catch (err) {
      return cb && cb(err);
    }
  });
}


function requireUncached(module) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

const returnLaboratorisRouter = (io) => {
    router.get('/', async (req, res, next) => {
      let tagsImages = [];
      let quizzes = [];

      let quizFileDir = fs
      .readdirSync(__dirname+"/data")
      .filter((name) => name.endsWith(".json"));

      
  var listImages = docker.listImages(function(err, data) {  
    data.forEach(element => {
      console.log(element.RepoTags[0]);
      tagsImages.push(element.RepoTags[0]);
    });
      console.log("Log de l'arr repo ple: ");
      console.log(quizFileDir);
      for (var file of quizFileDir) {
        var quizFile = requireUncached(`./data/${file}`) 
          
          var downloaded = tagsImages.includes(quizFile.quizData.image);
          console.log(downloaded);
          console.log(quizFile.quizData.image);
          quizzes.push({
              title: quizFile.quizData.title,
              slug: file.replace(".json", ""),
              sha256: quizFile.quizData.sha256,
              image: quizFile.quizData.image,
              questions: quizFile.questions.length,
              downloaded: downloaded
          });
      }

      docker.pull('busybox:latest', function (err, stream) {
        // streaming output from pull...
        console.log(stream);
        console.log(err);
      });


      //followProgress(stream, onFinished, [onProgress])
// docker.pull(repoTag, function(err, stream) {
//   //...
//   docker.modem.followProgress(stream, onFinished, onProgress);

//   function onFinished(err, output) {
//     //output is an array with output json parsed objects
//     //...
//   }
//   function onProgress(event) {
//     //...
//   }
// });

      res.render('laboratoris', { quizzes: quizzes }); 
  });
      
       
    });


    io.on('connection', (socket) => {
      socket.on('pull', (imageName) => {
          docker.pull(imageName, (err, stream) => {
              if (err) {
                  const tmp = err.toString();
                  socket.emit('show', tmp);
                  setTimeout(() => {
                      socket.emit('end');
                  }, 10000);
              } else {

                  const onFinished = (err, output) => {
                      if (err) {
                          console.log(err);
                      }
                      socket.emit('end');
                  };

                  const onProgress = (event) => {
                      if (event.id) {
                          socket.emit('show',
                              event.status + ':' + event.id + '\n');
                      } else {
                          socket.emit('show', event.status + '\n');
                      }
                      if (event.progress) {
                          socket.emit('show', event.progress + '\n');
                      }
                  };

                  docker.modem.followProgress(stream, onFinished, onProgress);
              }

          });
      });
  });

    router.get('/creaLaboratori', (req, res, next) => {

        docker.createContainer({
            Image: 'ubuntu',
            Tty: true,
            Cmd: ['/bin/bash']
          }, function(err, container) {
            container.start({}, function(err, data) {
              runExec(container);
            });
        });
        res.render('laboratoris', { quizzes: quizzes });  
    });

    router.get('/remove/:id', (req, res, next) => {
      let imageId = req.params.id;
      if (imageId.indexOf(':') > 0) {
          imageId = imageId.split(':')[1];
      }
      let image = docker.getImage(imageId);
      image.remove({force: true}, (err, data) => {
          if (err) {
              res.render('error', {error: err, message: err.json.message});
          } else {
              res.redirect('/laboratoris');
          }
      });
  });

    return router;
};



function runExec(container) {

    var options = {
      Cmd: ['bash', '-c', 'echo test $VAR'],
      Env: ['VAR=ttslkfjsdalkfj'],
      AttachStdout: true,
      AttachStderr: true
    };
  
    container.exec(options, function(err, exec) {
      if (err) return;
      exec.start(function(err, stream) {
        if (err) return;
  
        container.modem.demuxStream(stream, process.stdout, process.stderr);
  
        exec.inspect(function(err, data) {
          if (err) return;
          console.log(data);
        });
      });
    });
  }


module.exports = returnLaboratorisRouter;