import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Documento } from '@/lib/types'
import AdminDashboard from './admin-dashboard'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: documentos, error } = await supabase
    .from('documentos')
    .select('*')
    .order('fecha_subida', { ascending: false })

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Panel Admin</h1>
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          No se pudieron cargar los documentos: {error.message}
        </p>
      </main>
    )
  }

  return <AdminDashboard documentos={(documentos ?? []) as Documento[]} email={user.email ?? ''} />
}
