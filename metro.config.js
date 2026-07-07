const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');
config.server.enhanceMiddleware = (middleware) => (request, response, next) => {
  response.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  return middleware(request, response, next);
};
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@/assets/')) {
    return context.resolveRequest(
      context,
      path.join(__dirname, 'assets', moduleName.slice('@/assets/'.length)),
      platform
    );
  }

  if (moduleName.startsWith('@/')) {
    return context.resolveRequest(
      context,
      path.join(__dirname, 'src', moduleName.slice(2)),
      platform
    );
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, {
  input: './src/global.css',
});
