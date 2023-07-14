import {rest} from 'msw'
import {setupServer} from 'msw/node'
import closeWithGrace from 'close-with-grace'
import {requiredHeader, writeEmail} from './utils.ts'
import {faker} from '@faker-js/faker'

const handlers = [
  process.env.REMIX_DEV_HTTP_ORIGIN
    ? rest.post(`${process.env.REMIX_DEV_HTTP_ORIGIN}/ping`, req =>
      req.passthrough(),
    )
    : null,

  // feel free to remove this conditional from the mock once you've set up resend
  process.env.RESEND_API_KEY
    ? rest.post(`https://api.resend.com/emails`, async (req, res, ctx) => {
      requiredHeader(req.headers, 'Authorization')
      const body = await req.json()
      console.info('🔶 mocked email contents:', body)

      await writeEmail(body)

      return res(
        ctx.json({
          id: faker.string.uuid(),
          from: body.from,
          to: body.to,
          created_at: new Date().toISOString(),
        }),
      )
    })
    : null,
  /**
   * Mock for this API:
   *   const res: String = await fetch(
   *     '/api/fbfs',
   *     {
   *       method: 'POST',
   *       headers: {
   *         'Content-Type': 'application/json'
   *       },
   *       body: JSON.stringify({
   *         fish_bigger,
   *         fish_smaller
   *       })
   *     }
   *   ).then((res) => res.json())
   *     .then((res: any) => (res as { data: String }).data);
   */
  process.env.BACKEND_URL ? rest.post(`${process.env.BACKEND_URL}/api/fbfs`, async (req, res, ctx) => {
    const body = await req.json()
    console.info('🔶 mocked fbfs contents:', body)

    return res(
      ctx.json({
        data: `mocked fbfs data, your input is ${JSON.stringify(body)}`,
      }),
    )
  },) : null,
].filter(Boolean)

const server = setupServer(...handlers)

server.listen({onUnhandledRequest: 'warn'})
console.info('🔶 Mock server installed')

closeWithGrace(() => {
  server.close()
})
