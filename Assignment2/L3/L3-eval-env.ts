// L3-eval.ts
// Evaluator with Environments model

import { map } from "ramda";
import { isBoolExp, isCExp, isLitExp, isNumExp, isPrimOp, isStrExp, isVarRef,
         isAppExp, isDefineExp, isIfExp, isLetExp, isProcExp,
         Binding, VarDecl, CExp, Exp, IfExp, LetExp, ProcExp, Program,
         parseL3Exp,  DefineExp,
         isClassExp, // L31 
         ClassExp} from "./L3-ast";
import { applyEnv, makeEmptyEnv, makeExtEnv, Env } from "./L3-env-env";
import { isClosure, makeClosureEnv, Closure, Value, ClassValue, Object, isClassValue,makeClassValueEnv, isObject, makeObjectEnv, isSymbolSExp } from "./L3-value";
import { applyPrimitive } from "./evalPrimitive";
import { allT, first, rest, isEmpty, isNonEmptyList } from "../shared/list";
import { Result, makeOk, makeFailure, bind, mapResult } from "../shared/result";
import { parse as p } from "../shared/parser";
import { format } from "../shared/format";

// ========================================================
// Eval functions

const applicativeEval = (exp: CExp, env: Env): Result<Value> =>
    isNumExp(exp) ? makeOk(exp.val) :
    isBoolExp(exp) ? makeOk(exp.val) :
    isStrExp(exp) ? makeOk(exp.val) :
    isPrimOp(exp) ? makeOk(exp) :
    isVarRef(exp) ? applyEnv(env, exp.var) :
    isLitExp(exp) ? makeOk(exp.val) :
    isIfExp(exp) ? evalIf(exp, env) :
    isProcExp(exp) ? evalProc(exp, env) :
    isLetExp(exp) ? evalLet(exp, env) :
    //L31
    isClassExp(exp) ? evalClass(exp, env) :

    isAppExp(exp) ? bind(applicativeEval(exp.rator, env),
                      (proc: Value) =>
                        bind(mapResult((rand: CExp) => 
                           applicativeEval(rand, env), exp.rands),
                              (args: Value[]) =>
                                 applyProcedure(proc, args))) :
    makeFailure('"let" not supported (yet)');

export const isTrueValue = (x: Value): boolean =>
    ! (x === false);

const evalIf = (exp: IfExp, env: Env): Result<Value> =>
    bind(applicativeEval(exp.test, env), (test: Value) => 
            isTrueValue(test) ? applicativeEval(exp.then, env) : 
            applicativeEval(exp.alt, env));

const evalProc = (exp: ProcExp, env: Env): Result<Closure> =>
    makeOk(makeClosureEnv(exp.args, exp.body, env));
//L31
//evalclass added 
const evalClass = (exp: ClassExp, env: Env): Result<ClassValue> =>
    makeOk(makeClassValueEnv(exp.fields, exp.methods, env));

// KEY: This procedure does NOT have an env parameter.
//      Instead we use the env of the closure.
const applyProcedure = (proc: Value, args: Value[]): Result<Value> =>
    isPrimOp(proc) ? applyPrimitive(proc, args) :
    isClosure(proc) ? applyClosure(proc, args) :
    //L31
    isClassValue(proc) ? applyClass(proc, args) : //L31

    isObject(proc) ? applyObject(proc, args) :  
    makeFailure(`Bad procedure ${format(proc)}`);

const applyClosure = (proc: Closure, args: Value[]): Result<Value> => {
    const vars = map((v: VarDecl) => v.var, proc.params);
    return evalSequence(proc.body, makeExtEnv(vars, args, proc.env));
}


//L31
const applyClass = (classVal: ClassValue, args: Value[]): Result<Value> => 
    !isNonEmptyList(args) ? 
    makeFailure('No fields were given, expected at least one field') :
    makeOk(makeObjectEnv(classVal.methods, makeExtEnv(map((f: VarDecl) => f.var, classVal.fields), args, classVal.env)));

const applyObject = (obj: Object, args: Value[]): Result<Value> => {
    if (!isNonEmptyList<Value>(args)) 
        {
        return makeFailure("NO METHOD ARGS GIVEN !")
    }

    if (!isSymbolSExp(args[0]))
         {
        return makeFailure("First argument isn't a symbol (method name) !")
        
    }
    
    const selectedName = args[0].val;//first(args);
   // const methodArgs = rest(args);
    const methodName = map((b: Binding) => b.var.var , obj.methods);//map((b: Binding) => b.var.var, obj.methods);

    if(!methodName.includes(selectedName)) {
        return makeFailure(`Unrecognized method: ${selectedName}`)
    }
    const selectedMethod = obj.methods[methodName.indexOf(selectedName)];
    const methodArgs = rest(args);
    //const methodArgs = rest(args);
    return bind(applicativeEval(selectedMethod.val, obj.env), (v: Value) => applyProcedure(v, methodArgs));


}

// Evaluate a sequence of expressions (in a program)
export const evalSequence = (seq: Exp[], env: Env): Result<Value> =>
    isNonEmptyList<Exp>(seq) ? evalCExps(first(seq), rest(seq), env) : 
    makeFailure("Empty sequence");
    
const evalCExps = (first: Exp, rest: Exp[], env: Env): Result<Value> =>
    isDefineExp(first) ? evalDefineExps(first, rest, env) :
    isCExp(first) && isEmpty(rest) ? applicativeEval(first, env) :
    isCExp(first) ? bind(applicativeEval(first, env), _ => evalSequence(rest, env)) :
    first;
    
// Eval a sequence of expressions when the first exp is a Define.
// Compute the rhs of the define, extend the env with the new binding
// then compute the rest of the exps in the new env.
const evalDefineExps = (def: DefineExp, exps: Exp[], env: Env): Result<Value> =>
    
    bind(applicativeEval(def.val, env), (rhs: Value) => 
            evalSequence(exps, makeExtEnv([def.var.var], [rhs], env)));


// Main program
export const evalL3program = (program: Program): Result<Value> =>
    evalSequence(program.exps, makeEmptyEnv());

export const evalParse = (s: string): Result<Value> =>
    bind(p(s), (x) => 
        bind(parseL3Exp(x), (exp: Exp) =>
            evalSequence([exp], makeEmptyEnv())));

// LET: Direct evaluation rule without syntax expansion
// compute the values, extend the env, eval the body.
const evalLet = (exp: LetExp, env: Env): Result<Value> => {
    const vals  = mapResult((v: CExp) => 
        applicativeEval(v, env), map((b: Binding) => b.val, exp.bindings));
    const vars = map((b: Binding) => b.var.var, exp.bindings);
    return bind(vals, (vals: Value[]) => 
        evalSequence(exp.body, makeExtEnv(vars, vals, env)));
}






///////////////////////////////// version: 2.0.0        /////////////////////////////////////
//cheeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeek !!!