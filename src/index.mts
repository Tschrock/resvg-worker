import { Router, Method, Params } from 'tiny-request-router';
import resvg_wasm from "../node_modules/@resvg/resvg-wasm/index_bg.wasm"
import resvg, { ResvgRenderOptions } from "../node_modules/@resvg/resvg-wasm/index"
resvg.initWasm(resvg_wasm);

interface App {
  allowed_sizes: number[];
  source_url_template: string;
}

// TODO: Make this not hardcoded
// TODO: Allow more options
const REGISTERED_APPS: Record<string, App> = {
  "7a31cfe8": {
    allowed_sizes: [32, 64, 128, 180, 256, 512],
    source_url_template: "https://emoji.lgbt/assets/svg/{resource_id}.svg"
  }
}

const app = new Router<(request: Request, params: Params) => Response | Promise<Response>>();

function interpolate(template: string, data: Record<string, string>) {
  return template.replace(/{([^{}]*)}/g, (_, key) => data[key.trim()] ?? "");
}

function jsonError(status: number, statusText: string, title: string) {
  return new Response(
    JSON.stringify({ errors: [{ status, title }] }),
    { status, statusText, headers: { "Content-Type": "application/json" } }
  );
}

function intIf(value: string | null): number | null {
  return value ? Number.parseInt(value) : null;
}

app.get('/api/v1/:app_key/:resource_id.png', async (_, { app_key, resource_id, width, height }): Promise<Response> => {
  if (REGISTERED_APPS.propertyIsEnumerable(app_key)) {
    const app = REGISTERED_APPS[app_key];

    const heightInt = intIf(height);
    const widthInt = intIf(width);

    let fitTo: ResvgRenderOptions["fitTo"];
    if (heightInt) {
      if (app.allowed_sizes.includes(heightInt)) {
        fitTo = {
          mode: "height",
          value: heightInt
        }
      }
      else {
        return jsonError(400, "Bad Request", `'height' must be one of ${app.allowed_sizes.join(", ")}}`);
      }
    }
    else if (widthInt) {
      if (app.allowed_sizes.includes(widthInt)) {
        fitTo = {
          mode: "width",
          value: widthInt
        };
      }
      else {
        return jsonError(400, "Bad Request", `'width' must be one of ${app.allowed_sizes.join(", ")}}`);
      }
    }
    else {
      fitTo = {
        mode: 'original'
      }
    }

    const resourceUrl = interpolate(app.source_url_template, { resource_id });
    const resourceResponse = await fetch(resourceUrl);
    if (resourceResponse.ok) {
      const data = await resourceResponse.arrayBuffer()
      const rendered = resvg.render(new Uint8Array(data), { fitTo })

      // TODO: Cache response
      return new Response(rendered, {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "image/png" }
      })
    }
    else {
      return resourceResponse;
    }
  }
  else {
    return jsonError(404, "Not Found", "Unknown application key.");
  }
});

// Error handling
async function catchError(fn: () => Response | Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    return jsonError(500, "Internal Server Error", (err as Error).message ?? "Internal Server Error");
  }
}

// Worker
export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    const match = app.match(request.method as Method, url.pathname);
    if (match) {
        return catchError(() => match.handler(request, Object.assign(Object.fromEntries(url.searchParams), match.params)));
    } else {
        return jsonError(404, 'Not Found', 'The resource you requested could not be found.');
    }
  }
}
