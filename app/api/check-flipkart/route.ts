import { NextResponse } from 'next/server'

const PROXY_URL = 'https://api.brightdata.com/request'
const PROXY_ZONE = 'web_unlocker1'

async function makeProxyRequest(url: string, body: any) {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BRIGHT_DATA_API_KEY}`
    },
    body: JSON.stringify({
      zone: PROXY_ZONE,
      url: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0 FKUA/website/42/website/Desktop',
        'Origin': 'https://www.flipkart.com',
        'Referer': 'https://www.flipkart.com/',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body)
    })
  })
  return response
}

async function withRetry(fn: () => Promise<Response>, maxRetries = 3, delayMs = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fn()
      if (response.status !== 429) return response
      if (i < maxRetries - 1) await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)))
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)))
    }
  }
  throw new Error('Max retries reached')
}

export async function POST(request: Request) {
  console.log('Starting Flipkart check API request')
  // Cache request body at start to avoid double reading
  const requestBody = await request.json()
  try {
    console.log('Received request with body:', JSON.stringify(requestBody, null, 2))
    const { phoneNumbers } = requestBody
    
    console.log('Processing phone numbers:', phoneNumbers)
    
    if (!phoneNumbers?.length) {
      return NextResponse.json(
        { error: 'Please provide at least one phone number' },
        { status: 400 }
      )
    }

    // Validate and format phone numbers
    const formattedNumbers = phoneNumbers.map((num: string) => {
      const digits = num.replace(/\D/g, '')
      return digits.startsWith('91') ? `+${digits}` : `+91${digits}`
    })

    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'https://www.flipkart.com/api/6/user/signup/status'
      : 'https://1.rome.api.flipkart.com/api/6/user/signup/status'

    console.log('Making API call to:', apiUrl)
    const flipkartResponse = await withRetry(async () => {
      return makeProxyRequest(apiUrl, {
        loginId: formattedNumbers,
        supportAllStates: true
      })
    })

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
  } catch (error) {
    console.error('Primary endpoint failed:', error)
    
    try {
      const { phoneNumbers } = requestBody
      const formattedNumbers = phoneNumbers.map((num: string) => {
        const digits = num.replace(/\D/g, '')
        return digits.startsWith('91') ? `+${digits}` : `+91${digits}`
      })

      console.log('Trying fallback endpoint...')
      const fallbackResponse = await withRetry(async () => {
        return makeProxyRequest('https://1.rome.api.flipkart.com/api/6/user/signup/status', {
          loginId: formattedNumbers,
          supportAllStates: true
        })
      })
      
      if (!fallbackResponse.ok) {
        const errorText = await fallbackResponse.text()
        console.error('Fallback endpoint failed:', {
          status: fallbackResponse.status,
          errorText
        })
        throw new Error('Both endpoints failed')
      }
      
      const fallbackData = await fallbackResponse.json()
      return NextResponse.json(fallbackData)
    } catch (fallbackError) {
      console.error('Flipkart check error:', fallbackError)
      return NextResponse.json(
        { error: 'Failed to check Flipkart registration' },
        { status: 500 }
      )
    }
  }
}
