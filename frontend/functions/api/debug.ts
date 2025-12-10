// Debug endpoint to check what headers we receive from Cloudflare Access
export const onRequest: PagesFunction = async (context) => {
  const headers: Record<string, string> = {}

  context.request.headers.forEach((value, key) => {
    headers[key] = value
  })

  // Extract email from JWT
  const jwt = context.request.headers.get('cf-access-jwt-assertion')
  let extractedEmail: string | null = null
  if (jwt) {
    try {
      const payload = jwt.split('.')[1]
      const decoded = JSON.parse(atob(payload))
      extractedEmail = decoded.email || null
    } catch {
      extractedEmail = 'decode-error'
    }
  }

  return new Response(JSON.stringify({
    message: 'Debug headers v2',
    extractedEmail,
    cfAccessJwt: jwt ? 'present' : 'missing',
    allHeaders: headers
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  })
}
