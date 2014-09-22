noflo = require 'noflo'

unless noflo.isBrowser()
  chai = require 'chai' unless chai
  GetLuminosity = require '../components/GetLuminosity.coffee'
else
  GetLuminosity = require 'noflo-color/components/GetLuminosity.js'

describe 'GetLuminosity component', ->
  c = null
  sock_color = null
  sock_luminosity = null

  beforeEach ->
    c = GetLuminosity.getComponent()
    sock_color = noflo.internalSocket.createSocket()
    sock_luminosity = noflo.internalSocket.createSocket()
    c.inPorts.color.attach sock_color
    c.outPorts.luminosity.attach sock_luminosity

  describe 'when instantiated', ->
    it 'should have one input port', ->
      chai.expect(c.inPorts.color).to.be.an 'object'
    it 'should have one output port', ->
      chai.expect(c.outPorts.luminosity).to.be.an 'object'

  describe 'single color luminosity', ->
    it 'should output a luminosity value', ->
      sock_luminosity.once 'data', (data) ->
        chai.expect(data).to.be.closeTo 0.4, 0.1
      sock_color.send 'hsl(100, 50%, 50%)'

  describe 'multiple color luminosity', ->
    it 'should output an array of luminosity values', ->
      sock_luminosity.once 'data', (data) ->
        chai.expect(data).to.be.an 'array'
        chai.expect(data[0]).to.be.closeTo 0.4, 0.1
        chai.expect(data[1]).to.be.closeTo 0.6, 0.1
      sock_color.send ['hsl(100, 50%, 50%)', 'hsl(0, 0%, 80%)']


