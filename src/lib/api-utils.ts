import { randomUUID } from 'crypto'
import { auth } from './auth'
import logger from './logger'

type RouteContext = { params: Promise<Record<string, string>> }

type RouteHandler = (
  request: Request,
  context: RouteContext,
) => Promise<Response>

function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return request.headers.get('x-real-ip') ?? undefined
}

async function getUserId(): Promise<string | undefined> {
  try {
    const session = await auth()
    return session?.user?.id
  } catch {
    return undefined
  }
}

export function withLogging(handler: RouteHandler): RouteHandler {
  return async (request: Request, context: RouteContext) => {
    const start = performance.now()
    const method = request?.method ?? 'UNKNOWN'
    const pathname = request?.url ? new URL(request.url).pathname : 'unknown'
    const requestId = request.headers.get('x-request-id') ?? randomUUID()
    const ip = getClientIp(request)
    const userAgent = request.headers.get('user-agent') ?? undefined

    try {
      const response = await handler(request, context)
      const duration = Math.round(performance.now() - start)
      const userId = await getUserId()

      logger.info(
        { method, path: pathname, status: response.status, duration, requestId, userId, ip, userAgent },
        `${method} ${pathname} ${response.status}`,
      )

      return response
    } catch (error) {
      const duration = Math.round(performance.now() - start)
      const userId = await getUserId()

      logger.error(
        { method, path: pathname, duration, requestId, userId, ip, userAgent, err: error },
        `${method} ${pathname} failed`,
      )

      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
}
