-- Sincroniza la proyección pública de perfiles que ya tenían fotografías
-- aprobadas antes de ampliar la galería a cinco trabajos.

begin;

with refreshed_portfolios as (
  select
    directory.profile_id,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', reviewed.id,
            'title', reviewed.title,
            'category', reviewed.category,
            'description', reviewed.description,
            'storagePath', reviewed.storage_path,
            'altText', reviewed.alt_text,
            'displayOrder', reviewed.display_order
          ) order by reviewed.display_order
        )
        from (
          select
            item.id,
            item.title,
            item.category,
            item.description,
            item.storage_path,
            item.alt_text,
            item.display_order
          from public.portfolio_items item
          where item.profile_id = directory.profile_id
            and item.status = 'reviewed'
          order by item.display_order
          limit 5
        ) reviewed
      ),
      '[]'::jsonb
    ) as portfolio
  from public.directory_profiles directory
)
update public.directory_profiles directory
set portfolio = refreshed.portfolio,
    updated_at = now()
from refreshed_portfolios refreshed
where directory.profile_id = refreshed.profile_id
  and directory.portfolio is distinct from refreshed.portfolio;

commit;
