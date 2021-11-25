const { TrestleAPI, TrestleRoute } = require('../index')
const fetch = require('node-fetch')
const fs = require('fs')
const https = require('https')

require('dotenv').config()

let api = null

const requestJson = { "boom": "baby!" }
const responseJson = { "status": "success", "data": requestJson }

const rawRoutes = [
  {
    path: '/testing/hello',
    method: 'GET',
    public: true,
    handler ({ response, bodyData }) {
      let jsonResponse = { ...requestJson}
      if (bodyData.resolveData) jsonResponse = bodyData.resolveData

      response.json(jsonResponse)
    }
  }
]

const routes = []

rawRoutes.forEach(rawRoute => {
  const route = new TrestleRoute(rawRoute.path, { method: rawRoute.method, public: rawRoute.public })
  route.on('route_match', rawRoute.handler)

  routes.push(route)
})

test('Can create API with no errors', () => {
  api = new TrestleAPI({ port: 8081 })
  if (process.env.ssl_key && process.env.ssl_cert) {
    const key = fs.readFileSync(process.env.ssl_key).toString()
    const cert = fs.readFileSync(process.env.ssl_cert).toString()

    api.setSSL(key, cert)
  } else throw new Error('SSL Creds missing, dumb nuts')

  expect(api).toMatchObject({
    routes: [],
    options: {},
    port: 8081,
    debug: false,
    blockedIps: [],
    validHosts: []
  })
})

test('Can add route(s) to the API', () => {
  routes.forEach(route => {
    api.addRoute(route)
  })

  expect(api.routes).toHaveLength(routes.length)
})

test('Can match routes correctly', () => {
  const matchedRoute = api.matchRoute(rawRoutes[0].path, rawRoutes[0].method)

  expect(matchedRoute.route).toEqual(
    expect.objectContaining({
      path: rawRoutes[0].path,
      method: rawRoutes[0].method,
      public: rawRoutes[0].public
    })
  )
})

test('Can initialise server and receive something back', () => {
  const server = api.init()
  expect(server).not.toBeNull()
  server.close()
})

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
})

test('Can initialise server and trigger route handler', async () => {
  const server = await api.init()
  const serverResponse = await fetch('https://localhost:8081' + rawRoutes[0].path, {
    agent: httpsAgent
  }).then(async res => {
    return res.json().then(json => {
      return res.ok ? json : false
    })
  })
  
  expect(serverResponse).toEqual(
    expect.objectContaining(responseJson)
  )
  server.close()
})

test('Can add preRoute on all routes', async () => {
  const resolveData = { 'hello': 'world!' }
  api.beforeEachRoute((to, request) => {
    return {
      resolve: true,
      data: resolveData
    }
  })

  const server = await api.init()

  // test response here
  const serverResponse = await fetch('https://localhost:8081' + rawRoutes[0].path, {
    agent: httpsAgent
  }).then(async res => {
    return res.json().then(json => {
      return res.ok ? json : false
    })
  })

  expect(serverResponse).toEqual(
    expect.objectContaining({
      status: 'success',
      data: resolveData
    })
  )

  server.close()
})