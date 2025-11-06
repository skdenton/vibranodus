var fs = require('fs')
var configLoader = require('./lib/config')

// General program-wide settings

exports.settings = {
    // 1 - Connect all the #words within a 4-word gap in the statement to each other
    // 0 - Connect only the words that are next to each other
    fullscan: 1,

    // 1 - Graph shows connections between both the words that are next to each and also within the 4-word gap
    // 0 - Graph shows only words that are next to each other
    fullview: 1,

    // 1 - Either the hashtags or the words can be the nodes for each statement
    // 0 - The nodes in the graph are both the words and the hashtags
    hashnodes: 0,

    // 1 - #hashtags are automatically converted to their morphemes (#cats = #cat, #taken = #take)
    // 0 - #hashtags stay like they are
    morphemes: 0,

    // Max number of contexts in one statement
    max_contexts: 5,

    // Max length of a statement text in Bytes
    max_text_length: 1000,

    // Max length of the total text length in Bytes
    max_total_text_length: 300000,

     // Max length of the total file length in Bytes
    max_file_length: 3000000,

    // Min length of a statement text
    min_text_length: 0,

    // Max number of tags in one statement
    max_hashtags: 1000,

    // Max nodes to show in a graph
    max_nodes: 150,

    // What's the node size threshold where we show its name
    label_threshold: 8,

    // Default voice to text input Language
    inlanguage: 'auto',

    // Default color palette of the graph
    palette: 'default',
}

/*
exports.defaultstatements = {
    f: 'every note can be saved in several contexts or lists. these notes are in the "help" context - click the context name in the left sidebar and then scroll down to delete the context with all the notes.',
    e: 'to get started, import your tweets, evernote and gmail / iphone notes using the import function in the left sidebar.',
    d: 'try to click on several words in the graph: you will see only the notes that contain those words.',
    c: 'try to add a new note. if you use #hashtags, only those #hashtags will be added into the #graph, not the other words you use. #great-feature #web #infranodus #amazing #nice ',
    b: 'this is a note. click it once to see it in the graph. double-click it to edit or to delete.',
    a: 'welcome! using infranodus you can discover how your different notes and ideas connect using a graph.'
}
*/

var parsed = configLoader.data || {}

if (!configLoader.loaded && !process.env.CONFIG_PATH) {
    console.log("Config file doesn't exist. Using default settings.")
}

function envOr(name, fallback) {
    return process.env[name] !== undefined ? process.env[name] : fallback
}

function buildHttpLink(protocol, host, user, pass) {
    if (!host) {
        return ''
    }

    var credentials = ''

    if (user && pass) {
        credentials = user + ':' + pass + '@'
    }

    return protocol + '://' + credentials + host
}

var neo4jConfig = parsed.neo4j || {}
var secretsConfig = parsed.secrets || {}
var infranodusConfig = parsed.infranodus || {}

var neo4jUser = envOr(
    'NEO4J_USERNAME',
    neo4jConfig.username !== undefined ? neo4jConfig.username : 'neo4j'
)
var neo4jPass = envOr(
    'NEO4J_PASSWORD',
    neo4jConfig.password !== undefined ? neo4jConfig.password : 'neo4j'
)
var neo4jHost = envOr(
    'NEO4J_HOST',
    neo4jConfig.host !== undefined ? neo4jConfig.host : 'localhost:7474'
)
var neo4jProtocol = envOr('NEO4J_HTTP_PROTOCOL', neo4jConfig.http_protocol || 'http')

var envBoltUri = envOr(
    'NEO4J_BOLT_URI',
    envOr('NEO4J_URI', neo4jConfig.bolt_uri || neo4jConfig.uri)
)

var boltHost = envOr(
    'NEO4J_BOLT_HOST',
    neo4jConfig.bolt !== undefined ? neo4jConfig.bolt : 'localhost:7687'
)

var neo4jBoltUri = envBoltUri

if (!neo4jBoltUri) {
    neo4jBoltUri = boltHost.indexOf('://') === -1 ? 'bolt://' + boltHost : boltHost
}

var httpLink = envOr(
    'NEO4J_HTTP_URL',
    neo4jConfig.http_url || buildHttpLink(neo4jProtocol, neo4jHost, neo4jUser, neo4jPass)
)

exports.neo4jlink = httpLink

exports.neo4jhost = neo4jBoltUri

exports.neo4juser = neo4jUser
exports.neo4jpass = neo4jPass

exports.invite = envOr('INVITATION_CODE', secretsConfig.invitation || '')
exports.cookie_secret = envOr(
    'COOKIE_SECRET',
    secretsConfig.cookie_secret || 'infranodus-cookie-secret'
)

exports.domain = envOr('SITE_DOMAIN', infranodusConfig.domain || 'localhost:3000')
exports.default_user = envOr('DEFAULT_USER', infranodusConfig.default_user || '')

exports.chargebee = Object.assign({}, parsed.chargebee || {})
exports.chargebee.site = envOr(
    'CHARGEBEE_SITE',
    exports.chargebee.site || ''
)
exports.chargebee.api_key = envOr(
    'CHARGEBEE_API_KEY',
    exports.chargebee.api_key || ''
)
exports.chargebee.redirect_url = envOr(
    'CHARGEBEE_REDIRECT_URL',
    exports.chargebee.redirect_url || ''
)

exports.rssPresets = parsed['rss_presets'] || {}

// Get a list of stopwords for English

fs.readFile(__dirname + '/public/files/stopwords_en_en.txt', function(
    err,
    data
) {
    if (err) {
        throw err
    }
    exports.stopwords_en = data.toString().split('\n')
})

// Get a list of stopwords for Russian

fs.readFile(__dirname + '/public/files/stopwords_ru_ru.txt', function(
    err,
    data
) {
    if (err) {
        throw err
    }
    exports.stopwords_ru = data.toString().split('\n')
})

// Get a list of stopwords for French

fs.readFile(__dirname + '/public/files/stopwords_fr_fr.txt', function(
    err,
    data
) {
    if (err) {
        throw err
    }
    exports.stopwords_fr = data.toString().split('\n')
})

// Get a list of stopwords for German

fs.readFile(__dirname + '/public/files/stopwords_de_de.txt', function(
    err,
    data
) {
    if (err) {
        throw err
    }

    exports.stopwords_de = data.toString().split('\n')
})

// Get a list of stopwords for Spanish

fs.readFile(__dirname + '/public/files/stopwords_es_es.txt', function(
    err,
    data
) {
    if (err) {
        throw err
    }

    exports.stopwords_es = data.toString().split('\n')
})

// Get a list of stopwords for Swedish

fs.readFile(__dirname + '/public/files/stopwords_sv_sv.txt', function(
    err,
    data
) {
    if (err) {
        throw err
    }

    exports.stopwords_sv = data.toString().split('\n')
})

// Get a list of stopwords for Portuguese

fs.readFile(__dirname + '/public/files/stopwords_pt_pt.txt', function(
    err,
    data
) {
    if (err) {
        throw err
    }

    exports.stopwords_pt = data.toString().split('\n')
})

