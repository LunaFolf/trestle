const { getPositiveFlavour } = require('./../../utils/flavourText')
const url = require('url')
const { TrestleRoute } = require('../TrestleRoute')
const YAML = require('yaml')

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

const beforeEachRouteFncs = []

class TrestleAPI {
  // Storage based variables
  _routes = []
  _options = {}
  _blockedIps = []
  _validHosts = []

  // Important settings, like super duper important... I promise
  _port = 443 // default port, requires secureMode to be true typically.
  _secureMode = true // should SSL be used?
  _debug = false // Should Trestle print debug info? (not properly implemented yet)
  _specStrict = false // API should be OpenAPI 3.0.0 compliant? If true, the API will throw an error if non-compliant and refuse to start.

  // Other configuration based settings
  _appName = 'TrestleAPI'
  _appDescription = undefined
  _appVersion = '1.0.0' // Not to be confused with the version number of the Framework

  constructor({ port, options, debug, blockedIps, validHosts, secureMode, specStrict, appName, appDescription, appVersion }) {
    if (port) this._port = port
    if (options) this._options = options
    if (blockedIps) this._blockedIps = blockedIps
    if (validHosts) this._validHosts = validHosts

    if (appName) this._appName = appName
    if (appDescription) this._appDescription = appDescription
    if (appVersion) this._appVersion = appVersion

    if (debug !== undefined) this._debug = !!debug
    if (secureMode !== undefined) this._secureMode = !!secureMode
    if (specStrict !== undefined) this._specStrict = !!specStrict
  }

  addRoute(route) {
    if (!(route instanceof TrestleRoute)) {
      console.log(titleCard, "Provided route must be an instance of class 'TrestleRoute'.".red)
      return false
    }

    console.log(titleCard, 'Added new route', `${route.public ? 'Public' : 'Private'}`.yellow ,`[${route.method}] ${route.path}`.cyan)

    this._routes.push(route)
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
    this._options = { key, cert }
  }

  // Return a YAML spec for the API, compatible with OpenAPI 3.0.0
  getSpec(format = 'yaml') {
    if (this._specStrict) {
      const invalidRoute = this._routes.find(route => !route.isSpecCompatible())
      if (invalidRoute) {
        throw new Error(`API is not OpenAPI 3.0.0 compliant. Fix the following route or set specStrict to false: [${invalidRoute.method}] ${invalidRoute.path}`)
      }
    }

    const spec = {
      openapi: '3.0.0',
      info: {
        title: this._appName,
        version: this._appVersion
      },
      servers: [{
        url: `http${this._secureMode ? 's' : ''}://${url.parse(`http://${this._options.hostname || 'localhost'}:${this._port}`).host}`
      }],
      paths: {}
    }

    if (this._appDescription) spec.info.description = this._appDescription

    this._routes.forEach(route => {
      const { path, method, summary, description, responses, tags } = route

      spec.paths[path] = {
        [String(method).toLowerCase()]: {
          summary,
          description,
          responses,
          tags : tags.length ? tags : undefined
        }
      }
    })

    if (format === 'json') return spec

    const openapiSpec = new YAML.Document()
    openapiSpec.contents = spec

    return openapiSpec.toString()
  }

