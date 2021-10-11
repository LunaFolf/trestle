const https = require('https')
const url = require('url')
const { WskyRoute } = require('../WskyRoute')

const titleCard = '[WskyRest HTTPS]'

function convertToJsonString (json) {
  return JSON.stringify(json, null, 2)
}

function getJsonDataFromRequestBody(requestBody, { contentType }) {
  requestBody = Buffer.concat(requestBody).toString()

  if (contentType === 'application/x-www-form-urlencoded') {
    let parsedRequestBody = {}
    requestBody.split('&').forEach(param => {
      let splitParam = param.split('=')
      parsedRequestBody[splitParam[0]] = splitParam[1].replace('+', ' ')
    })
    requestBody = JSON.stringify(parsedRequestBody)
  }

  return requestBody ? JSON.parse(requestBody) : null
}

class WskyRestAPI {
  routes = []
  options = {}
  port = 443
  debug = false

  blockedIps = []
  validHosts = []

  constructor({ port, options, debug, blockedIps, validHosts }) {
    if (port) this.port = port
    if (options) this.options = options
    if (blockedIps) this.blockedIps = blockedIps
    if (validHosts) this.validHosts = validHosts
    if (debug !== undefined) this.debug = !!debug
  }

  addRoute(route) {
    if (!route instanceof WskyRoute) throw new Error("Provided route must be an instance of class 'WskyRoute'.")
    this.routes.push(route)
    if (this.debug) console.log('Adding route: ', route)
  }

  setSsl(key, cert) {
    if (!key || !cert) throw new Error('Both SSL Key and Cert are required when defining SSL')
    if (this.debug) console.log('Setting SSL to the following', { key, cert })
    this.options = { key, cert }
  }

  matchRoute (pathName, requestMethod) {
    const routesWithMatchingMethod = this.routes.filter(route => {
      const routeMethod = route.method || 'GET'
      return routeMethod === requestMethod
    })

    if (!routesWithMatchingMethod.length) return false

    const exactMatch = routesWithMatchingMethod.find(route => route.path === pathName)
    if (exactMatch) return { route: exactMatch }

    const splitPath = pathName.slice(1).split('/')
    const routesOfSameLength = routesWithMatchingMethod.filter(route => {
      return splitPath.length === route.path.slice(1).split('/').length
    })
    const routesWithVariables = routesOfSameLength.filter(route => {
      return route.path.includes(':')
    })

    var paramLocations = []

    const route = routesWithVariables.find(route => {
      const splitPathName = route.path.slice(1).split('/')
      var splitMatcherPath = pathName.slice(1).split('/')
      var matcherRoute = '/'
      paramLocations = []
      splitPathName.forEach((block, index) => {
        if (block.startsWith(':')) {
          matcherRoute = matcherRoute + '*'
          splitMatcherPath[index] = '*'

          paramLocations.push({
            index,
            variableName: block.slice(1)
          })
        }
        else matcherRoute = matcherRoute + block
        if (index < splitPathName.length - 1) matcherRoute = matcherRoute + '/'
      })
      const matcherPath = '/' + splitMatcherPath.join('/')

      return matcherPath === matcherRoute
    })

    var params = {}
    if (paramLocations.length) {
      paramLocations.forEach(paramLoc => {
        params[paramLoc.variableName] = splitPath[paramLoc.index]
      })
    }

    return { route, params }
  }

  init() {
    const self = this
    return https.createServer(this.options, async function (request, response) {
      if (self.debug) console.log({ request, response })
      // Check if the host is allowed
      const sourceIp = request.headers['x-forwarded-for'] || request.connection.remoteAddress
      const q = url.parse(request.url, true)
      const method = request.method

      response.setHeader('Access-Control-Allow-Origin', '*')
      response.setHeader('Access-Control-Allow-Headers', 'jax-client-token, authorization, content-type')
      response.setHeader('Access-Control-Allow-Methods', 'GET')
      response.setHeader('Access-Control-Max-Age', -1)

      let requestBody = []

      request
        .on('data', data => requestBody.push(data))
        .on('end', async function () {
          if (q.pathname === '/' || method === 'OPTIONS') {
            response.writeHead(200, { 'Content-Type': 'application/json' })
            response.write(convertToJsonString({
              status: 'success',
              data: null
            }))
            response.end()
            return
          }

          const jsonBodyData = getJsonDataFromRequestBody(requestBody, { contentType: request.headers['content-type'] })
          const matchedRoute = self.matchRoute(q.pathname, method)

          console.log({jsonBodyData, matchedRoute})

          if (!matchedRoute || !matchedRoute.route) {
            response.writeHead(404, { 'Content-Type': 'application/json' })
            response.write(convertToJsonString({
              status: 'error',
              message: 'Route not found'
            }))
            response.end()
            return false
          }

          const { route, params } = matchedRoute
          if (route.public === undefined) route.public = false

          response.writeHead(200, { 'Content-Type': 'application/json' })
          await route.handle({
            request: request,
            response: response,
            bodyData: jsonBodyData,
            params
          })

          response.end()
        })
    }).listen(this.port)
  }
}

module.exports = { WskyRestAPI }