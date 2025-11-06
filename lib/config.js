const fs = require('fs')
const path = require('path')

const overridePath = process.env.CONFIG_PATH
const defaultPath = path.resolve(__dirname, '..', 'config.json')
const resolvedPath = overridePath
    ? path.isAbsolute(overridePath)
        ? overridePath
        : path.resolve(__dirname, '..', overridePath)
    : defaultPath

let data = {}
let loaded = false

if (fs.existsSync(resolvedPath)) {
    try {
        const fileContents = fs.readFileSync(resolvedPath, 'utf-8')
        data = JSON.parse(fileContents)
        loaded = true
    } catch (error) {
        console.warn(
            'Could not parse configuration file at %s: %s',
            resolvedPath,
            error.message
        )
    }
} else if (overridePath) {
    console.warn(
        'Configuration file not found at %s. Continuing with environment/default values.',
        resolvedPath
    )
}

module.exports = {
    data,
    path: resolvedPath,
    loaded,
}
