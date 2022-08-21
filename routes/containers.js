const express = require('express');
const app = express();
const router = express.Router();
const Docker = require('dockerode');
const Dockerode = require('simple-dockerode');
const stream = require('stream');
const { stringify } = require('querystring');
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');

const docker = new Docker();
const dockerExec = new Dockerode({ socketPath: '/var/run/docker.sock' });
let contenido = "";
const returnContainersRouter = (io) => {
    /* GET containers. */
    router.get('/', (req, res, next) => {
        docker.listContainers({ all: true }, (err, containers) => {
            res.locals.formatName = (str) => {
                return str[0].split('/')[1];
            };
            docker.listImages(null, (err, listImages) => {
                res.render('containers',
                    {
                        containers: containers,
                        images: listImages,
                    });
            });
        });
    });

    router.get('/start/:id', (req, res, next) => {
        const container = docker.getContainer(req.params.id);
        container.start(null, (err, data) => {
            res.redirect('/containers');
        });
    });

    router.get('/stop/:id', (req, res, next) => {
        const container = docker.getContainer(req.params.id);
        container.stop(null, (err, data) => {
            res.redirect('/containers');
        });
    });

    router.get('/remove/:id', (req, res, next) => {
        const container = docker.getContainer(req.params.id);
        container.remove({ force: true }, (err, data) => {
            if (err) {
                res.render('error', { error: err, message: err.json.message });
            } else {
                res.redirect('/containers');
            }
        });
    });

    router.post('/create', (req, res, next) => {
        let options = {
            Image: req.body.containerImage,
            AttachStdin: false,
            AttachStdout: true,
            AttachStderr: true,
            Tty: false,
            HostConfig: {
                PortBindings: {},
            },
        };

        // name
        if (req.body.containerName !== '') {
            options = {
                ...options,
                name: req.body.containerName,
            };
        }

        // volume
        if (req.body.containerVolumeSource !== '' &&
            req.body.containerVolumeDistination !== '') {
            const src = req.body.containerVolumeSource;
            const dis = req.body.containerVolumeDistination;
            options['Volumes'] = JSON.parse('{"' + dis + '": {}}');
            options.HostConfig = {
                'Binds': [src + ':' + dis],
                'RestartPolicy': {
                    'Name': req.body.isAlways === 'on' ? 'always' : '',
                    'MaximumRetryCount': 5,
                },
            };
        }

        // port
        if (req.body.containerPortSource !== '' &&
            req.body.containerPortDistination !== '') {
            const src = req.body.containerPortSource + '/tcp';
            const dis = req.body.containerPortDistination;
            options['ExposedPorts'] = JSON.parse('{"' + src + '": {}}');
            const tmp = '{ "' + src + '": [{ "HostPort":"' + dis + '" }]}';
            options.HostConfig.PortBindings = JSON.parse(tmp);
        }

        if (req.body.containerCmd != '') {
            options.Cmd = ['/bin/sh', '-c', req.body.containerCmd];
            // console.log(options)
            docker.createContainer(options, (err, container) => {
                if (err) throw err;
                container.start((err, data) => {
                    res.redirect('/containers/logs/' + container.id);
                });
            });
        } else {
            const runOpt = {
                Image: req.body.containerImage,
                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,
                Tty: true,
                Cmd: ['touch', "/tmp/nuevo.txt"],
                OpenStdin: false,
                StdinOnce: false,
                ...options,
            };
            docker.createContainer(runOpt).then(function (container) {
                return container.start();
            }).then((container) => {
                res.redirect('/containers');
            });
        }
    });

    const fs = require("fs");
    let jsonObject;

    app.use(express.static(__dirname + "/public"));
    app.use("data", express.static(__dirname + "/data"));

    router.get('/console/:id', (req, res, next) => {
        contenido = fs.readFileSync(__dirname + '/data/' + req.query.name + ".json", 'utf8', function (err, data) {
            // Display the file content
            console.log(data);
        });
        jsonObject = JSON.parse(contenido);
        //console.log(jsonObject.questions);
        res.render('terminal', { quizData: jsonObject.quizData, questions: jsonObject.questions });
    });

    router.get('/console2/:id', (req, res, next) => {
        res.render('terminal2');
    });

    router.get('/logs/:id', (req, res, next) => {
        res.render('logs');
    });

    //parsegem del fitxer json la solucio
    router.post('/checkAnswer/ajax', (req, res, next) => {
        id = req.body.id;
        slug = req.body.slug;
        console.log("slug: " + slug);
        let jsonObject = fs.readFileSync(__dirname + `/data/` + slug + `.json`);
        let quizJson = JSON.parse(jsonObject);
        questions = quizJson.questions[id - 1];
        for (var key in questions.answers) {
            if (questions.answers.hasOwnProperty(key)) {
                console.log(key + " -> " + questions.answers[key].text);
                console.log(key + " -> " + questions.answers[key].correct);
                if (questions.answers[key].correct == true) {
                    var1 = questions.answers[key].text;
                    res.json({ var1 });
                }
            }
        }
    });

    io.on('connection', (socket) => {
        const sessionID = socket.id;
        socket.on('execQuiz', function (data) {
            let myContainer = dockerExec.getContainer(data.idContainer);
            let jsonObjectPre = fs.readFileSync(__dirname + `/data/` + data.slug + `.json`);
            let jsonObject = JSON.parse(jsonObjectPre);
            console.log(jsonObject.questions);
            let comanda = "";
            if (data.tipus == "pre" && jsonObject.questions[data.currentQuestion].pre !== undefined) {
                console.log(jsonObject.questions[data.currentQuestion].pre);
                comanda = jsonObject.questions[data.currentQuestion].pre;
            }
            else if (data.tipus == "check" && jsonObject.questions[data.currentQuestion].check !== undefined) {
                console.log("check");
                console.log(jsonObject.questions[data.currentQuestion].check);
                comanda = jsonObject.questions[data.currentQuestion].check;
                console.log(comanda);
            }
            else if (data.tipus == "post" && jsonObject.questions[data.currentQuestion].post !== undefined) {
                console.log("post");
                console.log(jsonObject.questions[data.currentQuestion].post);
                comanda = jsonObject.questions[data.currentQuestion].post;
                console.log(comanda);
            }
            myContainer.exec(['/bin/sh', '-c', comanda], { stdout: true }, (err, results) => {
                if (err) return;
                console.log(results.stdout);
                socket.emit('returnDrawerResponse', results.stdout);
            });
        });

        socket.on("disconnect", () => {
            console.log("Aquest client amb scoket marxa " + socket.id); // undefined
        });

        socket.on('postQuestion', function (data) {
            console.log("sha respost pregunta" + sessionID);
            //console.log(data);
            let quiz = new Quiz(data);
            Quiz.findOne({ sessionID: quiz.sessionID }, function (err, docs) {
                if (err) {
                    console.log(err)
                }
                else {
                    console.log("Result : ", docs);
                    if (docs != null) {
                        console.log("Trobat!" + docs.sessionID)
                        const quizNoID = {
                            arrEncerts: quiz.arrEncerts,
                            "datePosted": quiz.datePosted,
                            'sessionID': quiz.sessionID,
                            'slugLaboratori': quiz.slugLaboratori,
                            'firstName': quiz.firstName,
                            'lastName': quiz.lastName,
                            'email': quiz.email,
                            'nota': quiz.nota
                          }
                        Quiz.updateOne({ sessionID: docs.sessionID },
                            quizNoID, function (err, docs) {
                                if (err) {
                                    console.log("Error en update")
                                    console.log(err)
                                }
                                else {
                                    console.log("Updated Docs : ", docs);
                                }
                            });
                    }
                    else {
                        quiz.save(function(err,result){
                            if (err){
                                console.log(err);
                            }
                            else{
                                console.log(result)
                            }
                        })
                    }
                }
            });

        });

        socket.on('encert', function (data) {
            //console.log(data);
            //console.log(data.idContainer);
            const myContainer = dockerExec.getContainer(data.idContainer);
            myContainer.exec(['echo', 'goodbye world'], { stdout: true }, (err, results) => {
                //console.log(results.stdout);
            });
            myContainer.exec(['/bin/sh', '-c', '/tmp/hola.sh'], { stdout: true }, (err, results) => {
                //console.log(results.stdout);
                socket.emit('returnDrawerResponse', results.stdout);
            });
        });

        socket.on('exec', (id, w, h) => {
            const container = docker.getContainer(id);
            let cmd = {
                'AttachStdout': true,
                'AttachStderr': true,
                'AttachStdin': true,
                'Tty': true,
                Cmd: ['/bin/sh'],
            };
            container.exec(cmd, (err, exec) => {
                let options = {
                    'Tty': true,
                    stream: true,
                    stdin: true,
                    stdout: true,
                    stderr: true,
                    // fix vim
                    hijack: true,
                };

                container.wait((err, data) => {
                    socket.emit('end', 'ended');
                });

                if (err) {
                    return;
                }

                exec.start(options, (err, stream) => {
                    const dimensions = { h, w };
                    if (dimensions.h != 0 && dimensions.w != 0) {
                        exec.resize(dimensions, () => {
                        });
                    }

                    stream.on('data', (chunk) => {
                        socket.emit('show', chunk.toString());
                    });

                    socket.on('cmd', (data) => {
                        if (typeof data !== 'object')
                            stream.write(data);
                    });

                });
            });
        });

        socket.on('attach', (id, w, h) => {
            const container = docker.getContainer(id);
            const logStream = new stream.PassThrough();
            logStream.on('data', (chunk) => {
                socket.emit('show', chunk.toString('utf8'));
            });

            const logs_opts = {
                follow: true,
                stdout: true,
                stderr: true,
                timestamps: false,
            };

            const handler = (err, stream) => {
                container.modem.demuxStream(stream, logStream, logStream);
                if (!err && stream) {
                    stream.on('end', () => {
                        logStream.end('===Logs stream finished===');
                        socket.emit('end', 'ended');
                        stream.destroy();
                    });
                }
            };

            container.logs(logs_opts, handler);
        });

        socket.on('getSysInfo', (id) => {
            const container = docker.getContainer(id);
            container.stats((err, stream) => {
                if (!err && stream != null) {
                    stream.on('data', (data) => {
                        socket.emit(id, data.toString('utf8'));
                    });
                    stream.on('end', () => {
                        socket.emit('end', 'ended');
                        stream.destroy();
                    });
                }
            });
        });

        socket.on('end', () => {
            array = [];
            streams.map((stream) => {
                stream.destroy();
            });
            console.log('--------end---------');
        });

        let array = [];
        let streams = [];
        // for react web ui
        socket.on('getContainersInfo', (id) => {
            if (array.indexOf(id) === -1) {
                array.push(id);
                console.log('socket.io => getContainersInfo ' + id);
                const container = docker.getContainer(id);
                container.stats((err, stream) => {
                    streams.push(stream);
                    if (!err && stream != null) {
                        stream.on('data', (data) => {
                            const toSend = JSON.parse(data.toString('utf8'));
                            socket.emit('containerInfo', toSend);
                        });
                        stream.on('end', () => {
                            socket.emit('end', 'ended');
                            stream.destroy();
                        });
                    }
                });
            }
        });

    });

    return router;
};

module.exports = returnContainersRouter;
