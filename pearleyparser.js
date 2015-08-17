/* Author:  Purag Moumdjian
 * File:    ParserGen.js
 * Date:    21 July 2015 (v0.1 pre-release)
 * License: GNU General Public License v2.0
 * 
 * ParserGen is a text parsing tool that tokenizes text according to the
 * tokenizers passed in and creates parse trees according to the context free
 * grammar passed in.
 */

function PearleyParser (lexRules, bnf) {
    var bnfLexRules = [
        ["identifier", /([A-Za-z_][A-Za-z_0-9]+)/g],
        ["symbols", /(::=|\||;)/g],
        ["regex", /(\/.*?\/)/g],
        ["terminal", /(['"].+?["'])/g]
    ];

    var bnfGrammar = [
        new State({
            type: "sequence",
            rule: [{
                type: "sequence",
                value: null
            }, {
                type: "sequence",
                value: null
            }],
            next: 0,
            source: 0
        }),
        new State({
            type: "sequence",
            rule: [{
                type: "rule",
                value: null
            }],
            next: 0,
            source: 0
        }),
        new State({
            type: "rule",
            rule: [{
                type: "identifier",
                value: null
            }, {
                type: "symbol",
                value: "::="
            }, {
                type: "expression",
                value: null
            }, {
                type: "terminator",
                value: ";"
            }],
            next: 0,
            source: 0
        }),
        new State({
            type: "expression",
            rule: [{
                type: "expression",
                value: null
            }, {
                type: "separator",
                value: "|"
            }, {
                type: "expression",
                value: null
            }],
            next: 0,
            source: 0
        }),
        new State({
            type: "expression",
            rule: [{
                type: "expression",
                value: null
            }, {
                type: "expression",
                value: null
            }],
            next: 0,
            source: 0
        }),
        new State({
            type: "expression",
            rule: [{
                type: "term",
                value: null
            }],
            next: 0,
            source: 0
        }),
        new State({
            type: "term",
            rule: [{
                type: "nonterminal",
                value: null
            }],
            next: 0,
            source: 0
        }),
        new State({
            type: "term",
            rule: [{
                type: "terminal",
                value: /(?:['"])(.+)(?:['"])/
            }],
            next: 0,
            source: 0
        }),
        new State({
            type: "nonterminal",
            rule: [{
                type: "nonterminal",
                value: /([A-Za-z_][A-Za-z_0-9]+)/
            }],
            next: 0,
            source: 0
        }),
        new State({
            type: "term",
            rule: [{
                type: "regex",
                value: /(?:\/)(.*?)(?:\/)/
            }],
            next: 0,
            source: 0
        }),
        new State({
            type: "term",
            rule: [{
                type: "expression",
                value: null
            }],
            next: 0,
            source: 0
        }),
        new State({
            type: "identifier",
            rule: [{
                type: "identifier",
                value: /([A-Za-z_][A-Za-z_0-9]+)/
            }],
            next: 0,
            source: 0
        })
    ];

    var bnfParser = new Parser(bnfLexRules, bnfGrammar);
    var cfgTree = bnfParser.parse(bnf);
    var cfg = evaluate(cfgTree);
    
    // **********************
    // * magic happens here *
    // **********************
    return new Parser(lexRules, cfg);
    // TODO: parse user-inputted lex rules. pretty useless without that. have to manually input a compatible set of lex rules.
    
    function evaluate (tree) {
        var currentrule = null,
            currentstate = null,
            grammar = [];

        recurse(tree);

        function recurse(tree) {
            for (var i = 0; i < tree.children.length; i++) {
                var node = tree.children[i];
                if (node.children.length) {
                    recurse(node);
                } else {
                    if (node.data.type === "identifier") {
                        currentrule = node.data.value;

                    } else if (node.data.type === "symbol" || node.data.type === "separator") {
                        if (currentstate !== null) grammar.push(currentstate);
                        currentstate = new State({
                            type: currentrule,
                            rule: [],
                            next: 0,
                            source: 0
                        });

                    } else if (node.data.type === "terminal") {
                        currentstate.expand({
                            type: null,
                            value: node.data.value
                        });

                    } else if (node.data.type === "nonterminal") {
                        currentstate.expand({
                            type: node.data.value,
                            value: null
                        });

                    } else if (node.data.type === "regex") {
                        currentstate.expand({
                            type: null,
                            value: new RegExp(node.data.value)
                        });

                    } else if (node.data.type === "terminator") {
                        if (currentstate !== null) grammar.push(currentstate);
                        currentstate = null;
                        currentrule = null;
                    }
                }
            }
        }
        return grammar;
    }
    
    function Parser (lexRules, grammar) {
        var tokenized = null;
        lexer = new Lexer(lexRules);
        
        var tokenize = function (src) {
            tokenized = lexer.tokenize(src);
            return tokenized;
        };
        
        /* perform the earley parse algorithm */
        this.parse = function (src) {
            var tbl = [];
            tbl[0] = new EarleySet();
            
            var tokens = tokenize(src);

            /* TODO: keep track of nullable elements so we can use empty rules */
            var nullable = [];

            /* start with all possible rules */
            for (var g in grammar) tbl[0].pushState(grammar[g]);

            for (var i = 0; i <= tokens.length; i++) {
                /* create the next set unless we're at the end of our input tokens */
                if (i < tokens.length) tbl[i + 1] = new EarleySet();
                var set = tbl[i],
                    nextSet = tbl[i + 1];

                /* go through each state in this set */
                for (var j = 0; j < set.length; j++) {
                    var curState = set.getState(j),
                        nextWord = curState.nextWord();

                    /* production rule is incomplete */
                    if (!curState.complete()) {

                        /* scan the next token if it's terminal */
                        if (nextWord.value != null && i < tokens.length) {
                            /* if the word in the production rule is a regexp, test to see if the
                             * next token matches. if not, check if the text is literally the same */
                            if ((nextWord.value instanceof RegExp && nextWord.value.test(tokens[i].value)) || nextWord.value == tokens[i].value) {
                                var newState = curState.advance();
                                var value = nextWord.value instanceof RegExp ? nextWord.value.exec(tokens[i].value)[1] : tokens[i].value;
                                newState.ast.newChild({
                                    type: nextWord.type || tokens[i].type,
                                    value: value
                                });
                                /* we have a match, so advance the marker and push this state to the next set */
                                nextSet.pushState(newState);
                            }

                        /* predict rules we might see next from the grammar */
                        } else {
                            for (var g = 0; g < grammar.length; g++) {
                                if (nextWord.type == grammar[g].type) {
                                    set.pushState(grammar[g].setSource(i));
                                }
                            }
                        }

                    /* complete this production rule; move the marker beyond any word(s) with the
                     * same type as this completed rule */
                    } else {
                        for (var l = 0; l < tbl[curState.source].length; l++) {
                            var oldState = tbl[curState.source].getState(l),
                                wordToCheck = oldState.nextWord();
                            /* if the completed rule satisfies the next word for the old state... */
                            if (!oldState.complete() && curState.type == wordToCheck.type) {
                                if (i === 6) console.log("completing " + oldState.type);
                                var newState = oldState.advance();
                                newState.ast.newChild(curState.ast);
                                /* then advance the old state and push it to this set to evaluate soon */
                                set.pushState(newState);
                            }
                        }
                    }
                }
            }
            console.log(tbl);
            
            var ideal = null;
            /* find the ideal resultant parse. should be the one with the longest rule among those
             * which are complete and originate from the beginning of the parse */
            for (var m = tbl[i - 1].length - 1; m >= 0; m--) {
                if (tbl[i - 1].getState(m).complete() && tbl[i - 1].getState(m).source === 0) {
                    if (ideal === null || tbl[i - 1].getState(m).length > ideal.length)
                        ideal = tbl[i - 1].getState(m);
                }
            }
            /* if one wasn't found, the parse failed */
            return ideal ? ideal.ast : ["Parse failed."];
        }
    
        /* a set of states for production rules */
        function EarleySet () {
            this.set = [];
            this.length = 0;

            /* check whether a given state exists in this set */
            function contains (state) {
                for (var i = 0; i < this.length; i++) {
                    if (this.set[i].equals(state)) return true;
                }
                return false;
            }
            var containsState = contains.bind(this);

            /* push a unique state to this set */
            this.pushState = function (state) {
                if (!containsState(state)) {
                    this.set.push(state);
                    this.length++;
                }
            };

            /* get the state at the given index of this set */
            this.getState = function (index) {
                return index < this.length ? this.set[index] : null;
            };
        }
    }
    
    function Lexer (tokenizers) {
        var lex = new Lex(tokenizers);

        this.tokenize = function (src, cb) {
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

        function Lex (tokenizers) {
            var dict = [];

            for(var i = 0; i < tokenizers.length; i++) {
                dict[i] = new Tokenizer(tokenizers[i][0], tokenizers[i][1]);
            }

            this.isEmpty = function () {
                return !dict.length;
            };

            this.getDict = function () {
                return dict;
            };

            this.match = function (src) {
                for (var i in dict) {
                    dict[i].test(src);
                }

                if (!this.closest()) {
                    console.warn("No tokens found.");
                    return null;
                }

                return {
                    tokenizer: this.closest(),
                    token: this.closest().getMatch(src)
                };
            };

            this.setIndex = function (index) {
                for (var i in dict)
                    dict[i].setIndex(index);
            };

            this.closest = function () {
                var closest;
                for (var i in dict)
                    if (dict[i].nextMatch && ( !closest || dict[i].nextMatch.index < closest.nextMatch.index))
                       closest = dict[i];
                return closest;
            };

            function Tokenizer (type, pattern) {
                this.type = type;
                this.pattern = pattern;
                this.nextMatch = null;

                this.setIndex = function (index) {
                    this.pattern.lastIndex = index;
                };

                this.test = function (src) {
                    var oldIndex = this.pattern.lastIndex;
                    this.nextMatch = this.pattern.exec(src);
                    this.setIndex(oldIndex);
                };

                this.getMatch = function (src) {
                    return {
                        type: this.type,
                        value: this.pattern.exec(src)[1]
                    };
                };
            }
        }
    }

    /* a node in an abstract syntax tree with an arbitrary number of children */
    function ASTNode (obj) {
        /* if we were given another ASTNode, copy its contents */
        /* otherwise, proceed normally */
        this.data = obj instanceof ASTNode ? obj.data : obj;
        this.children = obj instanceof ASTNode ? obj.children.slice(0) : [];

        /* push a child to this node's list of children */
        this.newChild = function (obj) {
            this.children.push(obj instanceof ASTNode ? obj : new ASTNode(obj, 0));
        };
    }

    /* a specific state for a production rule */
    function State (obj) {
        this.type = obj.type;
        this.rule = obj.rule;
        this.next = obj.next;
        this.source = obj.source;
        this.length = obj.length || obj.rule.length;
        /* clone the object's AST if it has one; if not, make a new one with this state's type */
        this.ast = new ASTNode(obj.ast ? obj.ast : this.type);

        /* add an item to this rule's expansion */
        this.expand = function (item) {
            this.rule.push(item);
            this.length++;
        };

        /* return an identical state with the marker advanced one word */
        this.advance = function () {
            var newState = new State(this);
            newState.next++;
            return newState;
        };

        /* return an identical state with the source property set to that specified */
        this.setSource = function (src) {
            var newState = new State(this);
            newState.source = src;
            return newState;
        };

        /* check if this production rule has been completed */
        this.complete = function () {
            return this.next >= this.rule.length;
        };

        /* get the next word to match */
        this.nextWord = function () {
            if (this.complete()) return null;
            return this.rule[this.next];
        };

        /* compare this state to the one given */
        this.equals = function (state) {
            if (this.length !== state.length) return false;

            for (var i = 0; i < this.rule.length; i++) {
                if (this.rule[i].type !== state.rule[i].type) return false;
                if (this.rule[i].value !== state.rule[i].value) return false;
                if (this.rule[i].terminal !== state.rule[i].terminal) return false;
            }

            if (this.type !== state.type) return false;
            if (this.source !== state.source) return false;
            if (this.next !== state.next) return false;

            return true;
        };
    }
}