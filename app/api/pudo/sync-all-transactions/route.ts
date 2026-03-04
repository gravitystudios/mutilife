import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const fullSync = searchParams.get('full') === 'true'

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const bearerToken = process.env.PUDO_API_TOKEN
        if (!bearerToken) {
          controller.enqueue(encoder.encode('data: {"error":"PUDO_API_TOKEN not configured"}\n\n'))
          controller.close()
          return
        }

        let latestId = 0
        
        if (!fullSync) {
          const { data: latest } = await supabaseServer
            .from('pudo_transactions')
            .select('id')
            .order('id', { ascending: false })
            .limit(1)
            .single()
          latestId = latest?.id || 0
        }

        let page = 1
        let totalSynced = 0
        let hasMore = true
        let foundExisting = false

        while (hasMore && !foundExisting) {
          const res = await fetch(`https://api-pudo.co.za/api/v1/billing/transactions?page=${page}`, {
            headers: { 'Authorization': `Bearer ${bearerToken}` }
          })

          if (!res.ok) break

          const transactions = await res.json()
          if (transactions.length === 0) {
            hasMore = false
            break
          }

          const firstId = transactions[0]?.id
          if (page > 1 && firstId && firstId <= latestId) {
            foundExisting = true
            break
          }

          let newInPage = 0
          for (const t of transactions) {
            if (!fullSync && t.id <= latestId) {
              foundExisting = true
              break
            }

            await supabaseServer
              .from('pudo_transactions')
              .upsert({
                id: t.id,
                account_id: t.account_id,
                amount: t.amount,
                type: t.type,
                transaction_date: t.transaction_date,
                effective_date: t.effective_date,
                description: t.description,
                shipment_id: t.shipment_id,
                custom_tracking_reference: t.shipment?.custom_tracking_reference,
                doc_display_id: t.doc_display_id,
                has_been_reversed: t.has_been_reversed,
                time_created: t.time_created,
                time_modified: t.time_modified,
                updated_at: new Date().toISOString()
              }, { onConflict: 'id' })

            totalSynced++
            newInPage++
          }

          controller.enqueue(encoder.encode(`data: {"page":${page},"synced":${totalSynced}}\n\n`))
          
          if (foundExisting || newInPage === 0 || page > 10) {
            hasMore = false
            break
          }
          
          page++
          await new Promise(r => setTimeout(r, 100))
        }

        const message = totalSynced === 0 ? 'Already up to date' : `Synced ${totalSynced} new transactions`
        controller.enqueue(encoder.encode(`data: {"done":true,"total":${totalSynced},"message":"${message}"}\n\n`))
        controller.close()
      } catch (error) {
        controller.enqueue(encoder.encode(`data: {"error":"${error}"}\n\n`))
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
