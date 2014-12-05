/** 
 * tabletrim.js Javascript plugin for collapsing tables into selectable columns
 * @author Pony Smith - pony@ponysmith.com
 */

// Using UMD to make the plugin AMD compliant for use w/ RequireJS
// based on https://github.com/umdjs/umd

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], function (jQuery) {
            return (root.tabletrim = factory(jQuery));
        });
    } else {
        root.tabletrim = factory(root.jQuery);
    }
}(this, function ($) {

    // Now for our actual plugin code
    return function(jq, opts) {
        // Options
        var _options = { 
            select: true, // Show the dropdown select for columns
            prev: false, // Show a button to switch to previous column
            next: false, // Show a button to switch to next column
            label: false, // Create a label for the select box
            prevhtml: '&lsaquo;', // HTML to use for prev button
            nexthtml: '&rsaquo;', // HTML to use for next button
            labelhtml: 'Column: ', // HTML to use for the label
            sticky: 1, // Column which should always be displayed (starting at 1)
            init: 2, // Initial column to show when trim is initialized (starting at 1)
            breakpoint: 640, // Width at which to (un)trim the table
            lag: 100, // Lag variable in milliseconds to wait before triggering window.resize check
            // Callbacks
            oninit: null,
            ontrim: null,
            onuntrim: null,
            onactivate: null,
            ondeactivate: null
        }
        // CSS classes
        var _classes = { 
            table: 'tabletrim',
            rtl: 'tabletrim-rtl',
            ltr: 'tabletrim-ltr',
            controls: 'tabletrim-controls', 
            prev: 'tabletrim-prev', 
            next: 'tabletrim-next', 
            select: 'tabletrim-select', 
            trimmed: 'tabletrim-trimmed',
            active: 'tabletrim-active',
            sticky: 'tabletrim-sticky',
        }
        // State data
        var _data = { 
            rootid: null,
            trimmed: false, 
            activeindex: null, 
            timeout: null,
            columns: null
        }
        // Element references
        var _elements = {
            window: $(window)
        }
        // Array of table columns
        var _columns = []

        /** 
         * Private object
         */
        _private = {

            /** 
             * Initialize
             */
            init: function(jq, opts) {
                // Extend default options
                $.extend(_options, opts);
                // Capture elements
                _elements.table = jq;
                _elements.table.addClass(_classes.table);
                // Set root id
                _private.setId();
                // Build necessary arrays and elements 
                _private.build();
                // Bind window resize
                _elements.window.on('resize', _private.resize);
                // Call the oninit callback
                if(typeof _options.oninit == 'function') _options.oninit(_elements.table);
                // Do an initial check of the width
                _private.check();
                // Return the public object
                return _public;
            },

            /** 
             * Build necessary elements and construct the columns array
             */
            build: function() {
                // Create an empty select box
                _elements.select = $('<select class="' + _classes.select + '"></select');
                // Create prev/next buttons
                if(_options.prev) _elements.prev = $('<button class="' + _classes.prev + '">' + _options.prevhtml + '</button>');
                if(_options.next) _elements.next = $('<button class="' + _classes.next + '">' + _options.nexthtml + '</button>');
                // Create and wire up the label
                if(_options.label) {
                    _elements.select.attr('id', 'tabletrim-select-' + _data.id);
                    _elements.label = $('<label for="tabletrim-select-' + _data.id + '">' + _options.labelhtml + '</label>');
                }
                // Loop all columns based on headers
                _elements.table.find('thead th').each(function() {
                    _data.columns = (_data.columns == null) ? 1 : _data.columns + 1;
                    // Build the columns array (1-indexed)
                    var index = $(this).index() + 1;
                    _columns[index] = {
                        index: index,
                        title: $(this).html(),
                        headercell: $(this),
                        allcells:  _elements.table.find('tr th:nth-child(' + index + '), tr td:nth-child(' + index + ')'),
                        bodycells: _elements.table.find('tbody tr th:nth-child(' + index + '), tbody tr td:nth-child(' + index + ')')
                    }
                    // Add an option to the select box for this column (only if not the sticky column)
                    var disabled = (index == _options.sticky) ? ' disabled="disabled"' : '';
                    $('<option value="' + index + '"' + disabled + '></option>').text(_columns[index].title).appendTo(_elements.select);                        
                });
                // Build controls
                _elements.controls = $('<div class="' + _classes.controls + '"></div>');
                if(_options.select) _elements.controls.append(_elements.select);
                if(_options.prev) _elements.controls.append(_elements.prev);
                if(_options.next) _elements.controls.append(_elements.next);
                // Build label
                if(_options.label) _elements.controls.prepend(_elements.label);
                // Set activeindex
                _data.activeindex = _options.init;
                // Bind events
                if(_options.select) {
                    _elements.select.on('change', function() {
                        var index = $(this).find(':selected').val();
                        _private.activate(index);
                    });                    
                }
                if(_options.prev) {
                    _elements.prev.on('click', function(e) {
                        e.preventDefault();
                        _private.activate(_data.prev);
                    });
                }
                if(_options.next) {
                    _elements.next.on('click', function(e) {
                        e.preventDefault();
                        _private.activate(_data.next);
                    });
                }
            },

            /** 
             * Create a unique id
             */
            setId: function() {
                _data.id = Math.random().toString(36).substr(2, 6);
                if($('table[data-tabletrimid=' + _data.id + ']').length) _private.setId();
                _elements.table.attr('data-tabletrimid', _data.id);
            },

            /** 
             * Helper function to set valid indexes for 'next' and 'prev'
             */
            setIndexes: function() {
                nextdelta = (_data.activeindex + 1 == _options.sticky) ? 2 : 1;
                prevdelta = (_data.activeindex - 1 == _options.sticky) ? 2 : 1;
                _data.next = (_data.activeindex + nextdelta <= _data.columns) ? _data.activeindex + nextdelta : 1;
                _data.prev = (_data.activeindex - prevdelta > 0) ? _data.activeindex - prevdelta : _data.columns;
            },

            /**
             * Wrapper for the check() function
             * This allows us to set a lag on the window.resize so that check() is only fired at the end of the resize event instead of at each step
             */
            resize: function() {
                // Set/refresh a timeout for the check function
                clearInterval(_data.timeout);
                _data.timeout = setTimeout(_private.check, _options.lag);
            },

            /** 
             * Check the window width and (un)trim the table as necessary
             */
            check: function() {
                if(_elements.table.width() > _options.breakpoint && _data.trimmed) _private.untrim();
                if(_elements.table.width() <= _options.breakpoint && !_data.trimmed) _private.trim(_options.init);
            },

            /** 
             * Trim the table
             * @param (int) i: Column to show upon initial trim
             */
            trim: function(i) {
                // Return false if already trimmed
                if(_data.trimmed) return false;
                // If no index was passed, use the init index
                if(typeof i == 'undefined') i = _options.init;
                // Add table class for CSS descendors
                _elements.table.addClass(_classes.trimmed);
                // Trigger the ontrim callback to make sure it happens before the onactivate callback
                if(typeof _options.ontrim == 'function') _options.ontrim(_elements.table);
                // Set the trimmed flag
                _data.trimmed = true;
                // Activate the sticky column
                _private.activate(_options.sticky);
                // Activate the selected column
                _private.activate(i);
            },

            /** 
             * Return the table to its default view
             */
            untrim: function() {
                // Return false if table is not trimmed
                if(!_data.trimmed) return false;
                // Remove the table CSS class
                _elements.table.removeClass(_classes.trimmed + ' ' + _classes.rtl + ' ' + _classes.ltr);
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
                // If the table is not already trimmed, trim it and return false
                // Trimming will re-call activate once the trim has finished
                if(!_data.trimmed) {
                    _private.trim(i);
                    return;
                }
                // If the column is the sticky column, just add sticky class
                if(i == _options.sticky) {
                    _columns[i].allcells.addClass(_classes.sticky);
                } else {
                    // Deactivate the active column
                    _private.deactivate();    
                    // Set the table direction depending on if the active column is before or after the sticky column
                    (i > _options.sticky) 
                        ? _elements.table.removeClass(_classes.rtl).addClass(_classes.ltr) 
                        : _elements.table.removeClass(_classes.ltr).addClass(_classes.rtl);
                    // Update the active index
                    _data.activeindex = parseInt(i);
                    // Add the controls
                    _private.addcontrols();
                    // Add the active class to all cells in the active column
                    _columns[i].allcells.addClass(_classes.active);
                    // Fire the onactivate callback
                    if(typeof _options.onactivate == 'function' && i != _options.sticky) _options.onactivate(_elements.table, _columns[i]);
                }
                // Update indexes
                _private.setIndexes();
            },

            /**
             * Deactivate a table column
             */
            deactivate: function() {
                // Remove the active class from the active column's cells
                _columns[_data.activeindex].allcells.removeClass(_classes.active);
                // Remove the controls from the active column header
                _private.removecontrols();
                // Fire the ondeactivate callback
                if(typeof _options.ondeactivate == 'function') _options.ondeactivate(_elements.table, _columns[_data.activeindex]);
            },

            /** 
             * Add the select control to the active table column
             */
            addcontrols: function() {
                // Don't add controls if it's the sticky column
                if(_data.activeindex == _options.sticky) return false;
                // Add/setup necessary controls
                if(_options.select) {
                    _elements.select.find('option:selected').removeAttr('selected');
                    _elements.select.find('option:nth-child(' + _data.activeindex + ')').attr('selected','selected');
                }
                // Clone the controls (including events to ensure that the change event is in place)
                var controls = _elements.controls.clone(true);
                // Remove the header cell title and replace it with the controls
                _columns[_data.activeindex].headercell.empty().append(controls);
            },

            /** 
             * Remove the select control from the active column
             */
            removecontrols: function() {
                // Remove the select box and replace the header cell title
                _columns[_data.activeindex].headercell.empty().text(_columns[_data.activeindex].title);
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
            },

        }

        // Initialize the plugin and return the public object
        return _private.init(jq, opts);

    }
}));
