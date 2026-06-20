'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { STORAGE_BUCKET } from '@/lib/constants'
import { buildStoragePath, isAllowedFile } from '@/lib/file-validation'

type Estado = 'idle' | 'enviando' | 'exito' | 'error'

export default function Home() {
  const [nombre, setNombre] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [archivos, setArchivos] = useState<FileList | null>(null)
  const [estado, setEstado] = useState<Estado>('idle')
  const [mensaje, setMensaje] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensaje('')

    if (!nombre.trim() || !empresa.trim()) {
      setEstado('error')
      setMensaje('Completa tu nombre y el nombre de la empresa.')
      return
    }

    if (!archivos || archivos.length === 0) {
      setEstado('error')
      setMensaje('Selecciona al menos un archivo.')
      return
    }

    const archivosArray = Array.from(archivos)
    const invalidos = archivosArray.filter((file) => !isAllowedFile(file))

    if (invalidos.length > 0) {
      setEstado('error')
      setMensaje(
        `Archivos no permitidos: ${invalidos.map((f) => f.name).join(', ')}. Solo Excel, Word, PDF e imágenes.`
      )
      return
    }

    setEstado('enviando')
    const supabase = createClient()

    try {
      for (const archivo of archivosArray) {
        const rutaArchivo = buildStoragePath(empresa, archivo.name)

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(rutaArchivo, archivo, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          throw new Error(`Error al subir ${archivo.name}: ${uploadError.message}`)
        }

        const { error: insertError } = await supabase.from('documentos').insert({
          nombre_persona: nombre.trim(),
          empresa: empresa.trim(),
          nombre_archivo: archivo.name,
          ruta_archivo: rutaArchivo,
          tipo_archivo: archivo.type || 'application/octet-stream',
        })

        if (insertError) {
          await supabase.storage.from(STORAGE_BUCKET).remove([rutaArchivo])
          throw new Error(`Error al registrar ${archivo.name}: ${insertError.message}`)
        }
      }

      setEstado('exito')
      setMensaje(
        archivosArray.length === 1
          ? 'Documento enviado correctamente.'
          : `${archivosArray.length} documentos enviados correctamente.`
      )
      setNombre('')
      setEmpresa('')
      setArchivos(null)
      ;(e.target as HTMLFormElement).reset()
    } catch (error) {
      setEstado('error')
      setMensaje(error instanceof Error ? error.message : 'Ocurrió un error inesperado.')
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col px-6 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Portal de Documentos</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Identifícate con tu nombre y empresa para subir archivos.
          </p>
        </div>
        <Link
          href="/admin/login"
          className="shrink-0 text-sm text-neutral-500 underline-offset-4 hover:underline"
        >
          Admin
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Nombre</span>
          <input
            type="text"
            placeholder="Tu nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-500 dark:border-neutral-700"
            disabled={estado === 'enviando'}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Empresa</span>
          <input
            type="text"
            placeholder="Nombre de la empresa"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-500 dark:border-neutral-700"
            disabled={estado === 'enviando'}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Documentos</span>
          <input
            type="file"
            multiple
            accept=".xlsx,.xls,.doc,.docx,.pdf,.jpg,.jpeg,.png,.gif,.webp,application/pdf,image/*"
            onChange={(e) => setArchivos(e.target.files)}
            className="rounded-lg border border-dashed border-neutral-300 px-3 py-4 text-sm dark:border-neutral-700"
            disabled={estado === 'enviando'}
          />
          <span className="text-xs text-neutral-500">
            Formatos permitidos: Excel, Word, PDF e imágenes (JPG, PNG, GIF, WEBP).
          </span>
        </label>

        <button
          type="submit"
          disabled={estado === 'enviando'}
          className="mt-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {estado === 'enviando' ? 'Enviando...' : 'Enviar documentos'}
        </button>
      </form>

      {mensaje && (
        <p
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
            estado === 'error'
              ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
              : 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
          }`}
        >
          {mensaje}
        </p>
      )}
    </main>
  )
}
