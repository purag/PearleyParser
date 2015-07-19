tokenizers = [
    ["operator", /([0-9]+)/g],
    ["operand", /(\+|\-|\*|\/|\^)/g],
    ["parens", /(\(|\))/g]
];

String.prototype.parse = new ParserGen(tokenizers);
String.prototype.parse.bind(this);