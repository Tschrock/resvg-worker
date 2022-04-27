import resvg_wasm from '../node_modules/@resvg/resvg-wasm/index_bg.wasm'
import type { ResvgRenderOptions } from '@resvg/resvg-wasm'
import * as resvg from '@resvg/resvg-wasm'

import { ok } from './util';

resvg.initWasm(resvg_wasm)

export async function renderFromRemote(url: string, options: ResvgRenderOptions): Promise<Response> {
    const response = await fetch(url);
    if(!response.ok) return response;

    const svgData = await response.arrayBuffer();
    const pngData = resvg.render(new Uint8Array(svgData), options);

    return ok(pngData, 'image/png');
}
