import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { phoneNumbers } = await request.json()
    
    if (!phoneNumbers?.length) {
      return NextResponse.json(
        { error: 'Please provide at least one phone number' },
        { status: 400 }
      )
    }

    // Validate and format phone numbers
    const formattedNumbers = phoneNumbers.map((num: string) => {
      // Remove all non-digit characters
      const digits = num.replace(/\D/g, '')
      // Add country code if missing
      return digits.startsWith('91') ? `+${digits}` : `+91${digits}`
    })

    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'https://www.flipkart.com/api/6/user/signup/status'
      : 'https://1.rome.api.flipkart.com/api/6/user/signup/status'

    // Helper function to make API call with retries
    const makeApiCall = async (url: string, retries = 3, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0 FKUA/website/42/website/Desktop',
              'Origin': 'https://www.flipkart.com',
              'Referer': 'https://www.flipkart.com/',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              loginId: formattedNumbers,
              supportAllStates: true
            })
          })

          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || delay.toString())
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
            continue
          }

          if (!response.ok) {
            const errorText = await response.text()
            console.error('Flipkart API error:', {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              errorText
            })
            throw new Error(`API request failed with status ${response.status}`)
          }

          return response
        } catch (error) {
          if (i === retries - 1) throw error
          await new Promise(resolve => setTimeout(resolve, delay))
          delay *= 2 // Exponential backoff
        }
      }
      throw new Error('All retries failed')
    }

    try {
      const flipkartResponse = await makeApiCall(apiUrl)

      const contentType = flipkartResponse.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const responseText = await flipkartResponse.text()
        console.error('Non-JSON response:', responseText)
        throw new Error('Received non-JSON response from API')
      }

      const data = await flipkartResponse.json()
      return NextResponse.json(data)
    } catch (error) {
      // Fallback to alternative endpoint if primary fails
      console.error('Primary endpoint failed, trying fallback...')
      const fallbackResponse = await fetch('https://1.rome.api.flipkart.com/api/6/user/signup/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0 FKUA/website/42/website/Desktop',
          'Origin': 'https://www.flipkart.com',
          'Referer': 'https://www.flipkart.com/',
        },
        body: JSON.stringify({
          loginId: formattedNumbers,
          supportAllStates: true
        })
      })
      
      if (!fallbackResponse.ok) {
        throw new Error('Both primary and fallback endpoints failed')
      }
      
      return NextResponse.json(await fallbackResponse.json())
    }
  } catch (error) {
    console.error('Flipkart check error:', error)
    return NextResponse.json(
      { error: 'Failed to check Flipkart registration' },
      { status: 500 }
    )
  }
}
