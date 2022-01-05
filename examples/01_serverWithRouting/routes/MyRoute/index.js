module.exports = [
  {
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
  },
  {
    path: '/push/test',
    options: {
      method: 'POST',
      public: false
    },
    async handler ({ response, bodyData }) {
      console.log('we\'ve got POST!', bodyData)

      response.json({
        returnToSender: bodyData
      })
    }
  }
]