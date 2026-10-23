-- ============================================================
-- VERDUN AUTOMOTORES · SUPABASE AUTH + RLS ENDURECIDO
-- ============================================================
-- Ejecutar en Supabase SQL Editor, después de crear el usuario
-- administrador en Authentication > Users.
--
-- IMPORTANTE:
-- 1. Cambiar ADMIN_EMAIL por el email real del usuario admin.
-- 2. Este script NO borra vehículos ni fotos.
-- 3. Solo elimina las credenciales legacy de admin_content.
-- 4. Es idempotente: se puede volver a ejecutar.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1) TABLA DE ADMINISTRADORES
-- ------------------------------------------------------------

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Cada admin puede leer su propia fila. No hay escritura desde el cliente.
drop policy if exists "admins_select_self" on public.admins;
create policy "admins_select_self"
  on public.admins
  for select
  to authenticated
  using (user_id = auth.uid());

-- ------------------------------------------------------------
-- 2) FUNCIÓN is_admin()
-- ------------------------------------------------------------
-- SECURITY DEFINER para poder consultar public.admins sin depender
-- de una política recursiva. El search_path queda fijo.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ------------------------------------------------------------
-- 3) LIMPIAR FUNCIONES Y SECRETOS LEGACY
-- ------------------------------------------------------------

drop function if exists public.admin_login(text);
drop function if exists public.admin_verify_session(text);
drop function if exists public._check_admin_session();

delete from public.admin_content
where key like 'admin_password%'
   or key like 'session_%';

-- ------------------------------------------------------------
-- 4) ELIMINAR TODAS LAS POLÍTICAS PÚBLICAS ANTERIORES
-- ------------------------------------------------------------

do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('vehicles', 'photos', 'categories', 'admin_content')
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      policy_row.policyname,
      policy_row.tablename
    );
  end loop;
end $$;

-- Storage: eliminar solo políticas del bucket stock-photos.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (
        policyname ilike '%stock-photos%'
        or policyname ilike 'stock_photos_%'
        or coalesce(qual, '') ilike '%stock-photos%'
        or coalesce(with_check, '') ilike '%stock-photos%'
      )
  loop
    execute format(
      'drop policy if exists %I on storage.objects',
      policy_row.policyname
    );
  end loop;
end $$;

-- Política legacy genérica que permitía TODO en Storage y no menciona
-- el bucket en su expresión, por eso no la detecta el bloque anterior.
drop policy if exists "Permitir todo en Storage" on storage.objects;

-- ------------------------------------------------------------
-- 5) RLS: VEHÍCULOS
-- ------------------------------------------------------------

alter table public.vehicles enable row level security;

-- Público: solo vehículos activos y publicados.
drop policy if exists "vehicles_select_public" on public.vehicles;
create policy "vehicles_select_public"
  on public.vehicles
  for select
  to anon, authenticated
  using (activo = true and status = 'publicado');

-- Admin: lectura completa, incluyendo borradores y no publicados.
drop policy if exists "vehicles_select_admin" on public.vehicles;
create policy "vehicles_select_admin"
  on public.vehicles
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "vehicles_insert_admin" on public.vehicles;
create policy "vehicles_insert_admin"
  on public.vehicles
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "vehicles_update_admin" on public.vehicles;
create policy "vehicles_update_admin"
  on public.vehicles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "vehicles_delete_admin" on public.vehicles;
create policy "vehicles_delete_admin"
  on public.vehicles
  for delete
  to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- 6) RLS: FOTOS
-- ------------------------------------------------------------

alter table public.photos enable row level security;

-- Público: fotos de vehículos activos y publicados.
drop policy if exists "photos_select_public" on public.photos;
create policy "photos_select_public"
  on public.photos
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.vehicles v
      where v.id = photos.vehicle_id
        and v.activo = true
        and v.status = 'publicado'
    )
  );

