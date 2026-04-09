import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile } from 'fs/promises'
import path from 'path'

const LOG_FILE = path.join(process.cwd(), 'n8n-log.txt')

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headers = Object.fromEntries(req.headers.entries())
    
    const entry = `\n===== ${new Date().toISOString()} =====\nHEADERS: ${JSON.stringify(headers, null, 2)}\nBODY: ${body}\n`

    let existing = ''
    try { existing = await readFile(LOG_FILE, 'utf-8') } catch {}
    await writeFile(LOG_FILE, existing + entry, 'utf-8')

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
