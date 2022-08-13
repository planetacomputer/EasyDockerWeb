const express = require('express');
const router = express.Router();
const fs = require("fs");
const Docker = require('dockerode');
const stream = require('stream');
const docker = new Docker();
const schedule = require('node-schedule');
const { ensureAuth, ensureGuest } = require('../middlewares/auth')
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
let o = new Object();
const returnLaboratorisRouter = (io) => {
  //Mostra taula amb tots els questionaris de cada usuari i indica el que es troba actiu
  router.get('/', ensureAuth, async (req, res, next) => {
    let tagsImages = [];
    let quizzes = [];

    let quizFileDir = fs
      .readdirSync(__dirname + "/data")
      .filter((name) => name.endsWith(".json"));

    console.log(userJobs);

    Object.entries(userJobs).forEach(item => {
      console.log(item[1].name + " - " + item[1].nextInvocation() + " - " + item[1].pendingInvocations);
    })

    var listImages = docker.listImages(function (err, data) {
      data.forEach(element => {
        //console.log(element.RepoTags[0]);
        if (element.RepoTags !== null) {
          tagsImages.push(element.RepoTags[0]);
        }
      });

      console.log("Log de l'arr repo ple: ");
      console.log(quizFileDir);
      console.log(req.user.id);
      //Nomes ens interessen
      let opts = {
        "name": req.user.id,
        //"limit": 12,
        "filters": { label: ["idUsuari=" + req.user.id] }
      };
      docker.listContainers(opts, function (err, containers) {
        imagesContainers = {};
        o = new Object();
        if (containers != null) {
          containers.forEach(container => {
            
            //Introduim aquest container al llistat amb key user.id i valor quiz.slug
            //imagesContainers[container.Names[0]] = container.Id;
            console.log("Nom container: " + container.Names[0])
            o[container.Names[0]] = container.Id; 
            console.log(o);
          });
        }
      });

      //Iterem tots els questionaris i només mostrem el contenidor de l'actiu,
      //el corresponent al contenidor slug_userId
      for (var file of quizFileDir) {
        var quizFile = requireUncached(`./data/${file}`)
        var downloaded = tagsImages.includes(quizFile.quizData.image);
        var cliConsola = '/bin/bash';
        if (quizFile.quizData.cli) {
          cliConsola = quizFile.quizData.cli;
        }
        // console.log(downloaded);
        console.log(quizFile.quizData.slug);
        // console.log(imagesContainers);
        let timerTask;
        //if (typeof userJobs[o["/" + req.user.id + "_" + quizFile.quizData.slug]] !== 'undefined') {
          //timerTask = userJobs[o["/" + req.user.id + "_" + quizFile.quizData.slug]].nextInvocation().toDate();
          //console.log(timerTask);
        //}
        containerId = "";
        console.log(o)
        console.log(req.user.id + "_" + quizFile.quizData.slug)
        console.log(quizFile.quizData.image + "_________" + quizFile.quizData.slug)
        console.log(o.hasOwnProperty("/" + req.user.id + "_" + quizFile.quizData.slug))
        nomCont = "/" + req.user.id + "_" + quizFile.quizData.slug
        if (nomCont in o) {
          containerId = o["/" + req.user.id + "_" + quizFile.quizData.slug]
          if(userJobs[o["/" + req.user.id + "_" + quizFile.quizData.slug]] !== undefined)
            timerTask = userJobs[o["/" + req.user.id + "_" + quizFile.quizData.slug]].nextInvocation().toDate();
          console.log("timetask: " + timerTask)
        }

        // if (imagesContainers.Names[0] == "/" + req.user.id + "_" + quizFile.quizData.slug){
        //     containerId = imagesContainers["/" + req.user.id + "_" + quizFile.quizData.slug]
        // }
        
        //array amb tots d'objectes quizzes
        quizzes.push({
          title: quizFile.quizData.title,
          slug: file.replace(".json", ""),
          slug2: quizFile.quizData.slug,
          sha256: quizFile.quizData.sha256,
          image: quizFile.quizData.image,
          questions: quizFile.questions.length,
          downloaded: downloaded,
          containerId: containerId,
          cli: cliConsola,
          timerTask: timerTask
        });
      }
      console.log(quizzes);
      console.log(o)
      res.render('laboratoris', { quizzes: quizzes, userinfo: req.user });
    });
  });


  io.on('connection', (socket) => {

    // socket.on('restart', (idContainer, imageName, slug) => {
    //   delete userJobs[idContainer];
    //   var file = slug + ".json";
    //   var quizFile = requireUncached(`./data/`+file);
    //     var cliConsola = '/bin/bash';
    //     if (quizFile.quizData.cli){
    //       cliConsola = quizFile.quizData.cli;
    //     }
    //   const container = docker.getContainer(idContainer);
    //   const opts = {
    //     force: true
    //   }
    //   console.log("ImageName: " + imageName);
    //   console.log("CLI: " + cliConsola);
    //   container.remove(opts, function (err, data) {
    //     console.log(data);
    //     docker.createContainer({
    //       Image: imageName,
    //       name: 'Lab1',
    //       Tty: true,
    //       Cmd: [cliConsola],
    //       AutoRemove: true
    //     }, function(err, container) {
    //       container.start({}, function(err, data) {
    //         console.log("restart");
    //         runExec(container);
    //         console.log(data);
    //         socket.emit('end', 'hola');
    //       });
    //   });
    //   });
    // });

    socket.on('stop', (containerId) => {
      const container = docker.getContainer(containerId);
      container.stop(null, (err, data) => {
        console.log("Aturem contenidori " + container.id);
        socket.emit('end', 'stoppedContainer' + container.id);
        delete userJobs[container.id];
      });

    });

    socket.on('pull', (imageName, slug, userId) => {
      
      //Eliminem per seguretat tots els contenidors previs d'aquest usuari
      //Nomes pot tenir un contenidor en execucio
      let optionsStop = {
        "name": userId,
        "filters": { label: ["idUsuari=" + userId] }
      };
      docker.listContainers(optionsStop,function (err, containers) {
        containers.forEach(function (containerInfo) {
          console.log("Aturem aquest contenidor de lusuari: " + containerInfo.Id)
          docker.getContainer(containerInfo.Id).stop();
        });
      });

      docker.pull(imageName, (err, stream) => {
        var file = slug + ".json";
        var quizFile = requireUncached(`./data/` + file);
        var cliConsola = '/bin/bash';
        var minutes = 45; //minuts per defecte
        if (quizFile.quizData.cli) {
          cliConsola = quizFile.quizData.cli;
        }
        if (quizFile.quizData.minutes) {
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
            nomContenidor = userId + "_" + slug;
            docker.createContainer({
              Image: imageName,
              name: nomContenidor, //se ha de arreglar
              Labels: {
                "environment": "blueWhale",
                "idUsuari": userId,
                "quizSlug": slug
              },
              Tty: true,
              Cmd: [cliConsola],
              AutoRemove: true,
              Memory: 40000000,
              Cpus: 0.05,
              OomKillDisable: true
            }, function (err, container) {
              if (!err){
                container.start({}, function (err, data) {
                  if (!err){
                    runExec(container);
                    var id = container.id;
                    //var date = new Date();
                    var date = new Date(new Date().getTime() + minutes * 10000);
                    userJobs[id] = schedule.scheduleJob(id, date, () => {
                      if (docker.getContainer(id) != null) {
                        console.log('Do something on scheduled date');
                        delete userJobs[id];
                        container.stop().catch(function (e) { });
                      }
                    });
                    console.log(data);
                    socket.emit('end', 'hola');
                  }
                });
              }
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
      name: 'Lab1',
      Tty: true,
      Cmd: ['/bin/bash'],
      AutoRemove: true
    }, function (err, container) {
      container.start({}, function (err, data) {
        if (!err)
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

  router.get('/console/:id', ensureAuth, (req, res, next) => {
    const container = docker.getContainer(req.params.id);
    //console.log(req.user);
    var diffUser = false;
    container.inspect(function (err, data) {
    if (!data){
      res.redirect('/laboratoris');
    }
    else{
      if (data.Config.Labels.idUsuari != req.user.id) {
        console.log("comparacio userId containerlabel")
        diffUser = true;
      }

      const timerTask = userJobs[container.id];
      // if (!timerTask) {
      //   res.redirect('/');
      // }
      if (diffUser) {
        console.log("error auth container");
        res.redirect('/');
      }
      else {
        console.log("diffUser " + diffUser);
      }
      contenido = fs.readFileSync(__dirname + '/data/' + req.query.name + ".json", 'utf8', function (err, data) {
        // Display the file content
        console.log(data);
      });
      jsonObject = JSON.parse(contenido);
      //console.log(jsonObject.questions);

      if (timerTask !== undefined){
        res.render('terminal', { quizData: jsonObject.quizData, questions: jsonObject.questions, timerTask: timerTask.nextInvocation().toDate(), containerId: req.params.id, userinfo: req.user });
      }
      // else{
      //   res.redirect('/laboratoris');
      // }
    }
    });
  });

  router.get('/remove/:imageId?/:containerId?', (req, res, next) => {

    if (req.params.containerId) {
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
            if (imagesContainers[key] == imageId) {
              console.log("coincide" + imagesContainers[key]);
            }
          }
        }

        container.remove({ force: true }, (err, data) => {
          if (err) {
            res.render('error', { error: err, message: err.json.message });
          } else {
            image.remove({ force: true }, (err, data) => {
              if (err) {
                res.render('error', { error: err, message: err.json.message });
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
    else if (req.params.imageId) {
      console.log("Esborrem imatge");
      let image = docker.getImage(req.params.imageId)
      console.log(image)
      // if (image !== null){
      //   image.remove({ force: true });
      // }
      res.redirect("/laboratoris");
    }
  });

  router.get('/start/:id', (req, res, next) => {
    const container = docker.getContainer(req.params.id);
    container.start(null, (err, data) => {
      if (!err)
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
  container.exec(options, function (err, exec) {
    if (err) return;
    exec.start(function (err, stream) {
      if (err) return;
      container.modem.demuxStream(stream, process.stdout, process.stderr);
      exec.inspect(function (err, data) {
        if (err) return;
        console.log(data);
      });
    });
  });
}

module.exports = returnLaboratorisRouter;