module.exports = {
  ensureAuth: function (req, res, next) {
    if (req.isAuthenticated()) {
      console.log("ensureAuth esta autenticat")
      return next()
    } else {
      console.log("ensureAuth NO esta autenticat")
      res.redirect('/')
    }
  },
  ensureGuest: function (req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    } else {
      res.redirect('/');
    }
  },

  isAdmin: function (req, res, next) {
    if (req.user.role == 'admin')
      return next ();
    //res.send ('onlyadmin')
 }
}