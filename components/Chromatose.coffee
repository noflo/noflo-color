noflo = require 'noflo'
Color = require 'color'

band = {start:190, end:220, count:3}

exports.getComponent = ->
  c = new noflo.Component
  c.inPorts.add 'colors',
    datatype: 'array'
  c.inPorts.add 'format',
    datatype: 'string'
    control: true
    default: 'hsl'
  c.outPorts.add 'out',
    datatype: 'object'
  c.forwardBrackets =
    colors: ['out']
  
  solve = (colors, format = 'hsl') ->
    options =
      format: format
      lights: ['white']
      darks: ['black']
      primes: [
        {h:350, s:80, l:65} # pinkish red
        {h:40,  s:80, l:65} # yellowish gold
        {h:190, s:80, l:65} # turq
      ]
    
    primes = []
    for pr in options.primes
      primes.push Color(pr)
    
    palette = []
    for color in colors
      palette.push Color(color)
    
    dominant = palette[0]
    
    {h,s,l} = dominant.hsl()
    
    # Box Background Color
    # ------------------------------
    
    box_h = Math.round( h / 10 ) * 10
    box_s = s
    box_a = 1
    
    # dark
    if (l <= 35) or (l <= 50 and s <= 15)
      isDark = true
      box_l = Math.min l, 20
      if s >= 10
        box_s = 50
    
    # light
    else if (l >= 75) or (l >= 50 and s <= 15)
      isLight = true
      box_l = Math.max l, 95
      if s >= 10
        box_s = 50
    
    # vibrant
    else
      isVibrant = true
      box_s = Math.max 80, s
      box_l = 60
      box_a = .95
    
    box = Color {h:box_h,s:box_s,l:box_l, a:box_a}
    
    # Text Color
    # ------------------------------
    
    if isVibrant
      if box.dark()
        text = Color "white"
        meta = {
          h:box_h,
          s:box_s - 20,
          l:box_l + 20 # tone-on-tone
        }
        meta_highlight = {
          h:box_h,
          s:box_s,
          l:box_l + 30 # tone-on-tone
        }
      else
        text = Color "black"
        meta = {
          h:box_h,
          s:box_s - 20,
          l:box_l - 20 # tone-on-tone
        }
        meta_highlight = {
          h:box_h,
          s:box_s,
          l:box_l - 30 # tone-on-tone
        }
      
    else if box.dark()
      text = Color "white"
      meta = {
        h:box_h,
        s:s,
        l:box_l + 40 # tone-on-tone
      }
      meta_highlight = {
        h:box_h,
        s:s + 40,
        l:box_l + 40 # tone-on-tone
      }
      
    else
      text = Color "black"
      meta = {
        h:box_h,
        s:s,
        l:box_l - 20 # tone-on-tone
      }
      meta_highlight = {
        h:box_h,
        s:s + 30, # more vibrant
        l:box_l - 20 # tone-on-tone
      }
      
    meta = Color(meta)
    
    meta_highlight = Color(meta_highlight)

    
    # Prime Color
    # ------------------------------
    
    # by constrast
    #contrast = 0
    #for p in primes
    #  curCont = box.contrast p
    #  if curCont > contrast
    #    contrast = curCont
    #    prime = p
    #  # TODO: fallback when contrast isnt enough
    
    # by hue similarity
    #contrast = 10000
    #for p in primes
    #  curCont = Math.abs box_h - p.hsl().h
    #  if curCont < contrast
    #    contrast = curCont
    #    prime = p
    prime = Color
      h: meta_highlight.hsl().h
      s: Math.max(meta_highlight.hsl().s, 80)
      l: meta_highlight.hsl().l
    
    #prime = box.clone().rotate(-60)

    return {
      box:box[format]()
      text:text[format]()
      meta:meta[format]()
      meta_highlight:meta_highlight[format]()
      prime:prime[format]()
    }

  c.process (input, output) ->
    return unless input.hasData 'colors'
    return if input.attached('format').length and not input.hasData 'format'
    format = 'hsl'
    if input.hasData 'format'
      format = input.getData 'format'
    colors = input.getData colors
    output.sendDone
      out: solve colors, format
