const dummyCtx = { params: Promise.resolve({}) }

export function routeContext(params: Record<string, string> = {}) {
  return { params: Promise.resolve(params) }
}

export { dummyCtx }
