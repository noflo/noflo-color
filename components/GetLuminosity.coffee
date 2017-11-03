noflo = require 'noflo'
ArrayableHelper = require 'noflo-helper-arrayable'
Color = require 'color'

class GetLuminosity extends noflo.Component
  description: 'Get the relative luminosity of a given color.'
  icon: 'tint'
  constructor: ->
    super()
    ports =
      color:
        datatype: 'object'
        description: 'color(s) to get luminosity of'
        addressable: true
        required: true

    ArrayableHelper @, 'luminosity', ports

  compute: (props) ->
    return unless props.color? and props.color.length>0

    luminosities = []
    if props.color instanceof Array
      colors = @expandToArray props.color
      for c in colors
        if c instanceof Array
          cc = c[0]
        else
          cc = c
        
        cc = @getLuminosity(cc)
        luminosities.push(cc)

    if luminosities.length == 1
      luminosities = luminosities[0]

    return luminosities

  getLuminosity: (a_color) ->
    color = new Color a_color
    return color.luminosity()

exports.getComponent = -> new GetLuminosity
