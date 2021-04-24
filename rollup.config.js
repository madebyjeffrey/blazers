import typescript from '@rollup/plugin-typescript';
import run from '@rollup/plugin-run';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { sveltePreprocess } from 'svelte-preprocess/dist/autoProcess';
import { spawn } from 'child_process';
import { terser } from 'rollup-plugin-terser';
import svelte from 'rollup-plugin-svelte';
import css from 'rollup-plugin-css-only';

const dev = process.env.ROLLUP_WATCH === 'true';

const serve = () => {
    let server;

    const toExit = () => {
        if (server) {
            server.kill(0);
        }
    };

    return {
        writeBundle: () => {
            if (server) return;

            server = spawn('npm', ['run', 'start', '--', '--dev'], {
                studio: ['ignore', 'inherit', 'inherit'],
                shell: true 
            });

            process.on('SIGTERM', toExit);
            process.on('exit', toExit);
        }
    }
}

const backend = {
    input: 'src-backend/app.ts',
    output: {
        dir: 'output',
        format: 'cjs'
    },
    plugins: [typescript({
        tsconfig: './tsconfig.express.json'
    }), json(), commonjs(), nodeResolve(), dev && run()]
};

const frontend = {
    input: 'src-frontend/main.ts',
    output: {
        sourcemap: true,
        format: 'iife', 
        name: 'app',
        file: 'public/build/bundle.js'
    },
    plugins: [
        svelte({
            preprocess: sveltePreprocess({ sourceMaps: dev }),
            compilerOptions: {
                // enable run-time checks when not in production
                dev
            },            
        }),
        css({ output: 'bundle.css' }),
        nodeResolve({
            browser: true,
            dedupe: ['svelte']
        }),
        commonjs(),
        typescript({
            sourceMap: dev,
            inlineSources: dev,
            tsconfig: './tsconfig.svelte.json'
        }),
        // use npm run start
        dev && serve(),
        dev && livereload('public'),
        !dev && terser()
    ],
    watch: {
        clearScreen: false
    }
}

export default [ backend, frontend];