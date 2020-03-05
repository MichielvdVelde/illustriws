'use strict'

import { STATUS_CODES } from 'http'

export async function noopAsync () {}

export function toResponse (
  statusCode: number,
  message: string = STATUS_CODES[statusCode],
  headers: { [key: string]: string | number } = {}
) {
  headers = {
    'Content-Type': 'text/plain',
    'Content-Length': Buffer.byteLength(message),
    'Connection': 'close',
    ...headers
  }

  return `HTTP/1.1 ${statusCode} ${STATUS_CODES[statusCode]}\r\n` +
    Object.keys(headers)
      .map(key => `${key}: ${this.headers[key]}`)
      .join('\r\n') +
    '\r\n\r\n' +
    message
}
