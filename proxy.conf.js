const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8081';

module.exports = {
  '/api': {
    target: backendUrl,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug'
  }
};
