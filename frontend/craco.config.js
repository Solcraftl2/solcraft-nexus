// Load configuration from environment or config file
const path = require('path');
const webpack = require('webpack');

// Environment variable overrides
const config = {
  disableHotReload: process.env.DISABLE_HOT_RELOAD === 'true',
};

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig, { env, paths }) => {
      
      // Complete Node.js polyfills for Web3Auth, crypto libraries, and all dependencies
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        // Core polyfills
        stream: require.resolve("stream-browserify"),
        crypto: require.resolve("crypto-browserify"),
        buffer: require.resolve("buffer"),
        process: require.resolve("process/browser"),
        util: require.resolve("util"),
        assert: require.resolve("assert"),
        events: require.resolve("events"),
        path: require.resolve("path-browserify"),
        url: require.resolve("url"),
        querystring: require.resolve("querystring-es3"),
        os: require.resolve("os-browserify/browser"),
        
        // Additional polyfills for edge cases
        "process/browser": require.resolve("process/browser"),
        globalThis: false, // Use built-in globalThis
        
        // Disable Node.js modules that aren't needed in browser
        http: false,
        https: false,
        net: false,
        tls: false,
        zlib: false,
        fs: false,
        child_process: false,
        cluster: false,
        module: false,
        dgram: false,
        dns: false,
        readline: false,
        repl: false,
        tty: false,
        constants: false,
        vm: false,
      };

      // Provide global polyfills
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
          global: 'globalThis',
        }),
        // Define globals for better compatibility
        new webpack.DefinePlugin({
          global: 'globalThis',
          'process.env.NODE_ENV': JSON.stringify(env),
          'typeof globalThis': JSON.stringify('object'),
        }),
      ];

      // Fix for production builds and Vercel
      if (env === 'production') {
        // Ensure imports work correctly in production
        webpackConfig.resolve.symlinks = false;
        
        // Fix module resolution for production
        webpackConfig.resolve.alias = {
          ...webpackConfig.resolve.alias,
          'process/browser': require.resolve('process/browser'),
        };
      }

      // Fix ESM import issues
      webpackConfig.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      });
      
      // Disable hot reload completely if environment variable is set
      if (config.disableHotReload) {
        // Remove hot reload related plugins
        webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
          return !(plugin.constructor.name === 'HotModuleReplacementPlugin');
        });
        
        // Disable watch mode
        webpackConfig.watch = false;
        webpackConfig.watchOptions = {
          ignored: /.*/, // Ignore all files
        };
      } else {
        // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
          ],
        };
      }
      
      return webpackConfig;
    },
  },
};