grammar Hotel;

//  Expressions
  /// Global
  program: (statement EOL*)* statement EOL*;
  statement: assign;

  /// Assignations
  assign: VARIABLE ASSIGN value;

//  Keywords


//  Operators
  /// Assignation
  ASSIGN: '=';

  /// Accessor
  DOT: '.';

  /// Containment
  SIMPLE_QUOTE: '\'';
  DOUBLE_QUOTE: '"';

  /// Maths
  ADD: '+';
  SOUSTRACT: '-';
  TIME: '*';
  DIVIDE: '/';

  /// Comparison
  GREATER: '>';
  LESS: '<';
  GREATER_EQ: GREATER ASSIGN;
  LESS_EQ: LESS ASSIGN;
  EQUALS: ASSIGN{2};


// Types
  value: string
      | VARIABLE
      | INTEGER
      | FLOAT
      ;

  /// Strings
  string: (SIMPLE_QUOTE .*? SIMPLE_QUOTE)
        | (DOUBLE_QUOTE .*? DOUBLE_QUOTE);

  VARIABLE: ALPHA (ALPHA|DIGIT)*;

  /// Atomical
  ALPHA: [a-zA-Z];
  DIGIT: [0-9];

  /// Digits
  INTEGER: DIGIT+;
  FLOAT: (DIGIT* DOT DIGIT+)
         | (DIGIT+ DOT DIGIT*);


// Other
IGNORE: [ \t\r\n]+  -> channel(HIDDEN);