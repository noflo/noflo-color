noflo = require 'noflo'

unless noflo.isBrowser()
  chai = require 'chai' unless chai
  Mix = require '../components/Mix.coffee'
else
  Mix = require 'noflo-color/components/Mix.js'

describe 'Mix component', ->
  c = null
  sock_color = null
  sock_reference = null
  sock_weight = null
  sock_colorout = null

  beforeEach ->
    c = Mix.getComponent()
    sock_color = noflo.internalSocket.createSocket()
    sock_reference = noflo.internalSocket.createSocket()
    sock_weight = noflo.internalSocket.createSocket()
    sock_colorout = noflo.internalSocket.createSocket()
    c.inPorts.color.attach sock_color
    c.inPorts.reference.attach sock_reference
    c.inPorts.weight.attach sock_weight
    c.outPorts.color.attach sock_colorout

  describe 'when instantiated', ->
    it 'should have three input ports', ->
      chai.expect(c.inPorts.color).to.be.an 'object'
      chai.expect(c.inPorts.reference).to.be.an 'object'
      chai.expect(c.inPorts.weight).to.be.an 'object'
    it 'should have one output port', ->
      chai.expect(c.outPorts.color).to.be.an 'object'

  describe 'single color mix', ->
    it 'should output a mixed color with equal weight', ->
      sock_colorout.once 'data', (data) ->
        chai.expect(data).to.equal 'hsl(30, 100%, 50%)'
      sock_color.send 'yellow'
      sock_reference.send 'red'

    it 'should output a mixed color with 0.8 of weight to first color', ->
      sock_colorout.once 'data', (data) ->
        chai.expect(data).to.equal 'hsl(30, 100%, 50%)'
      sock_color.send 'yellow'
      sock_reference.send 'red'
      sock_weight.send 1.0

  describe 'multiple color mix', ->
    it 'should output an array of mixed colors', ->
      sock_colorout.once 'data', (data) ->
        chai.expect(data).to.be.an 'array'
        chai.expect(data[0]).to.equal 'hsl(26, 70%, 42%)'
        chai.expect(data[1]).to.equal 'hsl(216, 50%, 42%)'
      sock_color.send ['red', 'blue']
      sock_reference.send 'hsl(100, 50%, 50%)'



