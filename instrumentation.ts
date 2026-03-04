export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { syncFulfillmentStatus } = await import('./lib/syncFulfillment')
    syncFulfillmentStatus()
  }
}
