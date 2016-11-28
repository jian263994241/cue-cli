module.exports = {
  "parser": "babel-eslint",
  "extends": ["eslint:recommended", "plugin:react/recommended"],
  "globals":{
    "__uri": true,
    "__inline": true,
    "require2": true,
    "KQB": true,
    "React" : true,
    "ReactDOM": true,
    "$": true,
    "$$": true,
    "_": true,
    "Framework7": true,
    "Dom7": true,
    "app": true
  },
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true
  },
  "parserOptions": {
    "ecmaFeatures": {
      "experimentalObjectRestSpread": true,
      "jsx": true
    },
    "sourceType": "module"
  },
  "plugins": [ "react", "babel" ],
  "rules": {
    "react/prop-types": "off",
    "no-console": "off",
    "no-undef": ["warn"],
    "no-unused-vars": ["warn", { "vars": "all", "args": "after-used" }],
    "linebreak-style": [ "error", "unix" ],
    "quotes": [ "warn", "single" ],
    "semi": [ "error", "always" ]
  }
};