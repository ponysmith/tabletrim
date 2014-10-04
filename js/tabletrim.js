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
            prev: true, // Show a button to switch to previous column
            next: true, // Show a button to switch to next column
            prevhtml: '&lsaquo;', // HTML to use for prev button
            nexthtml: '&rsaquo;', // HTML to use for next button


            sticky: 1, // Column which should always be displayed (starting at 1)
            init: 2, // Initial column to show when trim is initialized (starting at 1)
            breakpoint: 640, // Width at which to (un)trim the table
            lag: 100, // Lag variable in milliseconds to wait before triggering window.resize check
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
            breakpoints: 640
        }
        // State data
        var _data = { 
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
                // Build necessary arrays and 
                _private.build();
                // Bind window resize
                _elements.window.on('resize', _private.resize);
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
             * Helper function to set valid indexes for 'next' and 'prev'
             */
            setIndexes: function() {
                nextdelta = (_data.activeindex + 1 == _options.sticky) ? 2 : 1;
                prevdelta = (_data.activeindex - 1 == _options.sticky) ? 2 : 1;
                _data.next = (_data.activeindex + nextdelta < _data.columns) ? _data.activeindex + nextdelta : 1;
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
                if(_elements.window.width() > _options.breakpoint && _data.trimmed) _private.untrim();
                if(_elements.window.width() <= _options.breakpoint && !_data.trimmed) _private.trim(_options.init);
            },

            /** 
             * Trim the table
             */
            trim: function(i) {
                // Add table class for CSS descendors
                _elements.table.addClass(_classes.trimmed);
                // Activate the sticky column
                _private.activate(_options.sticky);
                // Activate the selected column
                _private.activate(i);
                // Set the trimmed flag
                _data.trimmed = true;
            },

            /** 
             * Return the table to its default view
             */
            untrim: function() {
                // Remove the table CSS class
                _elements.table.removeClass(_classes.trimmed + ' ' + _classes.rtl + ' ' + _classes.ltr);
                // Deactivate the active column
                _private.deactivate();
                // Set the trimmmed flag
                _data.trimmed = false;
            },

            /** 
             * Activate a table column and switch to it
             */
            activate: function(i) {
                // Deactivate the active column
                _private.deactivate();    
                // If the column is the sticky column, just add sticky class
                if(i == _options.sticky) {
                    _columns[i].allcells.addClass(_classes.sticky);
                } else {
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

        }

        return _private.init(jq, opts);

    }
}));
