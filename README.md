# tabletrim

[![CircleCI](https://circleci.com/gh/ponysmith/tabletrim.svg?style=svg)](https://circleci.com/gh/ponysmith/tabletrim)

**tabletrim.js** is a small Javascript utility for collapsing table columns and making them user-selectable


## Dependencies
None


## Usage
Once you have included the `tabletrim.js` and `tabletrim.css` files in your page, you can initialize the plugin by calling
the `tabletrim()` function. The `tabletrim()` function takes two parameters:

* table: DOM node representing the table
* options (optional): Options object. For details about available options, see the Options page.

To instantiate a tabletrim object, call the `tabletrim()` function and pass in the parameter(s):

```
var options = { init: 3 }
tabletrim(document.getElementById('mytable'), options);
```

## Additional docs
For additional documentation about tabletrim.js and a listing of options, visit:

http://ponysmith.github.io/tabletrim
