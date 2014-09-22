noflo = require 'noflo'

unless noflo.isBrowser()
  chai = require 'chai' unless chai
  Transform = require '../components/ConvertToRGB.coffee'
else
  Transform = require 'noflo-color/components/ConvertToRGB.js'

describe 'ConvertToRGB component', ->
  c = null
  sock_color = null
  sock_outcolor = null

  beforeEach ->
    c = Transform.getComponent()
    sock_color = noflo.internalSocket.createSocket()
    sock_outcolor = noflo.internalSocket.createSocket()
    c.inPorts.color.attach sock_color
    c.outPorts.color.attach sock_outcolor

  describe 'when instantiated', ->
    it 'should have one input port', ->
      chai.expect(c.inPorts.color).to.be.an 'object'
    it 'should have one output port', ->
      chai.expect(c.outPorts.color).to.be.an 'object'

  describe 'single color convertion', ->
    it 'should output a color string', ->
      sock_outcolor.once 'data', (data) ->
        chai.expect(data).to.equal 'rgb(106, 191, 64)'
      sock_color.send 'hsl(100, 50%, 50%)'

  describe 'multiple color convertion', ->
    it 'should output an array of color strings', ->
      sock_outcolor.once 'data', (data) ->
        chai.expect(data).to.be.an 'array'
        chai.expect(data[0]).to.equal 'rgb(106, 191, 64)'
        chai.expect(data[1]).to.equal 'rgb(0, 0, 0)'
      sock_color.send ['hsl(100, 50%, 50%)', 'hsl(0, 0%, 0%)']



