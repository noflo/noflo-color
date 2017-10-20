noflo = require 'noflo'
Color = require 'color'

toRGB = (old_color) ->
  color = new Color old_color
  return color.rgb().string()

exports.getComponent = ->
  c = new noflo.Component
  c.description = 'Converts a given color to RGB.'
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
      result = data.map toRGB
    else
      result = toRGB data
    output.sendDone
      color: result
