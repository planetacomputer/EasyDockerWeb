const express = require('express');
const router = express.Router();
const Docker = require('dockerode');
const docker = new Docker();
const { isAdmin } = require('../middlewares/auth')
/* GET home page. */
const returnOverviewRouter = (io) => {
    router.get('/', isAdmin, (req, res, next) => {
        docker.info((err, info) => {
            // console.log(info)
            if (err) {
                res.render('error', {
                    message: "Docker is running ?",
                    error: err
                });
            } else {
                res.render('overview', {
                    info: info, userinfo: req.user
                });
            }
        });
    });

    return router;
};

module.exports = returnOverviewRouter;
