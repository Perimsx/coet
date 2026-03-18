declare module "xss" {
  export interface FilterXSSOptions {
    whiteList?: Record<string, string[]>
    stripIgnoreTag?: boolean
    stripIgnoreTagBody?: string[]
  }

  export class FilterXSS {
    constructor(options?: FilterXSSOptions)
    process(input: string): string
  }

  const xss: {
    FilterXSS: typeof FilterXSS
  }

  export default xss
}
