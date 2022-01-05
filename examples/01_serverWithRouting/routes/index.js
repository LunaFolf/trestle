const fs = require('fs')

let routes = []

let potentialRoutes = fs.readdirSync(`${__dirname}`, { withFileTypes: true })
potentialRoutes = potentialRoutes.filter(dirent => dirent.isDirectory())

potentialRoutes.forEach(dirent => {
  const indexFile = `${__dirname}/${dirent.name}/index.js`
  if (fs.existsSync(indexFile)) {
    console.log(`Loading routes from ${indexFile}`.yellow)
    routes = routes.concat(require(`${__dirname}/${dirent.name}`))
  }
})

module.exports = { routes }