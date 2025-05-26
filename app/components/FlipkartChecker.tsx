'use client'

import { useState } from 'react'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Image from 'next/image'


export default function FlipkartChecker() {
  const [phoneNumbers, setPhoneNumbers] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCheck = async () => {
    if (!phoneNumbers.trim()) {
      setError('Please enter at least one phone number')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/check-flipkart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumbers: [phoneNumbers] })
      })

      if (!response.ok) {
        throw new Error('Failed to check numbers')
      }

      const data = await response.json()
      setResults(data)
      const number = Object.keys(data.RESPONSE.userDetails)[0]
      const status = data.RESPONSE.userDetails[number]
      toast.success(status === 'NOT_FOUND' 
        ? 'New number available!' 
        : 'Number already registered', {
        description: `Number: ${number}`,
      })
    } catch (err) {
      setError('Error checking numbers')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex justify-center mb-6">
        <Image
          src="/logo.png" 
          alt="Flipkart Logo"
          width={
            150 // Adjust width as needed
          }
          height={50} // Adjust height as needed
          className="h-16 w-auto object-contain"
        />
      </div>
      <h1 className="text-2xl font-bold mb-4 text-center">Flipkart Number Checker</h1>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Input
            type="tel"
            placeholder="Enter phone number"
            value={phoneNumbers}
            onChange={(e) => {
              // Auto-format with +91 if not present
              const val = e.target.value.replace(/\D/g, '')
              setPhoneNumbers(val.startsWith('91') ? `+${val}` : `+91${val}`)
            }}
          />
        </div>
      </div>

      <Button
        onClick={handleCheck}
        disabled={loading}
      >
        {loading ? 'Checking...' : 'Check Numbers'}
      </Button>

      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}

      {results && (
        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-medium">Results</h2>
          {Object.entries(results.RESPONSE.userDetails).map(([number, status]) => (
            <div key={number} className="bg-accent p-4 rounded-md">
              <p className="font-medium">{number}</p>
              <p className={status === 'NOT_FOUND' ? 'text-green-500' : 'text-destructive'}>
                {status === 'NOT_FOUND' 
                  ? '✅ New number (not registered)'
                  : '❌ Number already in use'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
