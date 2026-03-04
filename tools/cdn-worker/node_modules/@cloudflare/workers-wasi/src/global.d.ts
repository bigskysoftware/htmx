declare namespace WebAssembly {
  interface Memory {
    readonly buffer: ArrayBuffer
    grow(delta: number): number
  }

  interface Instance {
    readonly exports: Exports
  }

  interface Module {}

  var Instance: {
    prototype: Instance
    new (module: Module, importObject?: Imports): Instance
  }

  type ImportValue = ExportValue | number
  type ModuleImports = Record<string, ImportValue>
  type Imports = Record<string, ModuleImports>
  type ExportValue = Function | Memory
  type Exports = Record<string, ExportValue>
}
