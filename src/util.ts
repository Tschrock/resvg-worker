export function htmlOk(body: string): Response {
    return ok(body, 'text/html')
}

export function jsonOk(body: unknown): Response {
    return ok(JSON.stringify(body), 'application/json')
}

export function ok(body: BodyInit, contentType: string, otherHeaders?: HeadersInit): Response {
    return new Response(body, {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': contentType, ...otherHeaders }
    })
}

export function notFound(title: string, other?: object): Response {
    return jsonApiError(404, 'Not Found', title, other)
}

export function badRequest(title: string, other?: object): Response {
    return jsonApiError(400, 'Bad Request', title, other)
}

export function internalError(title: string, other?: object): Response {
    return jsonApiError(500, 'Internal Server Error', title, other)
}

export function jsonApiError(status: number, statusText: string, title: string, other?: object): Response {
    return new Response(
        JSON.stringify({ errors: [{ status, title, ...other }] }),
        { status, statusText, headers: { 'Content-Type': 'application/json' } }
    )
}

export function interpolate(template: string, data: Record<string, string>) {
    return template.replace(/{([^{}]*)}/g, (_, key) => data[key.trim()] ?? '');
}
