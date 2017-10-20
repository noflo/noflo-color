noflo = require 'noflo'
ArrayableHelper = require 'noflo-helper-arrayable'
Color = require 'color'

class IsDark extends noflo.Component
  description: 'Check if a dark color.'
  icon: 'tint'
  constructor: ->
    ports =
      color:
        datatype: 'object'
        description: 'color(s) to check'
        addressable: true
        required: true

    ArrayableHelper @, 'dark', ports

  compute: (props) ->
    return unless props.color? and props.color.length>0

    darks = []
    if props.color instanceof Array
      colors = @expandToArray props.color
      for c in colors
        if c instanceof Array
          cc = c[0]
        else
          cc = c
        
        cc = @isDark(cc)
        darks.push(cc)

    if darks.length == 1
      darks = darks[0]

    return darks

  isDark: (a_color) ->
    color = new Color a_color
    return color.dark()

exports.getComponent = -> new IsDark
