export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const logger = (await import('./lib/logger')).default
    logger.info(
      { nodeEnv: process.env.NODE_ENV, logLevel: logger.level },
      'daydesk server started'
    )
  }
}
