import * as R from "ramda";

const stringToArray = R.split("");

/* Question 1 */
//check !!!!

export const countVowels: (s: string) => number = R.pipe(
    stringToArray,
    R.filter((char: string) => 'AaEeIiOoUu'.includes(char)),
    R.length
    
  );



/* Question 2 */
const pop = (stack: string[], openParen: string, closeParen: string): string[] =>
    R.isEmpty(stack) ? [closeParen] :
        R.head(stack) === openParen ? R.tail(stack) : R.prepend(closeParen, stack);

const isOpen = (c: string): boolean =>
    c === "(" || c === "{" || c === "[";

const isLegal = (stack: string[], c: string): string[] =>
    isOpen(c) ? R.prepend(c, stack) :
        c === ")" ? pop(stack, "(", c) :
        c === "}" ? pop(stack, "{", c) :
        c === "]" ? pop(stack, "[", c) :

        stack;

export const isPaired: (s: string) => boolean = R.pipe(
    stringToArray,
    R.reduce(isLegal, []),
    R.isEmpty
);

/* Question 3 */
export type WordTree = {
    root: string;
    children: WordTree[];
}

export const treeToSentence = (t1: WordTree): string =>
    t1.children.length === 0 ? t1.root :
        t1.root + " " + R.map(treeToSentence,t1.children).join(" ");


