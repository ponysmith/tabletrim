module.exports = function(config) {
  config.set({
    frameworks: ['jasmine-jquery','jasmine'],
    browsers: ['PhantomJS'],
    files: [
      { pattern: 'src/js/tabletrim.js', watched: true, nocache: true },
      { pattern: 'src/css/tabletrim.css', watched: true, nocache: true },
      { pattern: 'spec/javascripts/*.js', watched: true, nocache: true },
      { pattern: 'spec/fixtures/*.html', watched: true, nocache: true },
    ],
    reporters: ['dots']
  });
};
