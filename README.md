tabletrim
=========

tabletrim.js is a small Javascript utility for collapsing table columns and making them user-selectable


Dependencies
-------------
tabletrim.js required jQuery 1.7+ to function


Usage
-------------
Once you have included the `tabletrim.js` and `tabletrim.css` files in your page, you can initialize the plugin by calling 
the `tabletrim()` function. The `tabletrim()` function takes two parameters:

* obj (required): jQuery object(s) that you want the plugin to manipulate
* options (optional): Options object. For details about available options, see the Options page.
While not a traditional jQuery plugin, tabletrim does rely on jQuery, so make sure you're calling the `tabletrim()` function within your `$(document).ready()` block.  

To instantiate a tabletrim object, call the `tabletrim()` function and pass in the parameter(s):

    var options = {}
    tabletrim($('#mytable'), options);


Additional docs
-----------------
For additional documentation about tabletrim.js, visit:

http://ponysmith.github.io/tabletrim
