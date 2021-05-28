import resolve from '@rollup/plugin-node-resolve'; // locate and bundle dependencies in node_modules (mandatory)
import { terser } from "rollup-plugin-terser"; // code minification (optional)

export default {
	input: 'src/index.js',
	output: [
		{
			format: 'es',
			name: 'canvas-heatmap',
			file: 'dist/canvas-heatmap.min.js'
		}
	],
	plugins: [ resolve(), terser() ]
};