noflo = require 'noflo'
ArrayableHelper = require 'noflo-helper-arrayable'
Color = require 'color'

class GetContrast extends noflo.Component
  description: 'Get the constrast ratio to a reference color (1 close, 21 far).'
  icon: 'tint'
  constructor: ->
    ports =
      color:
        datatype: 'object'
        description: 'color(s) to get contrast of'
        addressable: true
        required: true
      reference:
        datatype: 'object'
        description: 'a reference color'
        required: true

    ArrayableHelper @, 'contrast', ports

  compute: (props) ->
    return unless props.color? and props.color.length>0 and props.reference?

    contrasts = []
    if props.color instanceof Array
      colors = @expandToArray props.color
      for c in colors
        if c instanceof Array
          cc = c[0]
        else
          cc = c
        
        cc = @getContrast(cc, props)
        contrasts.push(cc)

    if contrasts.length == 1
      contrasts = contrasts[0]

    return contrasts

  getContrast: (a_color, props) ->
    colorA = new Color a_color
    colorB = new Color props.reference
    return colorA.contrast(colorB)

exports.getComponent = -> new GetContrast
