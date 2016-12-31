'use strict';

jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';

describe('setup/init', function() {

  beforeEach(function() {
    loadFixtures('basic.html');
  });

  it('should return public methods', function() {
    var tt = tabletrim(document.getElementById('tt'));
    expect(typeof tt.trim).toEqual('function');
    expect(typeof tt.untrim).toEqual('function');
    expect(typeof tt.activate).toEqual('function');
  });

  it('should throw an error if not passed a table element', function() {
    var invalidElement = document.getElementById('not-a-table');
    expect(function() { tabletrim(invalidElement); }).toThrow();
  });

  it('should validate options.sticky', function() {
    var table = document.getElementById('tt');
    expect(function() { tabletrim(tt, { sticky: 0 } )} ).toThrow();
  });

  it('should validate options.init', function() {
    var table = document.getElementById('tt');
    expect(function() { tabletrim(tt, { init: 1 } )} ).toThrow();
  });

  it('should overwrite options', function() {
    var opts = { sticky: 2, init: 3 }
    var tt = tabletrim(document.getElementById('tt'), opts);
    tt.trim();
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(1)').classList.contains('tt-sticky')).toEqual(false);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(2)').classList.contains('tt-sticky')).toEqual(true);

    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(1)').classList.contains('tt-active')).toEqual(false);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(3)').classList.contains('tt-active')).toEqual(true);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(4)').classList.contains('tt-active')).toEqual(false);
  });

});


describe('methods', function() {

  beforeEach(function() {
    loadFixtures('basic.html');
  });

  it('should trim the table', function() {
    var tt = tabletrim(document.getElementById('tt'));
    tt.trim();
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(1)').classList.contains('tt-sticky')).toEqual(true);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(2)').classList.contains('tt-active')).toEqual(true);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(3)').classList.contains('tt-active')).toEqual(false);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(4)').classList.contains('tt-active')).toEqual(false);
  });

  it('should untrim the table', function() {
    var tt = tabletrim(document.getElementById('tt'));
    tt.trim();
    tt.untrim();
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(1)').classList.contains('tt-sticky')).toEqual(true);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(2)').classList.contains('tt-active')).toEqual(false);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(3)').classList.contains('tt-active')).toEqual(false);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(4)').classList.contains('tt-active')).toEqual(false);
  });

  it('should activate a given column', function() {
    var tt = tabletrim(document.getElementById('tt'));
    tt.trim();
    tt.activate(3);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(1)').classList.contains('tt-sticky')).toEqual(true);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(2)').classList.contains('tt-active')).toEqual(false);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(3)').classList.contains('tt-active')).toEqual(true);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(4)').classList.contains('tt-active')).toEqual(false);
  });

  it('should not allow activating the sticky column', function() {
    var tt = tabletrim(document.getElementById('tt'));
    tt.trim();
    tt.activate(1);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(1)').classList.contains('tt-sticky')).toEqual(true);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(2)').classList.contains('tt-active')).toEqual(true);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(3)').classList.contains('tt-active')).toEqual(false);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(4)').classList.contains('tt-active')).toEqual(false);
  });

});


