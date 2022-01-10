const { getPositiveFlavour } = require('./../../utils/flavourText')
const url = require('url')
const { TrestleRoute } = require('../TrestleRoute')

const titleCard = '[TrestleAPI]'.yellow

console.log(titleCard, 'API Created,', getPositiveFlavour())

const convertToJsonString = (json) => JSON.stringify(json, null, 2)

function getJsonDataFromRequestBody(requestBody, { contentType }) {
  requestBody = Buffer.concat(requestBody)?.toString() || null
  let jsonData = {}

  if (!requestBody || requestBody.length < 1) {
    console.warn(titleCard, 'No request body found'.bgYellow.black)
    return jsonData
  }

  try {
    if (contentType === 'application/x-www-form-urlencoded') {
      requestBody.split('&').forEach(item => {
        const [key, value] = item.split('=')
        jsonData[key] = decodeURIComponent(value)
      })
    } else if (contentType === 'application/json') {
      jsonData = JSON.parse(requestBody)
    } else {
      console.warn(titleCard, 'Unsupported Content-Type:'.bgYellow.black, contentType)
      jsonData = null
    }
  } catch (err) {
    console.error(titleCard, `Error parsing ${contentType} body:`.bgRed, { requestBody, err})
  }

  return jsonData
}

function handleJsonResponse (response, json, options) {
  const statusCode = options?.statusCode || 200
  response.writeHead(statusCode, { 'Content-Type': 'application/json' })

  let status = 'success'
  let data = json || null
  let message = options?.message || null
  let code = options?.code || null

  if (code) message = `[${code}] ${message}`

  if (statusCode >= 500) status = 'error'
  else if (statusCode >= 400) status = 'fail'

  let responseJson = { status, data }
  if (status !== 'success') {
    responseJson.message = message
    responseJson.code = code
  }

  response.write(convertToJsonString(responseJson))
  response.end()
}

let beforeEachRouteFncs = []

class TrestleAPI {
  routes = []
  options = {}
  port = 443
  debug = false
  secureMode = true

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

    let httpProtocol

    if (self.secureMode) httpProtocol = require('https')
    else {
      httpProtocol = require('http')
      console.warn(titleCard, 'WARNING: Running in insecure mode, this is not recommended.'.bgYellow.red)
    }

    console.log(titleCard, `Port: ${this.port}`.cyan , 'Creating Listening Server...')
    return httpProtocol.createServer(this.options, async function (request, response) {
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
            handleJsonResponse(response, null, { statusCode: 200 })

            if (this.debug) console.log(titleCard, sourceIp, `[${method}] ${q.path}`.yellow)
            return
          }

          const jsonBodyData = getJsonDataFromRequestBody(requestBody, { contentType: request.headers['content-type'] })
          const matchedRoute = self.matchRoute(q.pathname, method)

          let passBody = {...jsonBodyData}

          let beforeEachFailedResolve = false

          // Handle beforeEach Route
          if (beforeEachRouteFncs.length) {
            await Promise.all(beforeEachRouteFncs.map(async callback => {
              const { resolve, data, code, message } = await callback(matchedRoute, request)
              if (!resolve) {
                handleJsonResponse(response, null, {
                  statusCode: 500,
                  message: message || 'Resolution Failure',
                  code: code || 'BEFORE_EACH_ROUTE_FAILURE'
                })

                console.log(titleCard, sourceIp, `Resolution Failure: [${method}] ${q.path}`.red)
                return beforeEachFailedResolve = true
              }

              if (data) passBody = {
                ...passBody,
                ...data
              }
            }))
          }

          if (beforeEachFailedResolve) return false

          if (!matchedRoute || !matchedRoute.route) {
            handleJsonResponse(response, null, { statusCode: 404, message: 'Route not found' })

            console.log(titleCard, sourceIp, `Unknown Route: [${method}] ${q.path}`.red)
            return false
          }

          const { route, params } = matchedRoute
          if (route.public === undefined) route.public = false

          console.log(titleCard, sourceIp, `[${method}] ${q.path}`)

          await route.handle({
            request: request,
            response: {
              _: response,
              ok: () => {
                response.writeHead(200, { 'Content-Type': 'application/json' })
                response.end()
              },
              json: (json, options) => handleJsonResponse(response, json, options),
              error: (statusCode, message, options) => handleJsonResponse(response, options?.data, { statusCode, message, ...options})
            },
            bodyData: passBody,
            params,
            query: {...q.query}
          })

          return true
        })
    }).listen(this.port)
  }
}

module.exports = { TrestleAPI }