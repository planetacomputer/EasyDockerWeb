const express = require('express')
const passport = require('passport')
const router = express.Router()
//const { auth } = require('../middlewares/auth')
//const { ensureAuth, ensureGuest } = require('../middlewares/auth')

router.get('/google', passport.authenticate('google', { scope: ['profile','email'] }))

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    console.log("Ja es troba autenticat a callback");
    res.redirect('/laboratoris');
  }
)

router.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

module.exports = router
