import logger from './logger'

type RouteContext = { params: Promise<Record<string, string>> }

type RouteHandler = (
  request: Request,
  context: RouteContext,
) => Promise<Response>

export function withLogging(handler: RouteHandler): RouteHandler {
  return async (request: Request, context: RouteContext) => {
    const start = performance.now()
    const method = request?.method ?? 'UNKNOWN'
    const pathname = request?.url ? new URL(request.url).pathname : 'unknown'

    try {
      const response = await handler(request, context)
      const duration = Math.round(performance.now() - start)

      logger.info({ method, path: pathname, status: response.status, duration }, 'api request')

      return response
    } catch (error) {
      const duration = Math.round(performance.now() - start)

      logger.error({ method, path: pathname, duration, err: error }, 'api request failed')

      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
}
