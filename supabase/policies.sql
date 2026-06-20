-- Ejecuta este script en el SQL Editor de Supabase

-- Tabla documentos (por si necesitas recrearla)
-- create table documentos (
--   id uuid primary key default gen_random_uuid(),
--   nombre_persona text not null,
--   empresa text not null,
--   nombre_archivo text not null,
--   ruta_archivo text not null,
--   tipo_archivo text not null,
--   fecha_subida timestamp default now()
-- );

alter table documentos enable row level security;

drop policy if exists "Subida publica de documentos" on documentos;
drop policy if exists "Lectura admin de documentos" on documentos;

create policy "Subida publica de documentos"
on documentos
for insert
to anon, authenticated
with check (true);

create policy "Lectura admin de documentos"
on documentos
for select
to authenticated
using (true);

-- Politicas del bucket "Documentos"
drop policy if exists "Subida publica storage" on storage.objects;
drop policy if exists "Lectura admin storage" on storage.objects;

create policy "Subida publica storage"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'Documentos');

create policy "Lectura admin storage"
on storage.objects
for select
to authenticated
using (bucket_id = 'Documentos');
