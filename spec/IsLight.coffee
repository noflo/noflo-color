noflo = require 'noflo'

unless noflo.isBrowser()
  chai = require 'chai'
  path = require 'path'
  baseDir = path.resolve __dirname, '../'
else
  baseDir = 'noflo-color'

describe 'IsLight component', ->
  c = null
  sock_color = null
  sock_light = null

  before (done) ->
    @timeout 4000
    loader = new noflo.ComponentLoader baseDir
    loader.load 'color/IsLight', (err, instance) ->
      return done err if err
      c = instance
      sock_color = noflo.internalSocket.createSocket()
      c.inPorts.color.attach sock_color
      done()
  beforeEach ->
    sock_light = noflo.internalSocket.createSocket()
    c.outPorts.light.attach sock_light
  afterEach ->
    c.outPorts.light.attach sock_light

  describe 'when instantiated', ->
    it 'should have one input port', ->
      chai.expect(c.inPorts.color).to.be.an 'object'
    it 'should have one output port', ->
      chai.expect(c.outPorts.light).to.be.an 'object'

  describe 'single color light check', ->
    it 'should output true for a light color', ->
      sock_light.once 'data', (data) ->
        chai.expect(data).to.be.true
      sock_color.send 'hsl(100, 0%, 100%)'

  describe 'multiple color light check', ->
    it 'should output an array confirming both light and dark colors', ->
      sock_light.once 'data', (data) ->
        chai.expect(data).to.be.an 'array'
        chai.expect(data[0]).to.be.true
        chai.expect(data[1]).to.be.false
      sock_color.send ['hsl(100, 0%, 100%)', 'hsl(100, 0%, 0%)']


