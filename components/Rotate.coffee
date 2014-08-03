noflo = require 'noflo'
Color = require 'color'

exports.getComponent = ->
  c = new noflo.Component
  c.icon = 'tint'
  c.description = 'Rotate the hue a given amount, from -360 to 360.'
  c.color = null
  c.degree = null
  c.inPorts.add 'color',
    datatype: 'string'
    process: (event, payload) ->
      return unless event is 'data'
      # Always tries to convert an RGB/HSL string to a colorjs object
      c.color = Color payload
      c.compute()

  c.inPorts.add 'degree',
    datatype: 'number'
    process: (event, payload) ->
      return unless event is 'data'
      c.degree = payload
      c.compute()

  # Add output ports
  c.outPorts.add 'color',
    datatype: 'string'

  c.compute = ->
    return unless c.outPorts.color.isAttached()
    return unless c.color and c.degree
    new_color = c.color.rotate c.degree
    c.outPorts.color.send new_color

  # Finally return the component instance
  c
