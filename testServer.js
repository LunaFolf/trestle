const { WskyRestAPI } = require('./classes/WskyRestAPI')
const { WskyRoute } = require('./classes/WskyRoute')
const fs = require('fs')
require('dotenv').config()

const expectedJsonResponse = { "boom": "baby!" }

const rawRoutes = [
  {
    path: '/testing/hello',
    method: 'GET',
    public: true,
    handler ({ response }) {
      response.write(JSON.stringify(expectedJsonResponse, null, 2))
    }
  }
]

const routes = []

rawRoutes.forEach(rawRoute => {
  const route = new WskyRoute(rawRoute.path, { method: rawRoute.method, public: rawRoute.public })
  route.on('route_match', rawRoute.handler)
  routes.push(route)
})

const wskyRestServer = new WskyRestAPI({ port: 8081, debug: true })
if (process.env.ssl_key && process.env.ssl_cert) {
  const key = fs.readFileSync(process.env.ssl_key).toString()
  const cert = fs.readFileSync(process.env.ssl_cert).toString()

  wskyRestServer.setSsl(key, cert)
} else throw new Error('SSL Creds missing, dumb nuts')

routes.forEach(route => {
  wskyRestServer.addRoute(route)
})

wskyRestServer.init()