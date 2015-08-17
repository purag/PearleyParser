# PearleyParser
A parser generator using the Earley parsing algorithm.

PearleyParser supports built-in lexical analysis and parse tree generation. The result of the `parse()` function is a completed parse tree, if it exists, or a `"Parse failed"` message.

### Coming Soon:
A walkthrough of the algorithm used here!

## TODO:
1. Parse user lex rules to generate tokenizers for the lexer.
2. Determine the ideal parse more effectively. It's not always the longest.