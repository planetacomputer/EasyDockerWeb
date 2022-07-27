const express = require('express');
const router = express.Router();
const schedule = require('node-schedule');

var date = new Date(2022, 6, 22, 16, 31, 0);

var j = schedule.scheduleJob(date, function(){
  console.log('The world is going to end today.');
});

/* GET home page. */
router.get('/', (req, res, next) => {
    res.redirect('/laboratoris');
});

router.get('/logout', (req, res, next) => {
    req.session.isLogin = false;
    res.locals.isLogin = false;
    res.redirect('/');
});

module.exports = router;
