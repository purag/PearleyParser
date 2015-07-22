tokenizers = [
    ["operand", /([0-9]+)/g],
    ["operator", /(\+|\-|\*|\/|\^)/g],
    ["parens", /(\(|\))/g]
];
var parser = new ParserGen(tokenizers);