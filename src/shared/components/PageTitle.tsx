import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function PageTitle({ children }: Props) {
  return (
    <h1 className="mx-auto max-w-4xl text-xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-2xl md:text-3xl lg:text-4xl dark:text-gray-100">
      {children}
    </h1>
  )
}
