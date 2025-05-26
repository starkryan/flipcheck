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

    const flipkartResponse = await fetch('https://1.rome.api.flipkart.com/api/6/user/signup/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0 FKUA/website/42/website/Desktop',
        'Origin': 'https://www.flipkart.com',
        'Referer': 'https://www.flipkart.com/',
      },
      credentials: 'include',
      body: JSON.stringify({
        loginId: formattedNumbers,
        supportAllStates: true
      })
    })

    if (!flipkartResponse.ok) {
      const errorText = await flipkartResponse.text()
      console.error('Flipkart API error:', errorText)
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
  } catch (error) {
    console.error('Flipkart check error:', error)
    return NextResponse.json(
      { error: 'Failed to check Flipkart registration' },
      { status: 500 }
    )
  }
}
