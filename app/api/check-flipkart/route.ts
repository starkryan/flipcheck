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
        'Host': '1.rome.api.flipkart.com',
        'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Content-Type': 'application/json',
        'X-User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0 FKUA/website/42/website/Desktop',
        'Origin': 'https://www.flipkart.com',
        'Referer': 'https://www.flipkart.com/',
        'Cookie': `T=TI174816061213600178143285128687980727603493723546472210054080819441; SN=VI7A4EB570BA28423ABFA0CE569EB1D707.TOKC3BDD44A0D2549C3BE4D403C7ECB2AE1.1748228673553.LO; at=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjFkOTYzYzUwLTM0YjctNDA1OC1iMTNmLWY2NDhiODFjYTBkYSJ9.eyJleHAiOjE3NDk4ODg2MTIsImlhdCI6MTc0ODE2MDYxMiwiaXNzIjoia2V2bGFyIiwianRpIjoiZmIyNWYyMGMtYmY4Yi00MWJhLWEyZTctYzllZmQ1YzI0YmE5IiwidHlwZSI6IkFUIiwiZElkIjoiVEkxNzQ4MTYwNjEyMTM2MDAxNzgxNDMyODUxMjg2ODc5ODA3Mjc2MDM0OTM3MjM1NDY0NzIyMTAwNTQwODA4MTk0NDEiLCJrZXZJZCI6IlZJN0E0RUI1NzBCQTI4NDIzQUJGQTBDRTU2OUVCMUQ3MDciLCJ0SWQiOiJtYXBpIiwidnMiOiJMTyIsInoiOiJDSCIsIm0iOnRydWUsImdlbiI6NH0.JjhDElRU1eP18mBZe3xaDrZuCekP4HedGef_bKE0uaE; K-ACTION=null; ud=1.Sf6wmi1txOQ-py5AqyL1Ks9X-WA3aPC4bJuutxTO46fNUtHlTXx0-FphqqCjGyVaU96xm7N-xXv25t900vrsHgjJPEm2USB3_C0uIxiLBQCl6EhLh1GnVuoTxPf2ugkoUTRkLFf2H0Zw2gWMizUu6A; vh=963; vw=1920; dpr=1; rt=null; vd=VI7A4EB570BA28423ABFA0CE569EB1D707-1748160624325-3.1748228673.1748228068.155277171; AMCV_17EB401053DAF4840A490D4C%40AdobeOrg=-227196251%7CMCIDTS%7C20234%7CMCMID%7C34211113690373805447825725743302624478%7CMCAAMLH-1748765426%7C12%7CMCAAMB-1748765426%7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%7CMCOPTOUT-1748167826s%7CNONE%7CMCAID%7CNONE; S=d1t16dCs/Dyk/Pz9MP14/Pz8/P48VtfO3HunQTIh3Fg7yDTqJARlhTYQ0ZNscQcnXYgxxRwjQgmyplb+fDNh4jqJVfQ==; s_sq=flipkart-prd%3D%2526pid%253Dwww.flipkart.com%25253Aaccount%25253Alogin%2526pidt%253D1%2526oid%253DCONTINUE%2526oidt%253D3%2526ot%253DSUBMIT; solved_captcha=1748228245-6672-16505520-4e2d9fced451ed59b083e6eb485ff896fd6463346c3c41980489637990ae38d4`
      },
      body: JSON.stringify({
        loginId: formattedNumbers,
        supportAllStates: true
      })
    })

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
