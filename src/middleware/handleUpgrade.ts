'use strict'

import { MiddlewareFunction } from '@art-of-coding/lime-compose'
import { UpgradeContext } from '../index'

export default function handleUpgrade (): MiddlewareFunction<UpgradeContext> {
  return async function handleUpgrade (ctx, next) {
    if (!ctx.wsSocket) {
      ctx.wsSocket = await new Promise(resolve => {
        ctx.wsServer.handleUpgrade(ctx.req, ctx.rawSocket, ctx.head, resolve)
      })
    }

    return next()
  }
}
