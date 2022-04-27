import esbuild from 'esbuild';
import path from 'path';
import crypto from 'crypto';
import { promises as fs } from 'fs';

esbuild.build({
    entryPoints: ['./src/index.mts'],
    format: 'esm',
    bundle: true,
    // minify: true,
    outdir: './dist',
    outExtension: {
        '.js': '.mjs'
    },
    plugins: [{
        name: 'cf-wasm',
        setup(build) {
            build.onResolve({ filter: /\.wasm$/, namespace: 'file' }, args => ({
                path: args.path,//path.resolve(args.resolveDir, args.path),
                namespace: 'wasm-file',
                pluginData: {
                    absPath: path.resolve(args.resolveDir, args.path)
                }
            }));
            build.onLoad({ filter: /.*/, namespace: 'wasm-file' }, async args => {

                const sourcePath = args.pluginData.absPath;
                const sourceContent = await fs.readFile(sourcePath);
                const sourceSha1 = crypto.createHash('sha1').update(sourceContent).digest('hex');
                const sourceHash = sourceSha1.slice(0, 8).toUpperCase();
                const sourcePathParts = path.parse(sourcePath)
                const destDir = build.initialOptions.outdir || '.';
                const destPath = path.format({
                    name: `${sourcePathParts.name}-${sourceHash}`,
                    ext: sourcePathParts.ext,
                    dir: destDir
                });
                const importPath = path.relative(destDir, destPath);
                await fs.cp(args.pluginData.absPath, destPath, { errorOnExist: true });
                return {
                    contents: `
                        import wasm from ${JSON.stringify(importPath)};
                        module.exports = wasm;
                    `,
                }
            });
            // Mark .wasm files imported from our module as external
            build.onResolve({ filter: /\.wasm$/, namespace: 'wasm-file' }, args => ({
                path: args.path,
                external: true,
            }));
            const opts = build.initialOptions;
            opts.loader = opts.loader || {};
            opts.loader['.wasm'] = 'file';
        }
    }]
}).catch(console.error);
