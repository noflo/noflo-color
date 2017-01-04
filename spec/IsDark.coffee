noflo = require 'noflo'

unless noflo.isBrowser()
  chai = require 'chai'
  path = require 'path'
  baseDir = path.resolve __dirname, '../'
else
  baseDir = 'noflo-color'

describe 'IsDark component', ->
  c = null
  sock_color = null
  sock_dark = null

  before (done) ->
    @timeout 4000
    loader = new noflo.ComponentLoader baseDir
    loader.load 'color/IsDark', (err, instance) ->
      return done err if err
      c = instance
      sock_color = noflo.internalSocket.createSocket()
      c.inPorts.color.attach sock_color
      done()
  beforeEach ->
    sock_dark = noflo.internalSocket.createSocket()
    c.outPorts.dark.attach sock_dark
  afterEach ->
    c.outPorts.dark.attach sock_dark

  describe 'when instantiated', ->
    it 'should have one input port', ->
      chai.expect(c.inPorts.color).to.be.an 'object'
    it 'should have one output port', ->
      chai.expect(c.outPorts.dark).to.be.an 'object'

  describe 'single color dark check', ->
    it 'should output true for a dark color', ->
      sock_dark.once 'data', (data) ->
        chai.expect(data).to.be.true
      sock_color.send 'hsl(100, 0%, 0%)'

  describe 'multiple color dark check', ->
    it 'should output an array confirming both dark and light colors', ->
      sock_dark.once 'data', (data) ->
        chai.expect(data).to.be.an 'array'
        chai.expect(data[0]).to.be.true
        chai.expect(data[1]).to.be.false
      sock_color.send ['hsl(100, 0%, 0%)', 'hsl(100, 0%, 100%)']


