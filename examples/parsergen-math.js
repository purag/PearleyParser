tokenizers = [
    ["operator", /([0-9]+)/g],
    ["operand", /(\+|\-|\*|\/|\^)/g],
    ["parens", /(\(|\))/g]
];

var parser = new ParserGen(tokenizers);

String.prototype.tokenize = parser.tokenize;
String.prototype.parse.bind(this);

String.prototype.parse = parser.parse;
String.prototype.parse.bind(this);