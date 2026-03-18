import { Inter } from 'next/font/google'
import SectionContainer from '@/features/site/components/SectionContainer'
import Footer from '@/features/site/components/Footer'
import { ReactNode } from 'react'
import Header from '@/features/site/components/Header'

interface Props {
  children: ReactNode
}

const inter = Inter({
  subsets: ['latin'],
})

const LayoutWrapper = ({ children }: Props) => {
  return (
    <SectionContainer>
      <div className={`${inter.className} font-sans`}>
        <Header />
        <main className="mb-auto">{children}</main>
      </div>
    </SectionContainer>
  )
}

export default LayoutWrapper
