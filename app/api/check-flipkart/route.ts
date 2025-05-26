import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('Starting Flipkart check API request')
  const requestBody = await request.json()
  console.log('Received request with body:', JSON.stringify(requestBody, null, 2))
  const { phoneNumbers } = requestBody

  // Format phone numbers once
  const formattedNumbers = phoneNumbers.map((num: string) => {
    const digits = num.replace(/\D/g, '')
    return digits.startsWith('91') ? `+${digits}` : `+91${digits}`
  })

  try {
    
    console.log('Processing phone numbers:', phoneNumbers)
    
    if (!phoneNumbers?.length) {
      return NextResponse.json(
        { error: 'Please provide at least one phone number' },
        { status: 400 }
      )
    }

    const apiUrl = 'https://www.flipkart.com/api/6/user/signup/status'
    console.log('Making API call to:', apiUrl)

    // Implement retry with exponential backoff
    let retries = 3
    let delay = 1000 // Start with 1 second delay
    
    while (retries > 0) {
      const flipkartResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
          'Origin': 'https://www.flipkart.com',
          'Referer': 'https://www.flipkart.com/',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      body: JSON.stringify({
        loginId: formattedNumbers,
        supportAllStates: true
      })
    })

      if (flipkartResponse.status === 429) {
        console.warn(`Rate limited. Retrying in ${delay}ms... (${retries} retries left)`)
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= 2 // Exponential backoff
        retries--
        continue
      }

      if (!flipkartResponse.ok) {
        const errorText = await flipkartResponse.text()
        console.error('Flipkart API error:', {
          status: flipkartResponse.status,
          statusText: flipkartResponse.statusText,
          headers: Object.fromEntries(flipkartResponse.headers.entries()),
          errorText
        })
        throw new Error(`API request failed with status ${flipkartResponse.status}`)
      }

      const contentType = flipkartResponse.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const responseText = await flipkartResponse.text()
        console.error('Non-JSON response:', responseText)
        throw new Error('Received non-JSON response from API')
      }

      const data = await flipkartResponse.json()
      return NextResponse.json(data)
    }

    // If we exhausted retries
    return NextResponse.json(
      { error: 'Too many requests to Flipkart API. Please try again later.' },
      { status: 429 }
    )
  } catch (error) {
    console.error('Flipkart check error:', error)
    return NextResponse.json(
      { error: 'Failed to check Flipkart registration' },
      { status: 500 }
    )
  }
}
