const path = require('path');

module.exports = function (api) {
  api.cache(true);

  // Resolve the plugin path explicitly inside this project to avoid picking up a user-level install.
  const reanimatedPlugin = path.join(__dirname, 'node_modules', 'react-native-reanimated', 'plugin', 'index.js');

  return {
    presets: ['babel-preset-expo'],
    plugins: [reanimatedPlugin],
  };
};
