noflo = require 'noflo'
{Arrayable} = require '../lib/Arrayable'
Color = require 'color'

class Transform extends Arrayable
  description: 'Transforms a color applying the given parameters.'
  icon: 'tint'
  constructor: ->
    ports =
      color:
        datatype: 'object'
        description: 'color to transform'
        addressable: true
        required: true
      lighten:
        datatype: 'number'
        description: 'light intensity (0..1)'
        required: false
      darken:
        datatype: 'number'
        description: 'dark intensity (0..1)'
        required: false
      saturate:
        datatype: 'number'
        description: 'saturation intensity (0..1)'
        required: false
      desaturate:
        datatype: 'number'
        description: '(0..1)'
        required: false
      whiten:
        datatype: 'number'
        description: 'white intensity (0..1)'
        required: false
      blacken:
        datatype: 'number'
        description: 'black intensity (0..1)'
        required: false
      clearer:
        datatype: 'number'
        description: 'transparency intensity (0..1)'
        required: false
      opaquer:
        datatype: 'number'
        description: '(0..1)'
        required: false
      rotate:
        datatype: 'number'
        type: 'noflo-canvas/angle'
        description: 'angle in degrees'
        required: false

    super 'color', ports

  compute: ->
    return unless @outPorts.color.isAttached()
    return unless @props.color? and @props.color.length>0
    return unless @props.lighten? or @props.darken? or @props.saturate? or
    @props.desaturate? or @props.whiten? or @props.blacken? or
    @props.clearer? or @props.opaquer? or @props.rotate?

    transform = @props

    if @props.color instanceof Array
      transform = @expandToArray @props
      # Calls @foo for each of @props.foo inport that has a value
      for k of @props
        # Color and type are not expected methods (for color instance)
        if k isnt 'color' and k isnt 'type'
          # Following DRY, we use a factory to call proper color.method
          transform = transform.map (x) => @factory(x, k)
    else
      for k of @props
        if k isnt 'color' and k isnt 'type'
          transform = @[k] @props

    # We don't want commands, just color strings
    if transform instanceof Array
      colors = (t.color for t in transform)
    else
      colors = transform.color

    @outPorts.color.send colors

  factory: (props, op) ->
    color = new Color props.color
    # Metaprogramming for the sake
    props.color = color[op](props[op]).hslString()
    # Returning props we can chain operations?
    return props

exports.getComponent = -> new Transform