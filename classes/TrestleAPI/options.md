# TrestleAPI (Class)

The TrestleAPI Class is used to define the necessary configuration and initalise a HTTP, or HTTPS, listen server.

## construction `({ port, options, debug, blockedIps, validHosts, secureMode, specStrict, appName, appDescription, appVersion })`

- `port` [Number/String] Port that the http/https server will listen on.
- `options` [Object] object passed to the first argument of `createServer` when creating the listener.
- `debug` [Boolean] enables additional logging from TrestleAPI (verbose).
- `blockedIps` [Array] Not currently in use, will later be used to filter and ban incoming requests.
- `validHosts` [Array] Not currently in use, will later be used to filter and ban incoming requests.
- `secureMode` [Boolean] Should SSL mode be used?
- `specStrict` [Boolean] If true, the app will throw an error and refuse to start if any path/route is not OpenAPI 3.0.0 compliant.
- `appName` [String] Name of the App, used for the Spec.
- `appDescription` [String] Description of the App, used for the Spec.
- `appVersion` [String] Version of the App, used for the Spec.

## methods

### addRoute `(route)`
Add provided route to the routes array for the API.

- `route` [TrestleRoute]

### beforeEachRoute `(callback)`
Define callback method to run for _every_ route. See below for available arguments.

- `callback` [Function (matchedRoute, request)]
  - `matchedRoute` is a object consisting of `route` [TrestleRoute].
  - `params` [Object] which is the parameters defined with `:`, for example a path of
  `/users/:id` which was hit as `users/32` would have a `params` object containing a key of `id` with the value of `32`.

### setSSL `(key, cert)`
Define SSL Credentials for using API in secure mode.

- `key` [String]
- `cert` [String]

### init `()`
Create the listen server