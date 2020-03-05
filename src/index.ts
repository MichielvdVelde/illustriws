'use strict'

import { EventEmitter } from 'events'
import { IncomingMessage, STATUS_CODES } from 'http'
import { Socket } from 'net'

import WebSocket from 'ws'
import { MiddlewareFunction, compose } from '@art-of-coding/lime-compose'

import { noopAsync, toResponse } from './util'
import handleUpgrade from './middleware/handleUpgrade'

// export the upgrade middleware function for manual access
export { handleUpgrade }

export interface WsOptions {
  wsServer?: WebSocket.Server
}

export interface UpgradeContext<S = { [key: string]: any }> {
  req: IncomingMessage,
  rawSocket: Socket,
  head: Buffer

  wsServer: WebSocket.Server,
  wsSocket?: WebSocket,

  state: S
}

export interface WebSocketContext<S = { [key: string]: any }> {
  wsServer: WebSocket.Server
  wsSocket: WebSocket,
  state: S
}

export default class Application<T = { [key: string]: any }> extends EventEmitter {
  public readonly wsServer: WebSocket.Server

  protected middlewares: MiddlewareFunction<UpgradeContext<T>>[]

  public constructor (opts: WsOptions = {}) {
    super()
    this.wsServer = opts.wsServer || new WebSocket.Server({ noServer: true })
  }

  public use (...middlewares: MiddlewareFunction<UpgradeContext<T>>[]) {
    if (middlewares.length === 0) {
      throw new TypeError('use() expects at least one middleware function')
    }

    for (const middleware of middlewares) {
      this.middlewares.push(middleware)
    }
  }

  public onUpgrade () {
    const composed = compose(...this.middlewares)

    return async (req: IncomingMessage, rawSocket: Socket, head: Buffer) => {
      const ctx: UpgradeContext<T> = {
        req,
        rawSocket,
        head,
        wsServer: this.wsServer,
        state: <any>{}
      }

      try {
        await composed(ctx, noopAsync)

        if (!ctx.wsSocket) {
          await handleUpgrade()(ctx, noopAsync)
        }

        const wsContext: WebSocketContext<T> = {
          wsServer: this.wsServer,
          wsSocket: ctx.wsSocket,
          state: ctx.state
        }

        this.emit('connection', wsContext)
      } catch (e) {
        const statusCode: number = e.statusCode || e.status || 500
        const expose: boolean = typeof e.expose === 'boolean' ? e.expose : statusCode < 500
        const message: string = expose ? e.message : STATUS_CODES[statusCode]

        if (ctx.wsSocket) {
          // close websocket connection
          if (ctx.wsSocket.readyState === WebSocket.OPEN) {
            ctx.wsSocket.close(1000 + statusCode, message)
          } else {
            ctx.wsSocket.terminate()
          }

          return
        }

        // close raw socket connection
        if (ctx.rawSocket.writable) {
          ctx.rawSocket.end(toResponse(statusCode, message))
        } else {
          ctx.rawSocket.destroy()
        }
      }
    }
  }
}
