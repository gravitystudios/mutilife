import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'start_date and end_date are required' },
      { status: 400 }
    )
  }

  try {
    const url = `https://api-pudo.co.za/api/v1/billing/statements?start_date=${startDate}&end_date=${endDate}`
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.PUDO_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) throw new Error('Failed to fetch billing statement')

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Billing statement error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing statement' },
      { status: 500 }
    )
  }
}
