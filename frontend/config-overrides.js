const webpack = require('webpack');

module.exports = function override(config) {
  const fallback = {
    "fs": false,
    "path": require.resolve("path-browserify"),
    "util": require.resolve("util/"),
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer/"),
    "process": require.resolve("process/browser"),
  };

  // Ensure resolve object exists
  if (!config.resolve) {
    config.resolve = {};
  }

  // Ensure fallback object exists
  if (!config.resolve.fallback) {
    config.resolve.fallback = {};
  }

  // Add fallbacks
  config.resolve.fallback = {
    ...config.resolve.fallback,
    ...fallback,
  };

  // Add plugins
  if (!config.plugins) {
    config.plugins = [];
  }

  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    })
  );

  // Add resolve aliases
  if (!config.resolve.alias) {
    config.resolve.alias = {};
  }

  config.resolve.alias = {
    ...config.resolve.alias,
    'path': require.resolve('path-browserify'),
    'util': require.resolve('util/'),
    'process/browser': require.resolve('process/browser'),
  };

  // Configure module rules to handle ESM modules
  if (!config.module) {
    config.module = {};
  }
  
  if (!config.module.rules) {
    config.module.rules = [];
  }

  // Add rule to handle process/browser in ESM modules
  // This is the critical fix for React Router ESM modules
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false
    }
  });

  // Add explicit rule for .mjs files to handle React Router better
  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: 'javascript/auto'
  });

  // Ensure extensions include .mjs
  if (!config.resolve.extensions) {
    config.resolve.extensions = ['.js', '.jsx', '.json'];
  }
  
  // Add .mjs extension if not already present
  if (!config.resolve.extensions.includes('.mjs')) {
    config.resolve.extensions.push('.mjs');
  }

  return config;
};