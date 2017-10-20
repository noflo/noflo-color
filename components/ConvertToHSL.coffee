noflo = require 'noflo'
Color = require 'color'

toHSL = (old_color) ->
  color = new Color old_color
  return color.hsl().string()
exports.getComponent = ->
  c = new noflo.Component
  c.description = 'Converts a given color to HSL.'
  c.icon = 'tint'
  c.inPorts.add 'color',
    datatype: 'array'
    description: 'color(s) to convert'
  c.outPorts.add 'color',
    datatype: 'array'
  c.process (input, output) ->
    return unless input.hasData 'color'
    data = input.getData 'color'
    if Array.isArray data
      result = data.map toHSL
    else
      result = toHSL data
    output.sendDone
