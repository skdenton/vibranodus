var crypto = require('crypto')

var options = require('../../options')
var User = require('../user')

var cachedUser = null
var pendingLoads = null

function ensureDefaultUser(cb) {
    var username = options.default_user

    if (!username) {
        return cb(new Error('Auto-login requires DEFAULT_USER to be set.'))
    }

    User.getByName(username, function(err, user) {
        if (err) return cb(err)

        if (user && user.uid) {
            return cb(null, user)
        }

        var password = crypto.randomBytes(16).toString('hex')

        var newUser = new User({
            name: username,
            pepper: password,
            portal: 'local@example.com',
        })

        newUser.save(function(saveErr) {
            if (saveErr) return cb(saveErr)

            User.getByName(username, cb)
        })
    })
}

function loadDefaultUser(cb) {
    if (cachedUser && cachedUser.uid) {
        return cb(null, cachedUser)
    }

    if (pendingLoads) {
        pendingLoads.push(cb)
        return
    }

    pendingLoads = [cb]

    ensureDefaultUser(function(err, user) {
        cachedUser = err ? null : user

        var callbacks = pendingLoads
        pendingLoads = null

        callbacks.forEach(function(fn) {
            fn(err, user)
        })
    })
}

function finalizeSession(req, res, next, user) {
    function assignUser() {
        if (req.session && user.uid) {
            req.session.uid = user.uid
        }

        req.user = user
        res.locals.user = user
        cachedUser = user
        next()
    }

    if (req.user && req.user.uid === user.uid) {
        res.locals.user = req.user
        if (req.session && req.session.uid !== req.user.uid) {
            req.session.uid = req.user.uid
        }
        cachedUser = req.user
        return next()
    }

    if (typeof req.isAuthenticated === 'function' && req.isAuthenticated()) {
        return assignUser()
    }

    if (typeof req.login === 'function') {
        req.login(user, function(err) {
            if (err) return next(err)
            assignUser()
        })
        return
    }

    assignUser()
}

module.exports = function autoLoginMiddleware(req, res, next) {
    if (!options.auto_login) {
        return next()
    }

    if (req.user && req.user.uid) {
        res.locals.user = req.user
        if (req.session && req.session.uid !== req.user.uid) {
            req.session.uid = req.user.uid
        }
        cachedUser = req.user
        return next()
    }

    loadDefaultUser(function(err, user) {
        if (err) return next(err)
        if (!user || !user.uid) {
            return next(new Error('Unable to resolve default user for auto-login.'))
        }

        finalizeSession(req, res, next, user)
    })
}
