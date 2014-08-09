noflo = require 'noflo'
{Arrayable} = require '../lib/Arrayable'
Color = require 'color'

class ConvertToHSL extends Arrayable
  description: 'Converts a given color to HSL.'
  icon: 'tint'
  constructor: ->
    ports =
      color:
        datatype: 'object'
        description: 'color to convert'
        addressable: true
        required: true

    super 'color', ports

  compute: ->
    return unless @outPorts.color.isAttached()
    return unless @props.color?
    transform = @props

    if (@props.color instanceof Array)
      transform = @expandToArray @props.color
      transform = transform.map @toHSL
    else
      transform = @toHSL @props.color

    @outPorts.transform.send transform

  toHSL: (data) ->
    color = new Color data
    return color.hslString()

exports.getComponent = -> new ConvertToHSL