describe('controls', function() {

  beforeEach(function() {
    loadFixtures('basic.html');
  });

  it('should use the proper HTML for the controls', function() {
    var label = '<span class="tt-label-test">label test</span>';
    var prev = 'prev';
    var next = '»'
    var opts = {
      controls: ['label', 'prev', 'next'],
      labelhtml: label,
      prevhtml: prev,
      nexthtml: next
    }
    var tt = tabletrim(document.getElementById('tt'), opts);
    expect(document.querySelector('#tt .tt-label').innerHTML).toEqual(label);
    expect(document.querySelector('#tt .tt-next').innerHTML).toEqual(next);
    expect(document.querySelector('#tt .tt-prev').innerHTML).toEqual(prev);
  });

  it('should activate the correct column when using the select control', function() {
    var tt = tabletrim(document.getElementById('tt'));
    tt.trim();
    var select = document.querySelector('.tt-select');
    var third = select.querySelector('option:nth-child(3)');
    third.selected = true;
    select.onchange();

    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(1)').classList.contains('tt-sticky')).toEqual(true);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(2)').classList.contains('tt-active')).toEqual(false);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(3)').classList.contains('tt-active')).toEqual(true);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(4)').classList.contains('tt-active')).toEqual(false);
  });

  it('should activate the correct column when using the next control', function() {
    var tt = tabletrim(document.getElementById('tt'), { controls: ['next'], init: 3 });
    tt.trim();
    var next = document.querySelector('.tt-next');

    next.onclick();
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(1)').classList.contains('tt-sticky')).toEqual(true);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(2)').classList.contains('tt-active')).toEqual(false);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(3)').classList.contains('tt-active')).toEqual(false);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(4)').classList.contains('tt-active')).toEqual(true);

    next.onclick();
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(1)').classList.contains('tt-sticky')).toEqual(true);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(2)').classList.contains('tt-active')).toEqual(true);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(3)').classList.contains('tt-active')).toEqual(false);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(4)').classList.contains('tt-active')).toEqual(false);
  });

  it('should activate the correct column when using the previous control', function() {
    var tt = tabletrim(document.getElementById('tt'), { controls: ['prev'], init: 3 });
    tt.trim();
    var prev = document.querySelector('.tt-prev');

    prev.onclick();
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(1)').classList.contains('tt-sticky')).toEqual(true);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(2)').classList.contains('tt-active')).toEqual(true);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(3)').classList.contains('tt-active')).toEqual(false);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(4)').classList.contains('tt-active')).toEqual(false);

    prev.onclick();
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(1)').classList.contains('tt-sticky')).toEqual(true);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(2)').classList.contains('tt-active')).toEqual(false);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(3)').classList.contains('tt-active')).toEqual(false);
    expect(document.querySelector('tbody tr:nth-child(1) td:nth-child(4)').classList.contains('tt-active')).toEqual(true);
  });

});


describe('CALLBACKS:', function() {

  beforeEach(function() {
    loadFixtures('basic.html');
  });

  it('should fire oninit', function() {
    var table = document.getElementById('tt');
    var check = document.getElementById('tt-callback-oninit');
    var opts = {
      oninit: function(t) {
        check.checked = true;
        window.tt_callback_args = { table: t }
      }
    }
    var tt = tabletrim(table, opts);
    expect(check.checked).toEqual(true);
    expect(window.tt_callback_args.table instanceof HTMLTableElement).toBe(true);
  });

  it('ontrim', function() {
    var table = document.getElementById('tt');
    var check = document.getElementById('tt-callback-ontrim');
    var opts = {
      ontrim: function(t) {
        check.checked = true;
        window.tt_callback_args = { table: t }
      }
    }
    var tt = tabletrim(table, opts);
    expect(check.checked).toEqual(true);
    expect(window.tt_callback_args.table instanceof HTMLTableElement).toBe(true);
  });

  it('onuntrim', function() {
    var table = document.getElementById('tt');
    var check = document.getElementById('tt-callback-onuntrim');
    var opts = {
      onuntrim: function(t) {
        check.checked = true;
        window.tt_callback_args = { table: t }
      }
    }
    var tt = tabletrim(table, opts);
    tt.untrim();
    expect(check.checked).toEqual(true);
    expect(window.tt_callback_args.table instanceof HTMLTableElement).toBe(true);
  });

  it('onactivate', function() {
    var table = document.getElementById('tt');
    var check = document.getElementById('tt-callback-onactivate');
    var opts = {
      onactivate: function(t, c) {
        check.checked = true;
        window.tt_callback_args = { table: t, column: c }
      }
    }
    var tt = tabletrim(table, opts);
    expect(check.checked).toEqual(true);

    check.checked = false;
    tt.activate(3);
    expect(check.checked).toEqual(true);
    expect(window.tt_callback_args.table instanceof HTMLTableElement).toBe(true);
    expect(typeof window.tt_callback_args.column).toEqual('object');
    expect(window.tt_callback_args.column.index).toEqual(3);
  });

  it('ondeactivate', function() {
    var table = document.getElementById('tt');
    var check = document.getElementById('tt-callback-ondeactivate');
    var opts = {
      ondeactivate: function(t, c) {
        check.checked = true;
        window.tt_callback_args = { table: t, column: c }
      }
    }
    var tt = tabletrim(document.getElementById('tt'), opts);
    expect(check.checked).toEqual(true);

    check.checked = false;
    tt.activate(3);
    expect(check.checked).toEqual(true);
    expect(window.tt_callback_args.table instanceof HTMLTableElement).toBe(true);
    expect(typeof window.tt_callback_args.column).toEqual('object');
    expect(window.tt_callback_args.column.index).toEqual(2);
  });
});
