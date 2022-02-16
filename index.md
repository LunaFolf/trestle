# Trestle [![NPM Version](https://img.shields.io/npm/v/@whiskeedev/trestle.svg?style=flat-square)](https://www.npmjs.com/package/@whiskeedev/trestle)
Trestle is a Node.js REST API Package, based on Laravel/Lumen, built using my personal developer preferences.

If you don't like how things are built, feel free to suggest changes. Everything is made to my personal preferences, but I welcome improvements and discussions of best practices.

For more in depth and accurate information, check out the [README on the npm page](https://www.npmjs.com/package/@whiskeedev/trestle).

---

## Coming Soon™
Some features are still in development, or even still being thought out. It may be a while before they're added, or it could be tomorrow. Once I'm a bit more neatened out, I'll create a trello or something for people to follow along.

- [x] Main TrestleAPI component for handling... well, everything.
- [x] TrestleRoute Class.
- [ ] TrestleRouter component, for a more streamlined approach of managing routes.
- [ ] TrestleDB - utilise [sequelize](https://www.npmjs.com/package/sequelize) to handle DB init, creating models, optional automatic routes and route resources.
- [ ] TrestleAuth - JWT, Password Encryption, the usual jazz.
- [ ] Middleware and Transformer - Still not figured out how I want to approach this yet, but I definitely want the functionality. 

---

## Usage
requiring, configuring and initiating your API.

This basic example is the quickest way to set things up, but runs in insecure mode (no SSL). You can find more information further in the readme.
```javascript
const { TrestleAPI } = require('@whiskeedev/trestle')

// Create a new TrestleAPI instance
const api = new TrestleAPI({ port: 8081 })
api.secureMode = false // Without SSL Credentials, Trestle API can only be used in insecure mode.

// Start the API
api.init()
```

For more details on `TrestleAPI`, check the [options readme](/classes/TrestleAPI/options.md).

Congratulations! You now have a running http server! However, you currently have no routes... let's change that!

> We recommend adding your routes before you `api.init()`, however, Trestle is designed so that routes can be added during runtime - It's just easier if your routes are ready to go before you start listening for requests!

Here's the basics to create a new TrestleRoute, and adding it to your API.
```javascript
const { TrestleRoute } = require('@whiskeedev/trestle')

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
```

And there we go! A functioning API! The example shown above is just one method of creating and adding your Routes.

Another method, which I personally use, is to [define your routes in arrays, in seperate files](/examples/01_serverWithRouting). Then, dynamically search the directory,
require them, add them to one array and then iterate over that array to create the routes and add them to the API.

For more details on `TrestleRoute`, check the [options readme](/classes/TrestleRoute/options.md).

---

## Secure Mode (SSL)

To use SSL Secure mode, you'll need to be able to provide a SSL Key and a SSL Certificate.
I highly recommend, if you're not already, using a package such as [dotenv](https://www.npmjs.com/package/dotenv) and defining your file paths that way. Here is a quick example:
```javascript
require('dotenv').config()
const { TrestleAPI } = require('@whiskeedev/trestle')
const fs = require('fs')

// Create a new TrestleAPI instance
const secureMode = true

const api = new TrestleAPI({ port: 8081 })
api.secureMode = secureMode

if (secureMode && (process.env.SSL_KEY && process.env.SSL_CERT)) {
  const key = fs.readFileSync(process.env.SSL_KEY).toString()
  const cert = fs.readFileSync(process.env.SSL_CERT).toString()

  api.setSSL(key, cert)
} else if (secureMode) throw new Error('SSL Creds missing')

api.init()
```