noflo = require 'noflo'
ArrayableHelper = require 'noflo-helper-arrayable'
Color = require 'color'

class IsLight extends noflo.Component
  description: 'Check if a light color.'
  icon: 'tint'
  constructor: ->
    ports =
      color:
        datatype: 'object'
        description: 'color(s) to check'
        addressable: true
        required: true

    ArrayableHelper @, 'light', ports

  compute: (props) ->
    return unless props.color? and props.color.length>0

    lights = []
    if props.color instanceof Array
      colors = @expandToArray props.color
      for c in colors
        if c instanceof Array
          cc = c[0]
        else
          cc = c
        
        cc = @isLight(cc)
        lights.push(cc)

    if lights.length == 1
      lights = lights[0]

    return lights

  isLight: (a_color) ->
    color = new Color a_color
    return color.light()

exports.getComponent = -> new IsLight
