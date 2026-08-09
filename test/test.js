/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// build time tests for plugman plugin
// see http://mochajs.org/

import { plugman } from '../src/client/plugman.js'
import { describe, it } from 'node:test'
import expect from 'expect.js'

describe('plugman plugin', function () {
  // we default to less columns when there is lots to do
  const lots = ['name', 'pages', 'menu', 'bundled', 'installed']
  const some = ['status', 'name', 'pages', 'bundled', 'installed', 'published']

  describe('columns', function () {
    it('handles null text', function () {
      const result = plugman.parse(null)
      return expect(result.columns).to.eql(lots)
    })

    it('handles empty text', function () {
      const result = plugman.parse('')
      return expect(result.columns).to.eql(lots)
    })

    it('handles some plugins', function () {
      const result = plugman.parse('wiki-plugin-plugmatic')
      return expect(result.columns).to.eql(some)
    })

    it('ignores invalid input', function () {
      const result = plugman.parse('MUMBLE MENU')
      return expect(result.columns).to.eql(['menu'])
    })

    it('recognizes name', function () {
      const result = plugman.parse('NAME')
      return expect(result.columns).to.eql(['name'])
    })

    it('recognizes status codes', function () {
      const result = plugman.parse('STATUS MENU BUNDLED INSTALLED PUBLISHED')
      return expect(result.columns).to.eql(['status', 'menu', 'bundled', 'installed', 'published'])
    })

    it('recognizes counts', function () {
      const result = plugman.parse('PAGES\nSERVICE')
      return expect(result.columns).to.eql(['pages', 'service'])
    })

    it('ignores punctuation', function () {
      const result = plugman.parse('  NAME.')
      return expect(result.columns).to.eql(['name'])
    })

    it('asserts order witin a line', function () {
      const result = plugman.parse('MENU PUBLISHED INSTALLED')
      return expect(result.columns).to.eql(['menu', 'installed', 'published'])
    })

    return it('preservesrs order between lines', function () {
      const result = plugman.parse('MENU\nPUBLISHED\nINSTALLED')
      return expect(result.columns).to.eql(['menu', 'published', 'installed'])
    })
  })

  describe('inventory', function () {
    it('recognizes plugins by full name', function () {
      const result = plugman.parse('wiki-plugin-method')
      return expect(result.plugins).to.eql(['wiki-plugin-method'])
    })

    it('recognizes multiple plugins', function () {
      const result = plugman.parse('wiki-plugin-method\nwiki-plugin-mumble')
      return expect(result.plugins).to.eql(['wiki-plugin-method', 'wiki-plugin-mumble'])
    })

    it('keeps hyphenated names (plugmatic dropped these)', function () {
      const result = plugman.parse('wiki-plugin-diagram-editor')
      return expect(result.plugins).to.eql(['wiki-plugin-diagram-editor'])
    })

    return it('recognizes security plugins (plugmatic dropped these)', function () {
      const result = plugman.parse('wiki-security-hitchhiker')
      return expect(result.plugins).to.eql(['wiki-security-hitchhiker'])
    })
  })

  describe('farms', function () {
    it('scopes plugins under a FARM line to that farm', function () {
      const result = plugman.parse('wiki-plugin-pod\nFARM example.earth\nwiki-plugin-farm')
      expect(result.plugins).to.eql(['wiki-plugin-pod'])
      expect(result.farms.length).to.eql(1)
      expect(result.farms[0].domain).to.eql('example.earth')
      return expect(result.farms[0].plugins).to.eql(['wiki-plugin-farm'])
    })

    return it('supports multiple FARM sections', function () {
      const result = plugman.parse('FARM a.earth\nwiki-plugin-x\nFARM b.fish\nwiki-plugin-y')
      expect(result.farms.map(f => f.domain)).to.eql(['a.earth', 'b.fish'])
      return expect(result.farms[1].plugins).to.eql(['wiki-plugin-y'])
    })
  })

  return describe('sections', function () {
    it('marks plugins under PRIVATE as private (and still local)', function () {
      const result = plugman.parse('wiki-plugin-pod\nPRIVATE\nwiki-plugin-gatekeeper')
      expect(result.plugins).to.eql(['wiki-plugin-pod', 'wiki-plugin-gatekeeper'])
      return expect(result.private).to.eql(['wiki-plugin-gatekeeper'])
    })

    it('LOCAL ends a PRIVATE scope', function () {
      const result = plugman.parse('PRIVATE\nwiki-plugin-a\nLOCAL\nwiki-plugin-b')
      return expect(result.private).to.eql(['wiki-plugin-a'])
    })

    it('a FARM line also ends a PRIVATE scope', function () {
      const result = plugman.parse('PRIVATE\nwiki-plugin-a\nFARM x.earth\nwiki-plugin-b')
      expect(result.private).to.eql(['wiki-plugin-a'])
      return expect(result.farms[0].plugins).to.eql(['wiki-plugin-b'])
    })

    it('recognizes a SYNC feature with an optional target', function () {
      const bare = plugman.parse('SYNC')
      expect(bare.features).to.contain('sync')
      expect(bare.sync).to.eql({ target: null })
      const targeted = plugman.parse('SYNC hitchhikers.earth')
      return expect(targeted.sync).to.eql({ target: 'hitchhikers.earth' })
    })
  })
})
