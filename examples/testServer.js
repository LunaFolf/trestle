const { TrestleAPI, TrestleRoute } = require('../index')
const fs = require('fs')
require('dotenv').config()

const expectedJsonResponse = { "boom": "baby!" }

const rawRoutes = [
  {
    path: '/testing/hello',
    method: 'GET',
    public: true,
    handler ({ response }) {
      response.json(expectedJsonResponse)
    }
  }
]

const routes = []

rawRoutes.forEach(rawRoute => {
  const route = new TrestleRoute(rawRoute.path, { method: rawRoute.method, public: rawRoute.public })
  route.on('route_match', rawRoute.handler)
  routes.push(route)
})

const api = new TrestleAPI({ port: 8081, debug: false })
if (process.env.ssl_key && process.env.ssl_cert) {
  const key = fs.readFileSync(process.env.ssl_key).toString()
  const cert = fs.readFileSync(process.env.ssl_cert).toString()

  api.setSSL(key, cert)
} else throw new Error('SSL Creds missing, dumb nuts')

routes.forEach(route => {
  api.addRoute(route)
})

api.init()