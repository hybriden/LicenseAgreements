// Proxy API requests and forward Cloudflare Access headers
export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url)
  const apiPath = url.pathname // /api/...
  const apiUrl = `https://license-agreements-api.hans-christian-thjomoe.workers.dev${apiPath}${url.search}`

  // Get the JWT from Cloudflare Access
  const jwt = context.request.headers.get('cf-access-jwt-assertion')

  // Extract email from JWT payload
  let email: string | null = null
  if (jwt) {
    try {
      const payload = jwt.split('.')[1]
      const decoded = JSON.parse(atob(payload))
      email = decoded.email || null
    } catch {
      // Ignore decode errors
    }
  }

  // Clone the request headers
  const headers = new Headers(context.request.headers)

  // Add the email header for the API (use X-User-Email because CF- headers are stripped by Cloudflare)
  if (email) {
    headers.set('X-User-Email', email)
  }

  // Forward the request to the API
  const response = await fetch(apiUrl, {
    method: context.request.method,
    headers,
    body: context.request.method !== 'GET' && context.request.method !== 'HEAD'
      ? context.request.body
      : undefined,
  })

  // Return the response
  return new Response(response.body, response)
}
