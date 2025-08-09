const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Customize the config before returning it
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
      'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter$': 'react-native-web/dist/vendor/react-native/NativeEventEmitter/RCTDeviceEventEmitter',
      'react-native/Libraries/vendor/emitter/EventEmitter$': 'react-native-web/dist/vendor/react-native/emitter/EventEmitter',
    },
  };
  
  return config;
};