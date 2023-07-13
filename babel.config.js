module.exports = function (api) {
  api.cache(false);
  return {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [ 
      [
        'module:react-native-dotenv',
        {
          envName: 'APP_ENV',
          moduleName: '@env',
          path: '.env',
          blocklist: null,
          allowlist: null,
          safe: true,
          allowUndefined: false
        }
      ],
      [
        'react-native-reanimated/plugin',
        {
          globals: ['__scanCodes']
        }
      ]
    ],
  }
};