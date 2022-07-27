const express = require('express');
const router = express.Router();
const fs = require("fs");
const Docker = require('dockerode');
const stream = require('stream');
const docker = new Docker();
const schedule = require('node-schedule');
const userJobs = {};


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

var imagesContainers = {};
const returnLaboratorisRouter = (io) => {
router.get('/', async (req, res, next) => {
      let tagsImages = [];
      let quizzes = [];

      let quizFileDir = fs
      .readdirSync(__dirname+"/data")
      .filter((name) => name.endsWith(".json"));

      console.log(userJobs);
      
      Object.entries(userJobs).forEach(item => {
        console.log(item[1].name + " - " + item[1].nextInvocation()  + " - " + item[1].pendingInvocations);
      })
     
  var listImages = docker.listImages(function(err, data) {  
    data.forEach(element => {
      //console.log(element.RepoTags[0]);
      if (element.RepoTags !== null){
        tagsImages.push(element.RepoTags[0]);
      }
    });
    

      console.log("Log de l'arr repo ple: ");
      console.log(quizFileDir);
      const opts = {
        // filters: {
        //   ancestor: [tagsImages.pop()]
        // }
      }
      docker.listContainers(opts, function (err, containers) {
        imagesContainers = {};
        if (containers != null){
            console.log("no es null");
            containers.forEach(container => {
              console.log(container.Id + " - " + container.Image);
              imagesContainers[container.Image] = container.Id;
            });
        }
      });
      
      for (var file of quizFileDir) {
        var quizFile = requireUncached(`./data/${file}`) 
          var downloaded = tagsImages.includes(quizFile.quizData.image);
          var cliConsola = '/bin/bash';
          if (quizFile.quizData.cli){
            cliConsola = quizFile.quizData.cli;
          }
          console.log(downloaded);
          console.log(quizFile.quizData.image);
          console.log(imagesContainers);
          var timerTask;
          if (typeof userJobs[imagesContainers[quizFile.quizData.image]] !== 'undefined'){
            timerTask = userJobs[imagesContainers[quizFile.quizData.image]].nextInvocation().toDate();
            console.log(timerTask);
          }
          quizzes.push({
              title: quizFile.quizData.title,
              slug: file.replace(".json", ""),
              slug2: quizFile.quizData.slug,
              sha256: quizFile.quizData.sha256,
              image: quizFile.quizData.image,
              questions: quizFile.questions.length,
              downloaded: downloaded,
              containerId: imagesContainers[quizFile.quizData.image],
              cli: cliConsola,
              timerTask: timerTask
          });
      }

      // var jobList = schedule.scheduledJobs;
      // console.log("lists Schelces" + jobList);
      // for(jobName in jobList){
      //   console.log(jobName);
      // }
      res.render('laboratoris', { quizzes: quizzes }); 
  });  
  });


    io.on('connection', (socket) => {
      socket.on('restart', (idContainer, imageName, slug) => {
        delete userJobs[idContainer];
        var file = slug + ".json";
        var quizFile = requireUncached(`./data/`+file);
          var cliConsola = '/bin/bash';
          if (quizFile.quizData.cli){
            cliConsola = quizFile.quizData.cli;
          }
        const container = docker.getContainer(idContainer);
        const opts = {
          force: true
        }
        console.log("ImageName: " + imageName);
        console.log("CLI: " + cliConsola);
        container.remove(opts, function (err, data) {
          console.log(data);
          docker.createContainer({
            Image: imageName,
            Name: 'Lab1',
            Tty: true,
            Cmd: [cliConsola],
            AutoRemove: true
          }, function(err, container) {
            container.start({}, function(err, data) {
              console.log("restart");
              runExec(container);
              console.log(data);
              socket.emit('end', 'hola');
            });
        });
        });
      });

      socket.on('stop', (containerId) => {
        const container = docker.getContainer(containerId);
        container.stop(null, (err, data) => {
            console.log("Aturem contenidori " + container.id);
            socket.emit('end', 'stoppedContainer' + container.id);
            delete userJobs[container.id];
        });
        
      });

      socket.on('pull', (imageName, slug) => {
          docker.pull(imageName, (err, stream) => {
                var file = slug + ".json";
            var quizFile = requireUncached(`./data/`+file);
              var cliConsola = '/bin/bash';
              var minutes = 45; //minuts per defecte
              if (quizFile.quizData.cli){
                cliConsola = quizFile.quizData.cli;
              }
              if (quizFile.quizData.minutes){
                minutes = quizFile.quizData.minutes;
              }
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
                      docker.createContainer({
                        Image: imageName,
                        Name: 'Lab1',
                        Tty: true,
                        Cmd: [cliConsola],
                        AutoRemove: true
                      }, function(err, container) {
                        container.start({}, function(err, data) {
                          runExec(container);
                          var id = container.id;
                          //var date = new Date();
                          var date = new Date(new Date().getTime() + minutes*10000);
                          userJobs[id] = schedule.scheduleJob(id, date, () => {
                            console.log('Do something on scheduled date');
                            delete userJobs[id];
                            container.stop();
                          });
                          console.log(data);
                          socket.emit('end', 'hola');
                        });
                    });
                      
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
            Image: req.params.name,
            Name: 'Lab1',
            Tty: true,
            Cmd: ['/bin/bash'],
            AutoRemove: true
          }, function(err, container) {
            container.start({}, function(err, data) {
              runExec(container);
            });
        });
        
        res.redirect('/laboratoris');  
    });


    router.get('/stop/:imageId', (req, res, next) => {
      const container = docker.getContainer(req.params.imageId);
      console.log("Aturem contenidor " + container.id);
      container.stop(null, (err, data) => {
          res.redirect('/laboratoris');
      });
    });

    router.get('/console/:id', (req, res, next) => {
      const container = docker.getContainer(req.params.id);
      const timerTask = userJobs[container.id];
      contenido = fs.readFileSync(__dirname+'/data/' + req.query.name + ".json", 'utf8', function(err, data){
          // Display the file content
          console.log(data);
      });
      jsonObject = JSON.parse(contenido);
      console.log(jsonObject.questions);
      res.render('terminal', { quizData: jsonObject.quizData, questions:jsonObject.questions, timerTask: timerTask.nextInvocation().toDate()});
  });

    router.get('/remove/:imageId?/:containerId?', (req, res, next) => {
      
      if (req.params.containerId){
        console.log("pso por aqui"); 
        const container = docker.getContainer(req.params.containerId);
        container.inspect().then(results => {
         const props = {
           ExitCode: results.State.ExitCode,
           imageId: results.Image
         }
         console.log(props.ExitCode);
         console.log("Id extraidos" + container);
         
         console.log(container.id);
         let imageId = props.imageId;
         console.log("imageId: " + imageId);
         let image = docker.getImage(imageId);
         //console.log(image);
         //console.log(imagesContainers);
         for (var key in imagesContainers) {
           if (imagesContainers.hasOwnProperty(key)) {
               // Printing Keys
               console.log(key);
               if (imagesContainers[key] == imageId){
                 console.log("coincide" + imagesContainers[key]);
               }
           }
         } 
   
         container.remove({force: true}, (err, data) => {
           if (err) {
               res.render('error', {error: err, message: err.json.message});
           } else {
             image.remove({force: true}, (err, data) => {
               if (err) {
                   res.render('error', {error: err, message: err.json.message});
               } else {
                   //delete imagesContainers[image.RepoTags[0]];
                   res.redirect('/laboratoris');
               }
             });
               //res.redirect('/laboratoris');
           }
       });
       });
      }
      else if (req.params.imageId){
          console.log("Esborrem imatge");
          const image = docker.getImage(req.params.imageId)
          image.remove({force: true});
          res.redirect("/laboratoris");
        }
    });

    router.get('/start/:id', (req, res, next) => {
      const container = docker.getContainer(req.params.id);
      container.start(null, (err, data) => {
          res.redirect('/laboratoris');
      });
    });

    return router;
};


function runExec(container) {
    var options = {
      //Cmd: ['/bin/bash'],
      //Env: ['VAR=ttslkfjsdalkfj'],
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