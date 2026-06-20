'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { STORAGE_BUCKET } from '@/lib/constants'
import type { Documento } from '@/lib/types'

type Props = {
  documentos: Documento[]
  email: string
}

type Accion = 'descargar' | 'eliminar'

function formatFecha(fecha: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(fecha))
}

export default function AdminDashboard({ documentos, email }: Props) {
  const router = useRouter()
  const [lista, setLista] = useState(documentos)
  const [accionEnCurso, setAccionEnCurso] = useState<{ id: string; tipo: Accion } | null>(null)
  const [error, setError] = useState('')

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const handleDownload = async (documento: Documento) => {
    setError('')
    setAccionEnCurso({ id: documento.id, tipo: 'descargar' })

    const supabase = createClient()
    const { data, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(documento.ruta_archivo)

    setAccionEnCurso(null)

    if (downloadError || !data) {
      setError(`No se pudo descargar ${documento.nombre_archivo}.`)
      return
    }

    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = documento.nombre_archivo
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async (documento: Documento) => {
    const confirmar = window.confirm(
      `¿Eliminar "${documento.nombre_archivo}"?\n\nEsta acción no se puede deshacer.`
    )

    if (!confirmar) return

    setError('')
    setAccionEnCurso({ id: documento.id, tipo: 'eliminar' })

    const supabase = createClient()

    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([documento.ruta_archivo])

    if (storageError) {
      setAccionEnCurso(null)
      setError(`No se pudo eliminar ${documento.nombre_archivo}: ${storageError.message}`)
      return
    }

    const { error: deleteError } = await supabase
      .from('documentos')
      .delete()
      .eq('id', documento.id)

    setAccionEnCurso(null)

    if (deleteError) {
      setError(`El archivo se eliminó, pero no el registro: ${deleteError.message}`)
      return
    }

    setLista((actual) => actual.filter((item) => item.id !== documento.id))
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Panel Admin</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Sesión iniciada como {email}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Portal público
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Persona</th>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Archivo</th>
              <th className="px-4 py-3 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  Aún no hay documentos subidos.
                </td>
              </tr>
            ) : (
              lista.map((documento) => {
                const ocupado = accionEnCurso?.id === documento.id
                const descargando = ocupado && accionEnCurso?.tipo === 'descargar'
                const eliminando = ocupado && accionEnCurso?.tipo === 'eliminar'

                return (
                  <tr key={documento.id} className="border-t border-neutral-200 dark:border-neutral-800">
                    <td className="px-4 py-3 whitespace-nowrap">{formatFecha(documento.fecha_subida)}</td>
                    <td className="px-4 py-3">{documento.nombre_persona}</td>
                    <td className="px-4 py-3">{documento.empresa}</td>
                    <td className="px-4 py-3">{documento.nombre_archivo}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleDownload(documento)}
                          disabled={ocupado}
                          className="text-sm font-medium underline-offset-4 hover:underline disabled:opacity-50"
                        >
                          {descargando ? 'Descargando...' : 'Descargar'}
                        </button>
                        <button
                          onClick={() => handleDelete(documento)}
                          disabled={ocupado}
                          className="text-sm font-medium text-red-600 underline-offset-4 hover:underline disabled:opacity-50 dark:text-red-400"
                        >
                          {eliminando ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
