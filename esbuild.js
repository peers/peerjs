const esbuild = require('esbuild')

// To clean:
// const fs = require('fs')
// fs.rmSync('dist', { recursive: true, force: true })
// fs.mkdirSync('dist')

const isNonMinified = process.argv[2] === 'nonminified'

esbuild
    .build({
        entryPoints: ['lib/exports.ts'],
        outfile: isNonMinified ? 'dist/peerjs.js' : 'dist/peerjs.min.js',
        minify: !isNonMinified,
        bundle: true,
        sourcemap: true,
        format: 'esm',
        target: 'es6'
    })
    .catch(() => process.exit(1))