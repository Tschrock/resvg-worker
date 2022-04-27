import type { ResvgRenderOptions } from '@resvg/resvg-wasm'
import { Router, type Params } from 'tiny-request-router'

import { badRequest, htmlOk, interpolate, notFound } from './util'
import { APPLICATIONS } from './auth'

import index from './html/index.html'
import { renderFromRemote } from './resvg'

type RequestHandler = (request: Request, url: URL, params: Params) => Response | Promise<Response>

export const app = new Router<RequestHandler>()

app.get('/', () => htmlOk(index))

app.get('/api/v1/:key/:id.png', async (req, url, { key, id }): Promise<Response> => {

    const site = APPLICATIONS.get(key);
    if (!site) return notFound('Unknown application key.');

    const query = Object.fromEntries(url.searchParams);

    const height = query.height ? Number.parseInt(query.height) : null;
    const width = query.width ? Number.parseInt(query.width) : null;

    let fitTo: ResvgRenderOptions['fitTo'];
    if (height) {
        if (site.sizes.includes(height)) {
            fitTo = { mode: 'height', value: height }
        } else {
            return badRequest('Invalid Height', { detail: `'height' must be one of ${site.sizes.join(', ')}}` });
        }
    } else if (width) {
        if (site.sizes.includes(width)) {
            fitTo = { mode: 'width', value: width };
        } else {
            return badRequest('Invalid Width', { detail: `Width must be one of ${site.sizes.join(', ')}` });
        }
    }
    else {
        fitTo = { mode: 'original' }
    }

    const sourceUrl = interpolate(site.url, { id });

    return renderFromRemote(sourceUrl, { fitTo });
})
