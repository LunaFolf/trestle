require('dotenv').config()

const { TrestleAPI } = require('../../index.js')
const { TrestleRoute } = require('../../index.js')

// Create a new TrestleAPI instance
const api = new TrestleAPI({ port: 8081 })
api.secureMode = false

// Define the details of our route.
const exampleRouteObj = {
  path: '/hello/world',
  options: {
    method: 'GET', // Defaults to 'GET', works with most HTTP methods.
    public: true // Defaults to false. Isn't used by the Framework, but useful when defining beforeRoute functions.
  },
  async handler ({ response }) {
    console.log('Hello! My route was hit!')

    response.json({
      testing: "hello world!"
    })
  }
}

// Create a TrestleRoute from this object.
const exampleRoute = new TrestleRoute(exampleRouteObj.path, exampleRouteObj.options)
exampleRoute.on('route_match', exampleRouteObj.handler)

// Add the newly created route to the API.
api.addRoute(exampleRoute)

api.init()