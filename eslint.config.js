// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "pos-mobile/**", "public/**", "docs/**", "diagrams/**"],
    rules: {
      // The migrated POS codebase still contains legacy React Native animation
      // and large-screen component patterns. Keep these as modernization debt
      // instead of blocking the initial full-flow port.
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/purity": "off",
      "react/no-unescaped-entities": "off",
    },
  }
]);
