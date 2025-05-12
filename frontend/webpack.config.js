module.exports = {
  devServer: {
    allowedHosts: ['localhost', '127.0.0.1'],
    host: 'localhost',
    port: 3000,
    setupMiddlewares: (middlewares, devServer) => {
      // You can insert custom middleware here if needed
      // Example: devServer.app.use('/api', createProxyMiddleware({ target: 'http://localhost:5000' }));
      
      return middlewares;
    }
  }
};

