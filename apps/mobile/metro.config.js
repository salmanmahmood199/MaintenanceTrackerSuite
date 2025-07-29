const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add the monorepo root to the watchFolders
config.watchFolders = [
  path.resolve(__dirname, '../../')
];

// Add support for shared packages
config.resolver.alias = {
  '@shared': path.resolve(__dirname, '../../shared'),
  '@maintenance/shared': path.resolve(__dirname, '../../packages/shared'),
};

module.exports = config;