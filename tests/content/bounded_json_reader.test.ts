import { describe, expect, it } from 'vitest'

import {
  ContentJsonError,
  ContentTooLargeError,
  readJsonWithLimit,
} from '@/domains/content/services/bounded_json_reader'

function streamingResponse(chunks: string[], headers: Record<string, string> = {}): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
  return new Response(stream, { headers })
}

describe('readJsonWithLimit', () => {
  it('parses a body within the limit', async () => {
    await expect(readJsonWithLimit(new Response('{"a":1}'), 100, 'x.json')).resolves.toEqual({ a: 1 })
  })

  it('rejects early when Content-Length declares too much', async () => {
    const response = new Response('{}', { headers: { 'content-length': '5000' } })
    await expect(readJsonWithLimit(response, 100, 'x.json')).rejects.toBeInstanceOf(ContentTooLargeError)
  })

  it('counts the actual stream when the header is missing or wrong', async () => {
    const response = streamingResponse(['{"a":"', 'x'.repeat(200), '"}'], { 'content-length': '10' })
    await expect(readJsonWithLimit(response, 100, 'x.json')).rejects.toBeInstanceOf(ContentTooLargeError)
  })

  it('counts bytes, not characters', async () => {
    // Four 4-byte emoji = 16 bytes, but only 8 UTF-16 code units.
    const body = JSON.stringify('🧭🧭🧭🧭')
    await expect(readJsonWithLimit(streamingResponse([body]), 12, 'x.json')).rejects.toBeInstanceOf(ContentTooLargeError)
  })

  it('reports invalid JSON', async () => {
    await expect(readJsonWithLimit(new Response('{nope'), 100, 'x.json')).rejects.toBeInstanceOf(ContentJsonError)
  })
})
