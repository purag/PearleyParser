tokenizers = [
    ["identifier", /([A-Za-z_][A-Za-z_0-9]*)/g],
    ["number", /([0-9]+)/g],
    ["parens", /(\(|\))/g],
    ["comma", /(\,)/g],
    ["scope", /(\{|\})/g],
    ["semicolon", /(;)/g],
    ["assignment", /(\=)/g],
    ["string", /(".*")/g],
    ["character", /('.')/g]
];

String.prototype.parse = new ParserGen(tokenizers);
String.prototype.parse.bind(this);