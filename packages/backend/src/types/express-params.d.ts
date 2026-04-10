// Override ParamsDictionary to use string-only values, matching runtime behavior
// Express route params are always strings at runtime; the string[] union is a TS quirk.
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface ParamsDictionary {
    [key: string]: string;
  }
}
