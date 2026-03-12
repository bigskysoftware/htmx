const wrapFunc = (name: string, f: Function, log: (data: string) => void) => {
  return function (...args: any[]) {
    try {
      const result = f.apply(undefined, args)
      log(`${name}(${args.join(', ')}) = ${result}`)
      return result
    } catch (e) {
      log(`${name}(${args.join(', ')}) = Error(${e})`)
      throw e
    }
  }
}

/**
 * @internal
 */
export const traceImportsToConsole = (
  imports: Record<string, Function>
): Record<string, Function> => {
  for (const key in imports) {
    imports[key] = wrapFunc(key, imports[key], console.log)
  }
  return imports
}
