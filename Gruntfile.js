module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),      
        uglify: {
            my_target: {
                files: {
                    'js/tabletrim.min.js': ['js/tabletrim.js']
                }
            }
        },
        cssmin: {
            add_banner: {
                options: {
                    banner: '/* tabletrim.js | https://github.com/ponysmith/tabletrim */'
                },
                files: {
                    'css/tabletrim.min.css': ['css/**/*.css']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('default', ['uglify', 'cssmin']);

}
