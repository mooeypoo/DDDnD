/**
 * Bounded JSON Reader
 *
 * Reads a fetch Response body as JSON without ever holding more than a fixed
 * number of bytes (threat T5 in docs/CONTENT_PACKS_SECURITY.md).
 *
 * `Content-Length` is checked first as a cheap early exit, but it is not
 * trusted: servers can omit it or lie, and compressed bodies decode larger.
 * The decoded stream itself is counted and cancelled as soon as it exceeds
 * the limit.
 */

/**
 * Thrown when a response body exceeds its byte limit.
 */
export class ContentTooLargeError extends Error {
  constructor(public source: string, public maxBytes: number) {
    super(`Content too large: ${source} exceeds ${maxBytes} bytes`)
    this.name = 'ContentTooLargeError'
  }
}

/**
 * Thrown when a response body is not valid JSON.
 */
export class ContentJsonError extends Error {
  constructor(public source: string) {
    super(`Content is not valid JSON: ${source}`)
    this.name = 'ContentJsonError'
  }
}

/**
 * Reads a response body as text, refusing to read past `maxBytes`.
 */
export async function readTextWithLimit(response: Response, maxBytes: number, source: string): Promise<string> {
  const declaredLength = Number(response.headers?.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new ContentTooLargeError(source, maxBytes)
  }

  if (!response.body) {
    const text = await response.text()
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      throw new ContentTooLargeError(source, maxBytes)
    }
    return text
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let receivedBytes = 0
  let text = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    receivedBytes += value.byteLength
    if (receivedBytes > maxBytes) {
      await reader.cancel()
      throw new ContentTooLargeError(source, maxBytes)
    }
    text += decoder.decode(value, { stream: true })
  }

  return text + decoder.decode()
}

/**
 * Reads a response body as JSON within a byte limit.
 *
 * Returns `unknown`: the caller must validate before using the value.
 */
export async function readJsonWithLimit(response: Response, maxBytes: number, source: string): Promise<unknown> {
  const text = await readTextWithLimit(response, maxBytes, source)
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new ContentJsonError(source)
  }
}
