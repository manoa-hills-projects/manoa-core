import { createFileRoute } from '@tanstack/react-router'
import { hc } from 'hono/client'
import type { AppType } from '../../../api/src/index' 

export const client = hc<AppType>(
  import.meta.env.PROD 
    ? 'https://api.armandodt2004.workers.dev' 
    : 'http://localhost:8787'
)

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    const res = await client.api.$get('/')
    
    return await res.json()
  }
})

function App() {
  const data = Route.useLoaderData()

  console.log(data);
  return (
    <>
      {JSON.stringify(data)}
    </>
  )
}
