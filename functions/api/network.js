import { createNetworkHandler } from '../../lib/network.js'
const handle = createNetworkHandler()
export function onRequest({ request, env }) { return handle(request, env) }
