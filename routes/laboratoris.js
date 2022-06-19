const express = require('express');
const router = express.Router();
const fs = require("fs");
const Docker = require('dockerode');
const stream = require('stream');
const docker = new Docker();

files = fs.readdirSync(__dirname+"/data");

const path = require('path');
console.log("\Filenames with the .js extension:");
console.log("\Dirname: " + __dirname);
files.forEach(file => {
if (path.extname(file) == ".js")
    console.log(file);
})

const quizFileDir = fs
  .readdirSync(__dirname+"/data")
  .filter((name) => name.endsWith(".js"));

const quizzes = [];
for (const file of quizFileDir) {
    const quizFile = require(`./data/${file}`);
    quizzes.push({
        title: quizFile.quizData.title,
        slug: file.replace(".js", "")
    });
}


const returnLaboratorisRouter = (io) => {
    router.get('/', (req, res, next) => {
        res.render('laboratoris', { quizzes: quizzes });  
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