noflo = require 'noflo'

unless noflo.isBrowser()
  chai = require 'chai'
  path = require 'path'
  baseDir = path.resolve __dirname, '../'
else
  baseDir = 'noflo-color'

describe 'Transform component', ->
  c = null
  sock_color = null
  sock_lighten = null
  sock_darken = null
  sock_saturate = null
  sock_desaturate = null
  sock_whiten = null
  sock_blacken = null
  sock_clearer = null
  sock_opaquer = null
  sock_rotate = null
  sock_outcolor = null

  before (done) ->
    @timeout 4000
    loader = new noflo.ComponentLoader baseDir
    loader.load 'color/Transform', (err, instance) ->
      return done err if err
      c = instance
      sock_color = noflo.internalSocket.createSocket()
      sock_lighten = noflo.internalSocket.createSocket()
      sock_darken = noflo.internalSocket.createSocket()
      sock_saturate = noflo.internalSocket.createSocket()
      sock_desaturate = noflo.internalSocket.createSocket()
      sock_whiten = noflo.internalSocket.createSocket()
      sock_blacken = noflo.internalSocket.createSocket()
      sock_clearer = noflo.internalSocket.createSocket()
      sock_opaquer = noflo.internalSocket.createSocket()
      sock_rotate = noflo.internalSocket.createSocket()
      c.inPorts.color.attach sock_color
      c.inPorts.lighten.attach sock_lighten
      c.inPorts.darken.attach sock_darken
      c.inPorts.saturate.attach sock_saturate
      c.inPorts.desaturate.attach sock_desaturate
      c.inPorts.whiten.attach sock_whiten
      c.inPorts.blacken.attach sock_blacken
      c.inPorts.clearer.attach sock_clearer
      c.inPorts.opaquer.attach sock_opaquer
      c.inPorts.rotate.attach sock_rotate
      done()
  beforeEach ->
    sock_outcolor = noflo.internalSocket.createSocket()
    c.outPorts.color.attach sock_outcolor
  afterEach ->
    c.outPorts.color.detach sock_outcolor

  describe 'when instantiated', ->
    it 'should have ten input ports', ->
      chai.expect(c.inPorts.color).to.be.an 'object'
      chai.expect(c.inPorts.lighten).to.be.an 'object'
      chai.expect(c.inPorts.darken).to.be.an 'object'
      chai.expect(c.inPorts.saturate).to.be.an 'object'
      chai.expect(c.inPorts.desaturate).to.be.an 'object'
      chai.expect(c.inPorts.whiten).to.be.an 'object'
      chai.expect(c.inPorts.blacken).to.be.an 'object'
      chai.expect(c.inPorts.clearer).to.be.an 'object'
      chai.expect(c.inPorts.opaquer).to.be.an 'object'
      chai.expect(c.inPorts.rotate).to.be.an 'object'
    it 'should have one output port', ->
      chai.expect(c.outPorts.color).to.be.an 'object'

  describe 'single color transformation', ->
    it 'should output a color string', ->
      sock_outcolor.once 'data', (data) ->
        chai.expect(data).to.equal 'hsl(100, 50%, 75%)'
      sock_color.send 'hsl(100, 50%, 50%)'
      sock_lighten.send 0.5

  describe 'multiple color transformation', ->
    it 'should output an array of color strings', ->
      sock_outcolor.once 'data', (data) ->
        chai.expect(data).to.be.an 'array'
        chai.expect(data[0]).to.equal 'hsl(100, 50%, 75%)'
        chai.expect(data[1]).to.equal 'hsl(100, 50%, 75%)'
      sock_color.send ['hsl(100, 50%, 50%)', 'hsl(100, 50%, 50%)']
      sock_lighten.send 0.5



