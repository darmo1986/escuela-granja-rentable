-- Borrador, NO ejecutado. Aplicar antes de activar GR.analitica.atribucionUtm.
-- No altera permisos, RLS, lectura pública ni genera ventas desde el cliente.
begin;
do $$
declare tabla text;
begin
  foreach tabla in array array['visitas', 'intenciones_compra'] loop
    execute format('alter table public.%I add column if not exists utm_source text check (utm_source in (''youtube'',''instagram'',''facebook'',''tiktok'',''granjarentable'')), add column if not exists utm_medium text check (utm_medium in (''organic_video'',''organic_social'',''banner'')), add column if not exists utm_campaign text check (utm_campaign in (''engorde_registro'',''ebook-pack'',''ebook-alimenta'',''ebook-elegir'',''ebook-hacer'',''ebook-empezar'')), add column if not exists utm_content text check (utm_content in (''w4c0OzCPWKI'',''fP3Df9d8gPI'',''GpRK3Sej8vE''))', tabla);
  end loop;
end $$;
commit;
