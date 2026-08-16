declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

declare module '*.svg' {
  import type * as React from 'react'
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >
  const src: string
  export default src
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.ico' {
  const content: string
  export default content
}
