const https = require('https')
const { getPositiveFlavour } = require('./../../utils/flavourText')
const url = require('url')
const { TrestleRoute } = require('../TrestleRoute')

const titleCard = '[TestleAPI]'.yellow

console.log(titleCard, 'API Created,', getPositiveFlavour())

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

function handleJsonResponse(response, json, options) {
  const statusCode = options?.statusCode || 200
  response.writeHead(statusCode, { 'Content-Type': 'application/json' })

  let status = 'success'
  let data = json || null
  let message = options?.message || null

  switch (statusCode.toString().charAt(0)) {
    case '4':
      status = 'fail'
    case '5':
      status = 'error'
  }

  let responseObj = { status, data }
  if (status !== 'success') responseObj.message = message

  response.write(JSON.stringify(responseObj, null, 2))
}

let beforeEachRouteFncs = []

class TrestleAPI {
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
    if (!(route instanceof TrestleRoute)) {
      console.log(titleCard, "Provided route must be an instance of class 'TrestleRoute'.".red)
      return false
    }

    console.log(titleCard, 'Added new route', `${route.public ? 'Public' : 'Private'}`.yellow ,`[${route.method}] ${route.path}`.cyan)

    this.routes.push(route)
  }

  beforeEachRoute(callback) {
    if (!callback) {
      console.log(titleCard, 'callback in beforeEachRoute must be type of function.'.red)
      return false
    }

    beforeEachRouteFncs.push(callback)
  }

  setSSL(key, cert) {
    if (!key || !cert) throw new Error('Both SSL Key and Cert are required when defining SSL')
    console.log(titleCard, 'SSL Cert and Key OK, saving options now.')
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
    console.log(titleCard, `Port: ${this.port}`.cyan , 'Creating HTTPS Server...')
    return https.createServer(this.options, async function (request, response) {
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

            if (this.debug) console.log(titleCard, sourceIp, `[${method}] ${q.pathname}`.yellow)
            return
          }

          const jsonBodyData = getJsonDataFromRequestBody(requestBody, { contentType: request.headers['content-type'] })
          const matchedRoute = self.matchRoute(q.pathname, method)

          let passBody = {...jsonBodyData}

          // Handle beforeEach Route
          if (beforeEachRouteFncs.length) {
            beforeEachRouteFncs.forEach(callback => {
              const { resolve, data } = callback()
              if (!resolve) {
                response.writeHead(404, { 'Content-Type': 'application/json' })
                response.write(convertToJsonString({
                  status: 'error',
                  message: 'resolve failure in beforeEachRoute'
                }))
                response.end()

                console.log(titleCard, sourceIp, `Resolve Failure: [${method}] ${q.pathname}`.red)
                return false
              }

              if (data) passBody.resolveData = data
            })
          }

          if (!matchedRoute || !matchedRoute.route) {
            response.writeHead(404, { 'Content-Type': 'application/json' })
            response.write(convertToJsonString({
              status: 'error',
              message: 'Route not found'
            }))
            response.end()

            console.log(titleCard, sourceIp, `Unknown Route: [${method}] ${q.pathname}`.red)
            return false
          }

          const { route, params } = matchedRoute
          if (route.public === undefined) route.public = false

          console.log(titleCard, sourceIp, `[${method}] ${q.pathname}`)

          await route.handle({
            request: request,
            response: {
              _: response,
              json: (json, options) => handleJsonResponse(response, json, options),
              error: (statusCode, options) => handleJsonResponse(response, options?.data, { statusCode, ...options})
            },
            bodyData: passBody,
            params
          })

          response.end()
          return true
        })
    }).listen(this.port)
  }
}

module.exports = { TrestleAPI }