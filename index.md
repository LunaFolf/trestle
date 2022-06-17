# Trestle [![NPM Version](https://img.shields.io/npm/v/@whiskeedev/trestle.svg?style=flat-square)](https://www.npmjs.com/package/@whiskeedev/trestle)
Trestle is a Node.js REST API Package, based on Laravel/Lumen, built using my personal developer preferences.

If you don't like how things are built, feel free to suggest changes. Everything is made to my personal preferences, but I welcome improvements and discussions of best practices.

---

## **Version 2.0.0 is here!**
Version 2.0.0 introduces a new, non-backwards compatible feature: API Spec compilation!

This was a personal feature that I've wanted for a long while now, and I can confirm in my testing it is _so_ nice to have this feature!

The spec generated is, or at least _should be_, OpenAPI 3.0.0 compliant and works with most API clients such as Insomnia and Postman.

The fields available at the moment are rather basic, but should be enough to quickly set up dev/debugging environments.

\***Additional fields will be available in future updates**.

In addition to the new spec feature, a number of configuration values/variables have been moved to the constructor of `TrestleAPI`.

For example, `secureMode` is no longer accessible via `TrestleAPI.secureMode` and should be instead passed as a optional value in the config object during decleration. For example:
```javascript
// Create a new TrestleAPI instance
const api = new TrestleAPI({ port: process.env.API_PORT })
api.secureMode = false
```
is now done via the following:
```javascript
// Create a new TrestleAPI instance
const api = new TrestleAPI({ port: process.env.API_PORT, secureMode: false })
```
---

## Coming Soon™
Some features are still in development, or even still being thought out. It may be a while before they're added, or it could be tomorrow. Once I'm a bit more neatened out, I'll create a trello or something for people to follow along.

- [x] Main TrestleAPI component for handling... well, everything.
- [x] TrestleRoute Class.
- [ ] TrestleRouter component, for a more streamlined approach of managing routes.
- [ ] TrestleDB - [sequelize](https://www.npmjs.com/package/sequelize).
- [ ] TrestleAuth - JWT, Password Encryption, the usual jazz.
- [ ] Middleware and Transformer - Still figuring this one out.

Track progress on [the Trello board](https://trello.com/b/ANKeEOV8/trestle).

---

## Usage
requiring, configuring and initiating your API.

This basic example is the quickest way to set things up, but runs in insecure mode (no SSL). You can find more information further in the readme.
```javascript
const { TrestleAPI } = require('@whiskeedev/trestle')

// Create a new TrestleAPI instance
const api = new TrestleAPI({ port: 8081, secureMode: false })

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
  summary: 'Simple Hello World route', // Summary for spec generation, required if specStrict is true
  description: 'A quick example route to test my API works!', // Description for spec, optional
  responses: null, // Responses for spec, defaults to a generic 200 success - See Swagger/OpenAPI for more information.
  tags: ['example'], // Tags for spec, helps categories/organise your paths/operations, depending on software.
  async handler ({ response }) {
    console.log('Hello! My route was hit!')

    response.json({
      testing: "hello world!"
    })
  }
}

// Create a TrestleRoute from this object.
const exampleRoute = new TrestleRoute(exampleRouteObj.path, exampleRouteObj.options, {
  summary: exampleRouteObj.summary,
  description: exampleRouteObj.description,
  responses: exampleRouteObj.responses,
  tags: exampleRouteObj.tags
})
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

const api = new TrestleAPI({ port: 8081, secureMode })

if (secureMode && (process.env.SSL_KEY && process.env.SSL_CERT)) {
  const key = fs.readFileSync(process.env.SSL_KEY).toString()
  const cert = fs.readFileSync(process.env.SSL_CERT).toString()

  api.setSSL(key, cert)
} else if (secureMode) throw new Error('SSL Creds missing')

api.init()
```
---

## Additional values

Additional values are available when declaring your `TrestleAPI` class. Here's an example:
```javascript
// Create a new TrestleAPI instance
const api = new TrestleAPI({
  port: process.env.API_PORT,
  specStrict: true, // Enforces strict spec compliance, and will refuse to start if non-compliant.
  secureMode: false,
  appName: 'Trestle Proto API', // App Name for the spec (default: Trestle API)
  appVersion: pjson.version, // App version, not to be mistaken with the framework version (default: 1.0.0)
  appDescription: pjson.description // App description, undefined by default.
})
```