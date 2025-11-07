var User = require('../user')
var options = require('../../options')

module.exports = function(req, res, next) {
    // This is probably for API
    if (req.remoteUser) {
        res.locals.user = req.remoteUser
    }

    if (options.auto_login && req.user) {
        res.locals.user = req.user
        if (req.session && req.user.uid && req.session.uid !== req.user.uid) {
            req.session.uid = req.user.uid
        }
        return next()
    }

    // This is defined in login route
    var uid = req.session && req.session.uid

    if (!uid) return next()
    User.get(uid, function(err, user) {
        if (err) return next(err)
        req.user = res.locals.user = user
        next()
    })
}
