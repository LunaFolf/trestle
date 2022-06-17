const EventEmitter = require('node:events')

class TrestleRoute extends EventEmitter {
  path = undefined
  method = 'GET'
  public = false

  // Required variables for creating openAPI Path spec
  summary = undefined
  description = undefined
  responses = { 200: { description: 'Success' } }
  tags = []

  constructor(path, options, pathSpec) {
    super()
    if (!path) throw new Error("TrestleRoute 'path' field is a required parameter.")
    this.path = path
    if (options) {
      this.method = options.method || 'GET'
      this.public = options.public == undefined ? false : options.public
    }

    if (pathSpec) {
      const { summary, description, responses, tags } = pathSpec

      if (summary) this.setSummary(summary)
      if (description) this.setDescription(description)
      if (responses) this.setResponses(responses)
      if (tags) this.setTags(tags)
    }
  }

  setSummary (summary) {
    this.summary = summary
  }

  setDescription (description) {
    this.description = description
  }

  setResponses (responses) {
    this.responses = responses
  }

  setTags (tags) {
    this.tags = tags
  }

  isSpecCompatible () {
    const summaryIsDefined = this.summary != undefined
    const responsesAreDefined = Object.keys(this.responses).length > 0

    const isValid = summaryIsDefined && responsesAreDefined

    if (!isValid) console.error(this.method, this.path, 'is not spec compatible: ', {
      summaryIsDefined,
      responsesAreDefined
    })

    return isValid
  }

  handle (data) {
    this.emit('route_match', data)
  }
}

module.exports = { TrestleRoute }