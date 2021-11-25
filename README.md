# Trestle
Trestle is a Node.js REST API Framework, based on Laravel/Lumen, built using my personal developer preferences.

If you don't like how things are built, feel free to suggest changes. Everything is made to my personal preferences, but I welcome improvements and discussions of best practices.

---

Trestle's original code was built into one of my projects, JaxBot. Recently given the size of API code and the fact I wanted to start reusing it for other projects, I chose to extract the base functionality into its own package.

The main focus, to begin with, is to build a functional and easy to use REST API. After that, other quality of life features that are expected of a framework will be implemented.

---

Because nearly all my experience is around using Vue.js, Laravel and other similarly related frameworks, you may notice similarities between Trestle's code/functionality and these frameworks when compared.

## Quick Warning
**Trestle is still currently in early access/beta, and will probably stay that way till I've had it in a couple of different projects and I'm happy with how it functions.**

Until the first 1.0.0 version releases, I can't guarantee this package will work for you, help you, or be helpful in anyway.

## Quick setup guide
writing setup guides is not my strong suite, so bear with me on this.

You can install the package using npm like so:
```
npm install @whiskeedev/trestle
```
Once installed, you can reference the API class by doing:
```javascript
// WARNING: This class name will most likely change before the official release - please keep an eye on this guide.
const { TrestleAPI } = require('@whiskeedev/trestle')
```

Once you've gotten your class, you can start setting up the server. There are a few options currently available, below is an example for setting up a basic server:
```javascript
// create the server class, using port 8081 for listening
const api = new TrestleAPI({ port: 8081 })

// define the SSL key and cert (at this moment in time, HTTPS is only available and SSL details ARE required)
const key = fs.readFileSync(process.env.ssl_key).toString()
const cert = fs.readFileSync(process.env.ssl_cert).toString()
api.setSSL(key, cert)

// Start the server
api.init()
```

_Whiskee, put a table here later with the options available for the server ~past whiskee_

Congratulations! You have a server set up! Wasn't that _so_ easy?

But wait, I hear you say, what about my routes? How do I define them?

To create a route, use the `Route` class like so:
```javascript
// WARNING: This class name will most likely change before the official release - please keep an eye on this guide.
const { TrestleRoute } = require('@whiskeedev/trestle')

const route = new TrestleRoute('my/https/path', {
  method: 'GET', // defaults to 'GET' - should accept any method other than 'OPTIONS' (only 'GET' and 'POST' have been tested as of right now)
  public: true // defaults to false - doesn't change anything functionaly at the moment but in the future this can be used to bypass middleware.
})

route.on('route_match', (data) => {
  // Handle what should happen when the route is succesfully matched.
  /**
   * The data object contains the following properties:
   * request - the original raw request from the https server
   * response - the response, use this to return data to the requester.
   * bodyData - a formatted version of the bodyData that was submitted, hopefully in JSON.
   * params - if you're route path contained a param (i.e. /user/:id) the value will be stored with the key used in the path.
   */
})
```
Kinda simple, kinda messy - I promise once we're out of abstraction and moving closer to actual 1.0.0 launch this will be much easier and cleaned up.

Now all you have to do, is add the route to your server. You can do this before or after starting it, just do:
```javascript
api.addRoute(route)
```

And viola - hopefully that worked... hopefully...

### Useful information
We use the (**JSend** specification)[https://github.com/omniti-labs/jsend], or at least _should_ be using it, for our API resonses. At the moment there is no way to overwrite this spec.

## Support
I'm not really in a position to offer active support, especially seeing how this package is still in beta - however, if you're up for a quick informal chat then I might be able to help if you contact me via Discord.

My tag is: WhiskeeDev#0001