  matchRoute (pathName, requestMethod) {
    const routesWithMatchingMethod = this._routes.filter(route => {
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

    if (this._debug) {
      console.debug({
        routesWithMatchingMethod,
        paramLocations,
        res: { route, params }
      })
    }

    return { route, params }
  }

  init() {
    const self = this // TODO: Check if this is still necessary

    let httpProtocol

    if (this._secureMode) httpProtocol = require('https')
    else {
      httpProtocol = require('http')
      console.warn(titleCard, 'WARNING: Running in insecure mode, this is not recommended.'.bgYellow.red)
    }

    console.log(titleCard, `Port: ${this._port}`.cyan , 'Creating Listening Server...')
    return httpProtocol.createServer(this._options, async function (request, response) {
      const responseFncs = getResHelpers(response)

      const sourceIp = request.headers['x-forwarded-for'] || request.connection.remoteAddress
      const q = url.parse(request.url, true)
      const method = request.method

      // Check if the host is allowed
      if (self._validHosts.length > 0) {
        const host = request.headers.host || 'NO HOST'
        if (!self._validHosts.includes(host)) {
          console.error(titleCard, `Blocked request from ${sourceIp} for invalid host ${host}`.bgRed)
          responseFncs.error(403, 'Invalid Host')
          return
        }
      }

      // Check if the IP is allowed
      if (self._blockedIps.length > 0) {
        if (self._blockedIps.includes(sourceIp)) {
          console.error(titleCard, `Blocked request from ${sourceIp} for blocked IP`.bgRed)
          responseFncs.error(403, 'Blocked IP')
          return
        }
      }

      response.setHeader('Access-Control-Allow-Origin', '*')
      response.setHeader('Access-Control-Allow-Headers', 'jax-client-token, authorization, content-type')
      response.setHeader('Access-Control-Allow-Methods', 'GET')
      response.setHeader('Access-Control-Max-Age', -1)

      let requestBody = []

      request
        .on('data', data => requestBody.push(data))
        .on('end', async function () {
          if (method === 'OPTIONS') return handlePreflight(response, { path: q.path, sourceIp, method })

          const jsonBodyData = (!requestBody || requestBody.length < 1) ? {} :
            getJsonDataFromRequestBody(requestBody, { contentType: request.headers['content-type'] })
          const matchedRoute = self.matchRoute(q.pathname, method)

          let passBody = {...jsonBodyData}

          let beforeEachFailedResolve = false

          // Handle beforeEach Route
          if (beforeEachRouteFncs.length) {
            await Promise.all(beforeEachRouteFncs.map(async callback => {
              let { resolve, data, code, message } = await callback(matchedRoute, request)
              code = code || 'BEFORE_EACH_ROUTE_FAILURE'
              message = message || 'Resolution Failure'
              if (!resolve) {
                handleJsonResponse(response, null, {
                  statusCode: 500,
                  message: message || 'Resolution Failure',
                  code: code || 'BEFORE_EACH_ROUTE_FAILURE'
                })

                console.log(titleCard, sourceIp, `[${code.red}]`.bgBlack, `${message}:`, `[${method}] ${q.path}`.red)
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
            if (['/', '/favicon.ico'].includes(q.pathname)) return handlePreflight(response, { path: q.path, sourceIp, method })
            handleJsonResponse(response, null, { statusCode: 404, message: 'Route not found' })

            console.log(titleCard, sourceIp, `Unknown Route: [${method}] ${q.path}`.red)
            return false
          }

          const { route, params } = matchedRoute
          if (route.public === undefined) route.public = false

          console.log(titleCard, sourceIp, `[${method}] ${q.path}`)

          if (this._debug) {
            console.debug({
              responseFncs,
              passBody,
              params,
              query: {...q.query}
            })
          }

          await route.handle({
            request: request,
            response: {
              _: response,
              ...responseFncs
            },
            bodyData: passBody,
            params,
            query: {...q.query}
          })

          return true
        })
    }).listen(this._port)
  }
}

function handlePreflight(response, { path, sourceIp, method }) {
  handleJsonResponse(response, null, { statusCode: 200 })

  if (TrestleAPI._debug) console.debug(titleCard, sourceIp, `[${method}] ${path}`.yellow)
  return
}

function getResHelpers (response) {
  const methods = {
    ok: () => {
      response.writeHead(200, { 'Content-Type': 'application/json' })
      response.end()
    },
    text: (text) => {
      response.writeHead(200, { 'Content-Type': 'text/plain' })
      response.write(text)
      response.end()
    },
    json: (json, options) => handleJsonResponse(response, json, options),
    redirect: (url) => {
      console.log(titleCard, 'Redirecting to:'.bgYellow.red, url)
      response.writeHead(302, { Location: url })
      response.end()
    },
    error: (statusCode, message, options) => handleJsonResponse(response, options?.data, { statusCode, message, ...options })
  }

  return methods
}

module.exports = { TrestleAPI }