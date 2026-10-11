// msw's WebSocket support needs both globals to exist when it loads; HTTP mocking never uses them.
if (!('MessageEvent' in globalThis)) {
  Object.assign(globalThis, { MessageEvent: Event });
}

if (!('BroadcastChannel' in globalThis)) {
  Object.assign(globalThis, { BroadcastChannel: EventTarget });
}
