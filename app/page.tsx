import React from 'react'
import FlipkartChecker from './components/FlipkartChecker'
import { Toaster } from '@/components/ui/sonner'

function page() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Toaster position="top-center" richColors />
      <FlipkartChecker />
    </div>
  )
}

export default page
