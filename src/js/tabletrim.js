/**
* tabletrim.js Javascript plugin for collapsing tables into selectable columns
* @author Pony Smith - pony@ponysmith.com
*/

var tabletrim = function(table, opts) {

  // Options
  var _options = {
    controls: ['select'], // Array of control elements ('select','title','label','prev','next')
    prevhtml: '&lsaquo;', // HTML to use for prev button
    nexthtml: '&rsaquo;', // HTML to use for next button
    labelhtml: 'Column: ', // HTML to use for the label
    sticky: 1, // Column which should always be displayed (starting at 1), set 0 for no sticky column
    init: 2, // Initial column to show when trim is initialized (starting at 1)
    breakpoint: 640, // Width at which to (un)trim the table
    oninit: function() {},
    ontrim: function() {},
    onuntrim: function() {},
    onactivate: function() {},
    ondeactivate: function() {}
  }

  // CSS classes
  var _classes = {
    table: 'tt',
    rtl: 'tt-rtl',
    ltr: 'tt-ltr',
    controls: 'tt-controls',
    title: 'tt-title',
    prev: 'tt-prev',
    next: 'tt-next',
    label: 'tt-label',
    select: 'tt-select',
    trimmed: 'tt-trimmed',
    active: 'tt-active',
    sticky: 'tt-sticky',
  }

  // State data
  var _data = {
    id: null,
    trimmed: false,
    activeindex: null,
    timeout: null,
    columns: null
  }

  // Element references
  var _elements = {}

  // Array of table columns
  var _columns = []

  /**
   * Private object
   */
  _private = {

    /**
     * Initialize
     */
    init: function(table, opts) {
      if(table instanceof HTMLTableElement == false) throw new TypeError('[tabletrim] First parameter passed to tabletrim() must be an HTMLTableElement');
      // Set table reference
      _elements.table = table;
      _elements.table.classList.add(_classes.table);
      // Set initial data
      _data.id = _private.getId();
      _data.activeindex = _options.init;
      // Setup
      _private.buildColumns();
      // Merge and validate options
      _private.mergeOptions(opts);
      // Build the controls
      _private.buildControls();
      // Bind events
      _private.bindEvents();
      // Do initial check
      _private.check();
      // Trigger oninit callback
      if(typeof _options.oninit == 'function') { _options.oninit(_elements.table); }
      // Return the public object
      return _public;
    },

    /**
     * Merge user options with defaults
     */
    mergeOptions: function(options) {
      for(o in options) {
        if(_options[o] != null) _options[o] = options[o];
      }
      // Validate options
      if(_options.sticky < 1 || _options.sticky > _data.columns)
        throw new Error('`options.sticky` must be greater than 0 and cannot be greater than the number of table columns (' + _data.columns + ')');
      if(_options.init < 1 || _options.init > _data.columns)
        throw new Error('`options.sticky` must be greater than 0 and cannot be greater than the number of table columns (' + _data.columns + ')');
      if(_options.init == _options.sticky)
        throw new Error('`options.init` must not be the same as `options.sticky`');
    },

    /**
     * Get/Create ID for table
     */
    getId: function() {
      return Math.random().toString(36).substr(2, 6);
    },

    /**
     * Build the columns array
     */
    buildColumns: function() {
      // select all th's and coerce NodeList into array
      var columns = [].slice.call(_elements.table.querySelectorAll('thead th'));
      columns.forEach(function(col, i) {
        i++;
        _columns[i] = {
          index: i,
          title: col.innerHTML,
          headercell: col,
          allcells: [].slice.call(_elements.table.querySelectorAll('tr th:nth-child(' + i + '), tr td:nth-child(' + i + ')')),
          bodycells: [].slice.call(_elements.table.querySelectorAll('tbody tr th:nth-child(' + i + '), tbody tr td:nth-child(' + i + ')'))
        }
      });
      _data.columns = columns.length;
    },

    /**
     * Build the controls
     */
    buildControls: function() {
      if(typeof _options.controls == 'object') {
        _elements.controls = document.createElement('div');
        _elements.controls.classList.add(_classes.controls);
        _options.controls.forEach(function(control, index) {
          switch(control) {
            case 'select':
              _elements.select = document.createElement('select');
              _elements.select.id = 'tt-select-' + _data.id;
              _elements.select.classList.add(_classes.select);
              _elements.select.onchange = function() {
                var idx = _elements.select.selectedOptions[0].value;
                _private.activate(idx);
              }
              _columns.forEach(function(col) {
                var option = document.createElement('option');
                option.value = col.index;
                option.innerHTML = col.title;
                if(_options.sticky > 0 && _options.sticky == col.index) option.disabled = true;
                _elements.select.appendChild(option);
                _elements.controls.appendChild(_elements.select);
              });
              break;

            case 'label':
              _elements.label = document.createElement('label');
              _elements.label.classList.add(_classes.label);
              _elements.label.htmlFor = 'tt-select-' + _data.id;
              _elements.label.innerHTML = _options.labelhtml;
              _elements.controls.appendChild(_elements.label);
              break;

            case 'title':
              _elements.title = document.createElement('span');
              _elements.title.classList.add(_classes.title);
              _elements.controls.appendChild(_elements.title);
              break;

            case 'prev':
              _elements.prev = document.createElement('button');
              _elements.prev.classList.add(_classes.prev);
              _elements.prev.innerHTML = _options.prevhtml;
              _elements.prev.onclick = function(e) {
                _private.activate(_data.prev);
              }
              _elements.controls.appendChild(_elements.prev);
              break;

            case 'next':
              _elements.next = document.createElement('button');
              _elements.next.classList.add(_classes.next);
              _elements.next.innerHTML = _options.nexthtml;
              _elements.next.onclick = function(e) {
                _private.activate(_data.next);
              }
              _elements.controls.appendChild(_elements.next);
              break;
          }
        });
      }
    },

    /**
     * Bind events
     */
    bindEvents: function() {
      window.addEventListener('resize', _private.check);
      window.addEventListener('scroll', _private.check);
    },

    /**
     * Check to see if the table needs to be trimmed/untrimmed based on table width
     */
    check: function() {
      if(_elements.table.offsetWidth <= _options.breakpoint && !_data.trimmed) _private.trim();
      if(_elements.table.offsetWidth > _options.breakpoint && _data.trimmed) _private.untrim();
    },

    /**
     * Update indexes
     */
    updateIndexes: function() {
      nextdelta = (_data.activeindex + 1 == _options.sticky) ? 2 : 1;
      prevdelta = (_data.activeindex - 1 == _options.sticky) ? 2 : 1;
      _data.next = (_data.activeindex + nextdelta <= _data.columns)
        ? _data.activeindex + nextdelta
        : (_options.sticky == 1) ? 2 : 1;
      _data.prev = (_data.activeindex - prevdelta > 0)
        ? _data.activeindex - prevdelta
        : (_data.columns == _options.sticky) ? _data.columns - 1 : _data.columns;
    },

    /**
     * Trim the table
     */
    trim: function(i) {
      // Return false if already trimmed
      if(_data.trimmed) return false;
      // If no index was passed, use the init index
      if(typeof i == 'undefined') i = _options.init;
      // Add table class for CSS descendors
      _elements.table.classList.add(_classes.trimmed);
      // Trigger the ontrim callback to make sure it happens before the onactivate callback
      if(typeof _options.ontrim == 'function') _options.ontrim(_elements.table);
      // Set the trimmed flag
      _data.trimmed = true;
      // Activate the sticky column
      if(_options.sticky > 0) _private.activate(_options.sticky);
      // Activate the selected column
      _private.activate(i);
    },

    /**
     * Untrim the table
     */
    untrim: function() {
      // Return false if table is not trimmed
      if(!_data.trimmed) return false;
      // Remove the table CSS class
      _elements.table.classList.remove(_classes.trimmed, _classes.rtl, _classes.ltr);
      // Trigger the onuntrim callback to make sure it happens before the ondeactivate callback
      if(typeof _options.onuntrim == 'function') _options.onuntrim(_elements.table);
      // Deactivate the active column
      _private.deactivate(_elements.table);
      // Set the trimmmed flag
      _data.trimmed = false;
    },

    /**
     * Activate a table column and switch to it
     */
    activate: function(i) {
      i = parseFloat(i);
      // If the table is not already trimmed, trim it and return false
      // Trimming will re-call activate once the trim has finished
      if(!_data.trimmed) {
        _private.trim(i);
        return;
      }
      // If the column is the sticky column, just add sticky class
      if(_options.sticky > 0 && i == _options.sticky) {
        _columns[i].allcells.forEach(function(cell) {
          cell.classList.add(_classes.sticky);
        });
      } else {
        // Deactivate the active column
        _private.deactivate();
        // Set the table direction depending on if the active column is before or after the sticky column
        if(i > _options.sticky) {
          _elements.table.classList.remove(_classes.rtl);
          _elements.table.classList.add(_classes.ltr);
        } else {
          _elements.table.classList.remove(_classes.ltr);
          _elements.table.classList.add(_classes.rtl);
        }
        // Update the active index
        _data.activeindex = parseInt(i);
        // Add the controls
        _private.addControls();
        // Add the active class to all cells in the active column
        _columns[i].allcells.forEach(function(cell) {
          cell.classList.add(_classes.active);
        });
        // Fire the onactivate callback
        if(typeof _options.onactivate == 'function' && i != _options.sticky) _options.onactivate(_elements.table, _columns[i]);
      }
      // Update indexes
      _private.updateIndexes();
    },

    /**
     * Deactivate a table column
     */
    deactivate: function() {
      // Remove the active class from the active column's cells
      _columns[_data.activeindex].allcells.forEach(function(cell) {
        cell.classList.remove(_classes.active);
      });
      // Remove the controls from the active column header
      _private.removeControls();
      // Fire the ondeactivate callback
      if(typeof _options.ondeactivate == 'function') _options.ondeactivate(_elements.table, _columns[_data.activeindex]);
    },

    /**
     * Add controls
     */
    addControls: function() {
      // Don't add controls if it's the sticky column
      if(_data.activeindex == _options.sticky) return false;
      // If we are using the select control, update the active option
      if(_options.controls.indexOf('select') != -1) {
        _elements.select.selectedOptions[0].removeAttribute('selected');
        _elements.select.querySelector('option:nth-child(' + _data.activeindex + ')').selected = 'selected';
      }
      // If we are using the title control, change the text
      if(_options.controls.indexOf('title') != -1) {
        _elements.title.innerHTML = _columns[_data.activeindex].title;
      }
      // Clone the controls (including events to ensure that the change event is in place)
      // var controls = _elements.controls.clone(true);
      // Remove the header cell title and replace it with the controls
      _columns[_data.activeindex].headercell.innerHTML = '';
      _columns[_data.activeindex].headercell.appendChild(_elements.controls);
    },

    /**
     * Remove controls
     */
    removeControls: function() {
      _columns[_data.activeindex].headercell.innerHTML = _columns[_data.activeindex].title;
    }

  }

  _public = {

    /**
    * Manually trim the table
    * @param (integer) i: Index of the column to show after trim (starting at 1)
    */
    trim: function(i) {
      _private.trim(i);
    },

    /**
    * Manually untrim the table
    */
    untrim: function() {
      _private.untrim();
    },

    /**
    * Manually activate a column
    * @param (integer) i: Index of the column to activate (starting at 1)
    */
    activate: function(i) {
      _private.activate(i);
    }

  }

  // Initialize the plugin and return the public object
  return _private.init(table, opts);

}
