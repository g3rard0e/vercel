import { createNetworkHandler } from '../lib/network.js'
const handle = createNetworkHandler()
export default { fetch(request) { return handle(request, process.env) } }
