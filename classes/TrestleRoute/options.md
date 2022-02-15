# TrestleRoute (Class)

The TrestleRoute Class is used to define a useable route, with helpers, for the TrestleAPI.
It also provides events which clients can act upon.

## construction `(path, options)`

- `path` [String] the URL path after the host.
- `options` [Object {method, public}]
  - `method` [String] a HTTP method type. Defaults to 'GET'.
  - `public` [Boolean] Whether the route should be public. Not used by TrestleAPI but
  useful if you are defining middleware via `beforeRoute` function(s).
## methods

### handle `(data)`
Triggers the event emitter for `route_match`, sending the provided `data` argument.

## options

- `path` [String] the URL path after the host.
- `method` [String] a HTTP method type. Defaults to 'GET'.
- `public` [Boolean] Whether the route should be public. Not used by TrestleAPI but
  useful if you are defining middleware via `beforeRoute` function(s).

## Events

### route_match `(data)`
Triggered when a incoming request from the HTTP/HTTPS server matches a route. TrestleAPI then passes a data object, usually consisting of a helper `reponse` object amongst other data related to the request.