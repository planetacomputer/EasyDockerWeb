// import all the things we need  
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User');

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        //get the user data from google 
        const newUser = {
          googleId: profile.id,
          displayName: profile.displayName,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          image: profile.photos[0].value,
          email: profile.emails[0].value,
          createdAt: Date.now
        }

        try {
          //find the user in our database 
          let user = await User.findOne({ email: profile.emails[0].value })
          //no user in the database, redirect index
          if (!user){
            console.log("no hi ha usuari")
            done(null, null)
          }
          
          else{
            //user exists and has googleId
            if (user.googleId) {
              //If user present in our database.
              console.log("si hi ha usuari")
              done(null, user)
            //user preregistered, but must be filled out with GAccount info
            } else {
              console.log("usuari preregistrat")
              // if user does not exist in our database, save user.
              const filter = { email: profile.emails[0].value };
              user = await User.findOneAndUpdate(filter, newUser)
              done(null, user)
            }
          } 
        } catch (err) {
          console.error(err)
        }
      }
    )
  )

  // used to serialize the user for the session
  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  // used to deserialize the user
  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => done(err, user))
  })
}