/**
 * Reporting Domain — Services
 *
 * Exports share payload model, builder, and serialization utilities.
 */

export { SHARE_PAYLOAD_VERSION, type SharePayload, type SharePayloadParseResult } from './share_payload'
export { buildSharePayload, type BuildSharePayloadInput } from './build_share_payload'
export {
  encodeSharePayload,
  decodeSharePayload,
  buildShareUrl
} from './share_serialization'
