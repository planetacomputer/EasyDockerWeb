const router = require('express').Router();
// const { auth } = require('../middlewares/auth')
const { ensureAuth, ensureGuest } = require('../middlewares/auth')

router.get('/', (req, res) => {
    console.log("arrel /")
    if (req.isAuthenticated()){
        console.log("esta loguejat va a labo")
        res.redirect('/laboratoris');    
    }
    else{
        console.log("NO esta loguejat va a labo")
        res.render('login-auth')
    }
  })

router.get('/logout', (req, res, next) => {
    req.logout();
    req.session.isLogin = false;
    res.locals.isLogin = false;
    //Seria interessant eliminar els seus labs
    res.redirect('/');
});

router.get('/log', ensureAuth ,async(req, res) => {
    res.render('logAuth',{userinfo:req.user})
})

module.exports = router;