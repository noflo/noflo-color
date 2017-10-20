noflo = require 'noflo'
ArrayableHelper = require 'noflo-helper-arrayable'
Color = require 'color'

class Mix extends noflo.Component
  description: 'Mix the given colors with a reference color.'
  icon: 'tint'
  constructor: ->
    ports =
      color:
        datatype: 'object'
        description: 'color(s) to mix'
        addressable: true
        required: true
      reference:
        datatype: 'object'
        description: 'a reference color'
        required: true
      weight:
        datatype: 'number'
        description: 'weight (0 first, 1 second)'
        required: false

    ArrayableHelper @, 'color', ports

  compute: (props) ->
    return unless props.color? and props.color.length>0 and props.reference?

    new_colors = []
    if props.color instanceof Array
      colors = @expandToArray props.color
      for c in colors
        if c instanceof Array
          cc = c[0]
        else
          cc = c
        
        cc = @mix(cc, props)
        new_colors.push(cc)

    if new_colors.length == 1
      new_colors = new_colors[0]

    return new_colors

  mix: (a_color, props) ->
    colorA = new Color a_color
    colorB = new Color props.reference
    return colorA.mix(colorB, props.weight).hsl().string()

exports.getComponent = -> new Mix
