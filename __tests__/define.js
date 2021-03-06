const customMatchers = require('./custom-matchers');

describe('Plugin for define blocks', () => {
  beforeEach(() => {
    jasmine.addMatchers(customMatchers);
  });

  it('transforms anonymous define blocks with one dependency', () => {
    expect(`
      define(['stuff'], function(donkeys) {
        return {
          llamas: donkeys.version
        };
      });
    `).toBeTransformedTo(`
      module.exports = function() {
        var donkeys = require('stuff');
        return {
          llamas: donkeys.version
        };
      }();
    `);
  });

  it('transforms anonymous define blocks with multiple dependencies', () => {
    expect(`
      define(['stuff', 'here'], function(donkeys, aruba) {
        return {
           llamas: donkeys.version,
           cows: aruba.hi
        };
      });
    `).toBeTransformedTo(`
      module.exports = function() {
        var donkeys = require('stuff');
        var aruba = require('here');
        return {
          llamas: donkeys.version,
          cows: aruba.hi
        };
      }();
    `);
  });

  it('transforms anonymous define blocks with unused dependencies', () => {
    expect(`
      define(['stuff', 'here'], function(donkeys) {
        return {
           llamas: donkeys.version
        };
      });
    `).toBeTransformedTo(`
      module.exports = function() {
        var donkeys = require('stuff');
        require('here');
        return {
          llamas: donkeys.version
        };
      }();
    `);
  });

  it('only transforms define blocks at the top level', () => {
    const program = `
      if(someDumbCondition) {
        define(['stuff'], function(stuff) {
          return { hi: 'world' };
        });
      }
    `;
    expect(program).toBeTransformedTo(program);
  });

  it('transforms anonymous define blocks with no dependency list', () => {
    expect(`
      define(function() {
        return {
           llamas: 'donkeys'
        };
      });
    `).toBeTransformedTo(`
      module.exports = function() {
        return {
          llamas: 'donkeys'
        };
      }();
    `);
  });

  it('transforms dependencies listed as variables', () => {
    expect(`
      var dependency = 'hey';
      define([dependency], function(here) {
        return {
           llamas: here.hi
        };
      });
    `).toBeTransformedTo(`
      var dependency = 'hey';
      module.exports = function() {
        var here = require(dependency);
        return {
          llamas: here.hi
        };
      }();
    `);
  });

  it('transforms named define blocks with dependencies', () => {
    expect(`
      define('thismoduletho', ['hi'], function(here) {
        return {
           llamas: here.hi
        };
      });
    `).toBeTransformedTo(`
      module.exports = function() {
        var here = require('hi');
        return {
          llamas: here.hi
        };
      }();
    `);
  });

  it('transforms named define blocks with no dependency list', () => {
    expect(`
      define('thismoduletho', function() {
        return {
           llamas: 'they are fluffy'
        };
      });
    `).toBeTransformedTo(`
      module.exports = function() {
        return {
          llamas: 'they are fluffy'
        };
      }();
    `);
  });

  it('does not require a dependency named `require`', () => {
    expect(`
      define(['require'], function(require) {
        var x = require('x');
      });
    `).toBeTransformedTo(`
      module.exports = function() {
        var x = require('x');
      }();
    `);
  });

  it('handles injection of a dependency named `module`', () => {
    expect(`
      define(['module'], function(module) {
        module.exports = { hey: 'boi' };
      });
    `).toBeTransformedTo(`
      (function() {
        module.exports = { hey: 'boi' };
      })();
    `);
  });

  it('handles injection of dependency name `exports`', () => {
    expect(`
      define(['exports'], function(exports) {
        exports.hey = 'boi';
      });
    `).toBeTransformedTo(`
      (function() {
        exports.hey = 'boi';
      })();
    `);
  });

  it('transforms the simplified commonjs wrapper', () => {
    expect(`
      define(function(require, exports, module) {
        var stuff = require('hi');
        exports.hey = stuff.boi;
      });
    `).toBeTransformedTo(`
      (function(require, exports, module) {
        var stuff = require('hi');
        exports.hey = stuff.boi;
      })(require, exports, module);
    `);
    expect(`
      define(function(require, exports) {
        var stuff = require('hi');
        exports.hey = stuff.boi;
      });
    `).toBeTransformedTo(`
      (function(require, exports) {
        var stuff = require('hi');
        exports.hey = stuff.boi;
      })(require, exports);
    `);
    expect(`
      define(function(require) {
        var stuff = require('hi');
        exports.hey = stuff.boi;
      });
    `).toBeTransformedTo(`
      module.exports = function(require) {
        var stuff = require('hi');
        exports.hey = stuff.boi;
      }(require);
    `);
  });

  it('transforms the simplified commonjs wrapper with weird variable names', () => {
    expect(`
      define(function(llamas, cows, bears) {
        var stuff = llamas('hi');
        cows.hey = stuff.boi;
      });
    `).toBeTransformedTo(`
      (function(llamas, cows, bears) {
        var stuff = llamas('hi');
        cows.hey = stuff.boi;
      })(require, exports, module);
    `);
    expect(`
      define(function(llamas, cows) {
        var stuff = llamas('hi');
        cows.hey = stuff.boi;
      });
    `).toBeTransformedTo(`
      (function(llamas, cows) {
        var stuff = llamas('hi');
        cows.hey = stuff.boi;
      })(require, exports);
    `);
    expect(`
      define(function(donkeys) {
        var stuff = donkeys('hi');
        exports.hey = stuff.boi;
      });
    `).toBeTransformedTo(`
      module.exports = function(donkeys) {
        var stuff = donkeys('hi');
        exports.hey = stuff.boi;
      }(require);
    `);
  });

  it("lets you declare a dependency as `module` even though that's crazy", () => {
    expect(`
      define(['notmodule'], function(module) {
        return {
          notmodule: module.notmodule
        };
      });
    `).toBeTransformedTo(`
      module.exports = function() {
        var module = require('notmodule');
        return {
          notmodule: module.notmodule
        };
      }();
    `);
  });

  it("lets you declare a dependency as `exports` even though that's crazy", () => {
    expect(`
      define(['notexports'], function(exports) {
        return {
          notexports: exports.notexports
        };
      });
    `).toBeTransformedTo(`
      module.exports = function() {
        var exports = require('notexports');
        return {
          notexports: exports.notexports
        };
      }();
    `);
  });

  it('transforms non-function modules exporting objects with no dependencies', () => {
    expect(`
      define({ thismodule: 'is an object' });
    `).toBeTransformedTo(`
      module.exports = { thismodule: 'is an object' };
    `);
  });

  it('transforms non-function modules exporting objects with dependencies', () => {
    expect(`
      define(['side-effect'], { thismodule: 'is an object' });
    `).toBeTransformedTo(`
      require('side-effect');
      module.exports = { thismodule: 'is an object' };
    `);
  });

  it('transforms non-function modules exporting arrays with no dependencies', () => {
    expect(`
      define(['this', 'module', 'is', 'an', 'array']);
    `).toBeTransformedTo(`
      module.exports = ['this', 'module', 'is', 'an', 'array'];
    `);
  });

  it('transforms non-function modules exporting arrays with dependencies', () => {
    expect(`
      define(['side-effect'], ['this', 'module', 'is', 'an', 'array']);
    `).toBeTransformedTo(`
      require('side-effect');
      module.exports = ['this', 'module', 'is', 'an', 'array'];
    `);
  });

  it('transforms non-function modules exporting primitives with no dependencies', () => {
    const primitives = ["'a string'", '33', 'true', 'false', 'null', 'undefined'];
    primitives.forEach((primitive) => {
      expect(`
        define(${primitive});
      `).toBeTransformedTo(`
        module.exports = ${primitive};
      `);
    });
  });

  it('handles non-function modules exporting primitives with dependencies', () => {
    const primitives = ["'a string'", '33', 'true', 'false', 'null', 'undefined'];
    primitives.forEach((primitive) => {
      expect(`
        define(['side-effect'], ${primitive});
      `).toBeTransformedTo(`
        require('side-effect');
        module.exports = ${primitive};
      `);
    });
  });

  it('transforms non-function modules requiring `require` for some reason', () => {
    expect(`
      define(['require'], { some: 'stuff' });
    `).toBeTransformedTo(`
      module.exports = { some: 'stuff' };
    `);
  });

  it('transforms non-function modules requiring `exports` for some reason', () => {
    expect(`
      define(['exports'], { some: 'stuff' });
    `).toBeTransformedTo(`
      module.exports = { some: 'stuff' };
    `);
  });

  it('transforms non-function modules requiring `module` for some reason', () => {
    expect(`
      define(['module'], { some: 'stuff' });
    `).toBeTransformedTo(`
      module.exports = { some: 'stuff' };
    `);
  });

  it('transforms named non-function modules with no dependencies', () => {
    expect(`
      define('auselessname', { thismodule: 'is an object' });
    `).toBeTransformedTo(`
      module.exports = { thismodule: 'is an object' };
    `);
    expect(`
      define('auselessname', ['an', 'array', 'factory']);
    `).toBeTransformedTo(`
      module.exports = ['an', 'array', 'factory'];
    `);
  });

  it('transforms named non-function modules with dependencies', () => {
    expect(`
      define('auselessname', ['side-effect'], { thismodule: 'is an object' });
    `).toBeTransformedTo(`
      require('side-effect');
      module.exports = { thismodule: 'is an object' };
    `);
    expect(`
      define('auselessname', ['side-effect'], ['an', 'array', 'factory']);
    `).toBeTransformedTo(`
      require('side-effect');
      module.exports = ['an', 'array', 'factory'];
    `);
  });
});
