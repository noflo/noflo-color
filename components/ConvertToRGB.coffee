noflo = require 'noflo'
{Arrayable} = require '../lib/Arrayable'
Color = require 'color'

class ConvertToRGB extends Arrayable
  description: 'Converts a given color to RGB.'
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
    return unless @props.color? and @props.color.length>0
    transform = @props

    if @props.color instanceof Array
      transform = @expandToArray @props
      transform = transform.map @toRGB
    else
      transform = @toRGB @props

    # We don't want commands, just color strings
    if transform instanceof Array
      colors = (t.color for t in transform)
    else
      colors = transform.color

    @outPorts.color.send colors

  toRGB: (props) ->
    console.log props.color
    color = new Color props.color
    console.log color
    props.color = color.rgbString()
    return props

exports.getComponent = -> new ConvertToRGB