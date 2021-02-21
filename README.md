# Illustriws

> Illustriws wil be succeeded by [Signal-Fire2](https://github.com/MichielvdVelde/signal-fire2)!

Middleware-enabled WebSocket upgrade.

* Supports middleware functions for the HTTP(S) server's `Upgrade` event
* Unopinionated
* Uses the [ws](https://github.com/websockets/ws) module
* Automatically upgrades when middleware completes, or somewhere within the
  middleware chain if so desired

Extracted from a personal project where I wanted to use
[Koa](https://github.com/koajs/koa)-like middleware when processing upgrade
requests.

## Install

Versions `0.x.x` are considered unstable and may have breaking changes (i.e. does
not follow semver). When ready, version 1 will be the first stable release and
will follow semver from then on.

```
npm i illustriws
```

## Example

```ts
import { Server } from 'http'
import Application, { WebSocketContext, handleUpgrade } from 'illustriws'

interface State {
  playerId: string
}

const httpServer = new Server()
const app = new Application<State>()

app.use(async ctx => {
  ctx.state.playerId = 'blabla'
})

// we can either manually add the upgrade middleware,
// or let the module upgrade the connection on successful
// completion of the middleware stack
app.use(handleUpgrade())

httpServer.on('upgrade', app.onUpgrade())

app.on('connection', (ctx: WebSocketContext<State>) => {
  // ctx.webSocket is the upgraded WebSocket instance
  console.log(`Welcome, ${ctx.state.playerId}!`)
})

httpServer.listen(3000, () => {
  console.log('App listening on port 3000')
})
```

## License

Copyright 2020 Michiel van der Velde.

This software is licensed under [the MIT License](LICENSE).
