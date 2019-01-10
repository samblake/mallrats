import resolve from 'rollup-plugin-node-resolve';
 
export default {
    externals: 'd3',
    input: 'build/mallrats.js',
    output: {
        file: 'dist/js/mallrats.js',
        name: 'mallrats', 
        format: 'umd'
    },
    plugins: [
        resolve()
    ]
};