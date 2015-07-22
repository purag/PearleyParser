function ParserGen (tokenizers) {
    var parsergen = this instanceof ParserGen ? this : Object.create(ParserGen.prototype);
    var lex = new Lex(tokenizers);

    parsergen.tokenize = function (src, cb) {
        if (lex.isEmpty()) {
            console.warn("No tokenizers defined; parse aborted.");
            return [];
        }

        var tokens = [];
        var index = 0;

        lex.setIndex(0);
        while (index < src.length) {
            var match = lex.match(src);
            if (!match) break;
            tokens.push(match.token);
            index = match.tokenizer.pattern.lastIndex;
            lex.setIndex(index);
        }
        
        return cb ? cb(tokens) : tokens;
    };

    return parsergen;

    function Lex (tokenizers) {
        var lex = this instanceof Lex ? this : Object.create(Lex.prototype);
        var dict = [];

        for(var i = 0; i < tokenizers.length; i++)
            dict[i] = new Tokenizer(tokenizers[i][0], tokenizers[i][1]);

        lex.isEmpty = function () {
            return !dict.length;
        };

        lex.getDict = function () {
            return dict;
        };

        lex.match = function (src) {
            for (var i in dict) {
                dict[i].test(src);
            }

            if (!lex.closest()) {
                console.warn("No tokens found.");
                return null;
            }

            return {
                tokenizer: lex.closest(),
                token: lex.closest().getMatch(src)
            };
        };

        lex.setIndex = function (index) {
            for (var i in dict)
                dict[i].setIndex(index);
        };

        lex.closest = function () {
            var closest;
            for (var i in dict)
                if (dict[i].nextMatch && ( !closest || dict[i].nextMatch.index < closest.nextMatch.index))
                   closest = dict[i];
            return closest;
        };
    
        return lex;

        function Tokenizer (type, pattern) {
            var tokenizer = this instanceof Tokenizer ? this : Object.create(Tokenizer.prototype);
            tokenizer.type = type;
            tokenizer.pattern = pattern;
            tokenizer.nextMatch = null;
            
            tokenizer.setIndex = function (index) {
                tokenizer.pattern.lastIndex = index;
            };

            tokenizer.test = function (src) {
                var oldIndex = tokenizer.pattern.lastIndex;
                tokenizer.nextMatch = tokenizer.pattern.exec(src);
                tokenizer.setIndex(oldIndex);
            };

            tokenizer.getMatch = function (src) {
                return {
                    type: tokenizer.type,
                    value: tokenizer.pattern.exec(src)[1]
                };
            };

            return tokenizer;
        }
    }
}