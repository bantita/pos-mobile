const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ปิด Expo Router — ใช้ index.js เป็น entry point
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];

module.exports = config;
