'use client'

import { AppProgressBar } from 'next-nprogress-bar'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AppProgressBar height="3px" color="#1A56DB" options={{ showSpinner: false }} shallowRouting />
    </>
  )
}
