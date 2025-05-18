module.exports = {
  // ...existing config...
  module: {
    rules: [
      // ...existing rules...
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: [
          /node_modules[\\/]lucide-react[\\/]/
        ],
      },
    ],
  },
  // ...existing config...
};