-- Admin: lectura completa.
drop policy if exists "photos_select_admin" on public.photos;
create policy "photos_select_admin"
  on public.photos
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "photos_insert_admin" on public.photos;
create policy "photos_insert_admin"
  on public.photos
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "photos_update_admin" on public.photos;
create policy "photos_update_admin"
  on public.photos
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "photos_delete_admin" on public.photos;
create policy "photos_delete_admin"
  on public.photos
  for delete
  to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- 7) RLS: CATEGORÍAS
-- ------------------------------------------------------------

alter table public.categories enable row level security;

drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public"
  on public.categories
  for select
  to anon, authenticated
  using (true);

drop policy if exists "categories_insert_admin" on public.categories;
create policy "categories_insert_admin"
  on public.categories
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "categories_update_admin" on public.categories;
create policy "categories_update_admin"
  on public.categories
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "categories_delete_admin" on public.categories;
create policy "categories_delete_admin"
  on public.categories
  for delete
  to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- 8) RLS: CONTENIDO DEL ADMIN (HERO + HISTORIAS)
-- ------------------------------------------------------------

alter table public.admin_content enable row level security;

-- Público: cualquier contenido salvo credenciales legacy.
drop policy if exists "admin_content_select_public" on public.admin_content;
create policy "admin_content_select_public"
  on public.admin_content
  for select
  to anon, authenticated
  using (
    key not like 'admin_password%'
    and key not like 'session_%'
  );

drop policy if exists "admin_content_insert_admin" on public.admin_content;
create policy "admin_content_insert_admin"
  on public.admin_content
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admin_content_update_admin" on public.admin_content;
create policy "admin_content_update_admin"
  on public.admin_content
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin_content_delete_admin" on public.admin_content;
create policy "admin_content_delete_admin"
  on public.admin_content
  for delete
  to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- 9) RLS: STORAGE (BUCKET stock-photos)
-- ------------------------------------------------------------

-- Lectura pública de objetos del bucket.
drop policy if exists "stock_photos_public_read" on storage.objects;
create policy "stock_photos_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'stock-photos');

-- Escritura solo para administradores autenticados.
drop policy if exists "stock_photos_admin_insert" on storage.objects;
create policy "stock_photos_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'stock-photos'
    and public.is_admin()
  );

drop policy if exists "stock_photos_admin_update" on storage.objects;
create policy "stock_photos_admin_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'stock-photos'
    and public.is_admin()
  )
  with check (
    bucket_id = 'stock-photos'
    and public.is_admin()
  );

drop policy if exists "stock_photos_admin_delete" on storage.objects;
create policy "stock_photos_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'stock-photos'
    and public.is_admin()
  );

-- ------------------------------------------------------------
-- 10) GRANTS
-- ------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.categories, public.vehicles, public.photos,
  public.admin_content to anon, authenticated;

grant insert, update, delete on public.vehicles, public.photos,
  public.categories, public.admin_content to authenticated;

grant select on public.admins to authenticated;

-- Secuencias de las tablas con id serial (si existen).
grant usage, select on all sequences in schema public to authenticated;

-- ------------------------------------------------------------
-- 11) VINCULAR EL USUARIO ADMIN
-- ------------------------------------------------------------
-- Cambiar este email si el usuario creado en Authentication usa otro.
-- El usuario debe existir antes de ejecutar este bloque.

do $$
declare
  admin_email text := 'admin@verdun.com.ar';
begin
  insert into public.admins (user_id, email)
  select u.id, u.email
  from auth.users u
  where lower(u.email) = lower(admin_email)
  on conflict (user_id) do update
    set email = excluded.email;

  if not exists (
    select 1 from public.admins where lower(email) = lower(admin_email)
  ) then
    raise notice
      'No existe un usuario Auth con el email %. Creá el usuario en Authentication > Users y volvé a ejecutar el bloque 11.',
      admin_email;
  end if;
end $$;

commit;

-- ============================================================
-- VERIFICACIÓN (ejecutar aparte si querés revisar)
-- ============================================================
-- select user_id, email, created_at from public.admins;
-- select tablename, policyname, roles, cmd from pg_policies
--   where schemaname = 'public'
--   order by tablename, policyname;
