require('esbuild').build({
    entryPoints: ['server/server.js'],
    outfile: 'server/bundle/server-bundle.js',
    bundle: true,
    platform: 'node',
    external: ['esbuild'], // if needed
  }).catch(() => process.exit(1));
  