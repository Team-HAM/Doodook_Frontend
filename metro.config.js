// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// SVG를 컴포넌트처럼 import
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

// svg를 asset에서 제외하고 source로 포함
const { assetExts, sourceExts } = config.resolver;
config.resolver.assetExts = assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...sourceExts, 'svg'];

module.exports = config;
