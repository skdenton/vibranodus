var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var User = require('./user')
var options = require('../options')

// Passport session setup.

passport.serializeUser(function(user, done) {
    done(null, user.uid)
})

passport.deserializeUser(function(uid, done) {
    User.get(uid, function(err, user) {
        done(err, user)
    })
})

//   Use the LocalStrategy within Passport.

passport.use(
    new LocalStrategy(function(username, password, done) {
        User.authenticate(username, password, function(err, user) {
            if (err) {
                return done(err)
            }
            if (!user) {
                return done(null, false, {
                    message: 'Either the username or the password are wrong',
                })
            }
            if (user) {
                return done(null, user)
            } else {
                return done(null, false, { message: 'Invalid password' })
            }
        })
    })
)

// Simple route middleware to ensure user is authenticated.  Otherwise send to login page.
function isLoggedIn(req) {
    var passportLoggedIn =
        typeof req.isAuthenticated === 'function' && req.isAuthenticated()

    return passportLoggedIn || (options.auto_login && req.user)
}

exports.ensureAuthenticated = function ensureAuthenticated(req, res, next) {
    if (isLoggedIn(req)) {
        res.locals.user = req.user
        return next()
    }

    res.redirect('/login?redirect=' + encodeURIComponent(req.url))
}

// Simple route middleware to ensure user is authenticated.  Otherwise send to login page.
exports.checkUser = function checkUser(req, res, next) {
    if (isLoggedIn(req)) {
        res.locals.user = req.user
        res.locals.user.publicview = '1'
        return next()
    } else {
        return next()
    }
}

// Simple route middleware to ensure user is authenticated.  Otherwise send to login page.
exports.checkLogin = function checkLogin(req, res, next) {
    if (isLoggedIn(req)) {
        res.locals.user = req.user
        var userpath = '/apps'
        res.redirect(userpath)
    } else {
        next()
    }
}
