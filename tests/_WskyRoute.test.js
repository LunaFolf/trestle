const { WskyRoute } = require('../classes/WskyRoute')

test('Created route contains required fields', () => {
  const route = new WskyRoute('/test/route')

  expect(route).toMatchObject({
    path: '/test/route',
    method: 'GET',
    public: false
  })
})

test('Route emits appropriate event upon receiving handle data', () => {
  const route = new WskyRoute('/test/route')
  let dummyMessage = null

  const sendData = {
    data: 'Hello, world'
  }

  route.on('route_match', data => dummyMessage = data)
  route.handle(sendData)

  expect(dummyMessage).toMatchObject(sendData)
})

test('Can create route with additional options', () => {
  const route = new WskyRoute('/shiny/metal/ass', {
    method: 'POST',
    public: true
  })

  expect(route).toMatchObject({
    path: '/shiny/metal/ass',
    method: 'POST',
    public: true
  })
})