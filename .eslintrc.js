module.exports = {
    "env": {
        "browser": true,
        "node": true,
        "commonjs": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
    },
    "rules": {
        "indent": ["error", 2],
        "quotes": [2, "single", "avoid-escape"],
    },
    "plugins": [
        "html"
    ]
}
