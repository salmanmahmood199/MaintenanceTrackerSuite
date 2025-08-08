const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': './src',
  '@shared': '../../shared',
  '@assets': './assets'
};

module.exports = config;