import type { Method } from 'tiny-request-router'
import { internalError, notFound } from './util'
import { app } from './app'

export default {
  async fetch(request: Request, _: unknown, context: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    const cacheKey = new Request(url.toString(), request);
    const cacheMatch = await caches.default.match(cacheKey);
    if(cacheMatch) {
      return cacheMatch;
    }

    const match = app.match(request.method as Method, url.pathname)
    if (match) {
      try {
        return await match.handler(request, url, match.params, context)
      } catch (err) {
        return internalError((err as Error).message ?? 'An unknown error has occurred')
      }
    } else {
      return notFound('The resource you requested could not be found.')
    }
  }
}
