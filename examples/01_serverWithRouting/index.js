require('dotenv').config()

const { TrestleAPI } = require('../../index.js')
const { TrestleRoute } = require('../../index.js')

// Create a new TrestleAPI instance
const api = new TrestleAPI({ port: 8081 })
api.secureMode = false

const { routes } = require('./routes')

// Add routes to the API
routes.forEach(route => {
  const trestleRoute = new TrestleRoute(route.path, route.options)
  trestleRoute.on('route_match', route.handler)
  api.addRoute(trestleRoute)
})

api.init()