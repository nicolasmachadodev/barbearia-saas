import { redirect } from 'next/navigation'
import { getActiveShopId } from '../src/lib/shop'


export default async function AppPage() {
  const activeShopId = await getActiveShopId()

  if (!activeShopId) {
    redirect('/app/onboarding')
  }

  return (
    <div style={{ padding: '24px', color: 'white' }}>
      <h1>Área do app</h1>
      <p>Barbearia ativa carregada com sucesso.</p>
    </div>
  )
}
