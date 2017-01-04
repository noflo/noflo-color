noflo = require 'noflo'

unless noflo.isBrowser()
  chai = require 'chai'
  path = require 'path'
  baseDir = path.resolve __dirname, '../'
else
  baseDir = 'noflo-color'

describe 'GetContrast component', ->
  c = null
  sock_color = null
  sock_reference = null
  sock_contrast = null

  before (done) ->
    @timeout 4000
    loader = new noflo.ComponentLoader baseDir
    loader.load 'color/GetContrast', (err, instance) ->
      return done err if err
      c = instance
      sock_color = noflo.internalSocket.createSocket()
      c.inPorts.color.attach sock_color
      sock_reference = noflo.internalSocket.createSocket()
      c.inPorts.reference.attach sock_reference
      done()
  beforeEach ->
    sock_contrast = noflo.internalSocket.createSocket()
    c.outPorts.contrast.attach sock_contrast
  afterEach ->
    c.outPorts.contrast.detach sock_contrast

  describe 'when instantiated', ->
    it 'should have two input ports', ->
      chai.expect(c.inPorts.color).to.be.an 'object'
      chai.expect(c.inPorts.reference).to.be.an 'object'
    it 'should have one output port', ->
      chai.expect(c.outPorts.contrast).to.be.an 'object'

  describe 'single color contrast', ->
    it 'should output a contrast value', ->
      sock_contrast.once 'data', (data) ->
        chai.expect(data).to.equal 1
      sock_color.send 'hsl(100, 50%, 50%)'
      sock_reference.send 'hsl(100, 50%, 50%)'

  describe 'multiple color contrast', ->
    it 'should output an array of contrast values', ->
      sock_contrast.once 'data', (data) ->
        chai.expect(data).to.be.an 'array'
        chai.expect(data[0]).to.equal 1
        chai.expect(data[1]).to.be.closeTo 2.29, 0.1
      sock_color.send ['hsl(100, 50%, 50%)', 'hsl(100, 50%, 100%)']
      sock_reference.send 'hsl(100, 50%, 50%)'



