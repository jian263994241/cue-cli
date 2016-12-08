var globals = ["process", "global", "window", "__filename", "__dirname", "__uri", "__inline", "__lazyload", "require2", "KQB", "app", "Dom7", "Framework7", "_", "$$", "$", "ReactDOM", "React"];

var globalsTrue = {};

globals.forEach(function(key) {
  globalsTrue[key] = true;
});


module.exports = {
  "parser": "babel-eslint",
  "extends": ["eslint:recommended", "plugin:react/recommended"],
  "globals": globalsTrue,
  "env": {
    "browser": true,
    "commonjs": true,
    "amd": true,
    "es6": true
  },
  "parserOptions": {
    "ecmaFeatures": {
      "experimentalObjectRestSpread": true,
      "jsx": true
    },
    "sourceType": "module"
  },
  "plugins": ["react", "babel"],
  "rules": {
    "react/prop-types": "off",
    "react/display-name": "off",
    "no-console": "off",
    "no-undef": ["warn"],
    "no-unused-vars": ["warn", {
      "vars": "all",
      "args": "after-used"
    }],
    "linebreak-style": ["error", "unix"],
    "quotes": "off",
    "semi": ["error", "always"]
  }
};
