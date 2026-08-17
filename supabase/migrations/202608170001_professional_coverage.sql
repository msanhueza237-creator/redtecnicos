begin;

create table if not exists public.chile_communes (
  official_code text primary key check (official_code ~ '^[0-9]{5}$'),
  region_code text not null,
  commune_name text not null,
  unique (region_code, commune_name)
);

comment on table public.chile_communes is
  'Catálogo territorial oficial usado para validar cobertura; fuente BCN/SIIT.';

insert into public.chile_communes (official_code, region_code, commune_name)
values
  ('15101', 'CL-AP', 'Arica'),
  ('15102', 'CL-AP', 'Camarones'),
  ('15202', 'CL-AP', 'General Lagos'),
  ('15201', 'CL-AP', 'Putre'),
  ('01107', 'CL-TA', 'Alto Hospicio'),
  ('01402', 'CL-TA', 'Camiña'),
  ('01403', 'CL-TA', 'Colchane'),
  ('01404', 'CL-TA', 'Huara'),
  ('01101', 'CL-TA', 'Iquique'),
  ('01405', 'CL-TA', 'Pica'),
  ('01401', 'CL-TA', 'Pozo Almonte'),
  ('02101', 'CL-AN', 'Antofagasta'),
  ('02201', 'CL-AN', 'Calama'),
  ('02302', 'CL-AN', 'María Elena'),
  ('02102', 'CL-AN', 'Mejillones'),
  ('02202', 'CL-AN', 'Ollagüe'),
  ('02203', 'CL-AN', 'San Pedro de Atacama'),
  ('02103', 'CL-AN', 'Sierra Gorda'),
  ('02104', 'CL-AN', 'Taltal'),
  ('02301', 'CL-AN', 'Tocopilla'),
  ('03302', 'CL-AT', 'Alto del Carmen'),
  ('03102', 'CL-AT', 'Caldera'),
  ('03201', 'CL-AT', 'Chañaral'),
  ('03101', 'CL-AT', 'Copiapó'),
  ('03202', 'CL-AT', 'Diego de Almagro'),
  ('03303', 'CL-AT', 'Freirina'),
  ('03304', 'CL-AT', 'Huasco'),
  ('03103', 'CL-AT', 'Tierra Amarilla'),
  ('03301', 'CL-AT', 'Vallenar'),
  ('04103', 'CL-CO', 'Andacollo'),
  ('04202', 'CL-CO', 'Canela'),
  ('04302', 'CL-CO', 'Combarbalá'),
  ('04102', 'CL-CO', 'Coquimbo'),
  ('04201', 'CL-CO', 'Illapel'),
  ('04104', 'CL-CO', 'La Higuera'),
  ('04101', 'CL-CO', 'La Serena'),
  ('04203', 'CL-CO', 'Los Vilos'),
  ('04303', 'CL-CO', 'Monte Patria'),
  ('04301', 'CL-CO', 'Ovalle'),
  ('04105', 'CL-CO', 'Paihuano'),
  ('04304', 'CL-CO', 'Punitaqui'),
  ('04305', 'CL-CO', 'Río Hurtado'),
  ('04204', 'CL-CO', 'Salamanca'),
  ('04106', 'CL-CO', 'Vicuña'),
  ('05602', 'CL-VS', 'Algarrobo'),
  ('05402', 'CL-VS', 'Cabildo'),
  ('05302', 'CL-VS', 'Calle Larga'),
  ('05603', 'CL-VS', 'Cartagena'),
  ('05102', 'CL-VS', 'Casablanca'),
  ('05702', 'CL-VS', 'Catemu'),
  ('05103', 'CL-VS', 'Concón'),
  ('05604', 'CL-VS', 'El Quisco'),
  ('05605', 'CL-VS', 'El Tabo'),
  ('05503', 'CL-VS', 'Hijuelas'),
  ('05201', 'CL-VS', 'Isla de Pascua'),
  ('05104', 'CL-VS', 'Juan Fernández'),
  ('05502', 'CL-VS', 'La Calera'),
  ('05504', 'CL-VS', 'La Cruz'),
  ('05401', 'CL-VS', 'La Ligua'),
  ('05802', 'CL-VS', 'Limache'),
  ('05703', 'CL-VS', 'Llaillay'),
  ('05301', 'CL-VS', 'Los Andes'),
  ('05506', 'CL-VS', 'Nogales'),
  ('05803', 'CL-VS', 'Olmué'),
  ('05704', 'CL-VS', 'Panquehue'),
  ('05403', 'CL-VS', 'Papudo'),
  ('05404', 'CL-VS', 'Petorca'),
  ('05105', 'CL-VS', 'Puchuncaví'),
  ('05705', 'CL-VS', 'Putaendo'),
  ('05501', 'CL-VS', 'Quillota'),
  ('05801', 'CL-VS', 'Quilpué'),
  ('05107', 'CL-VS', 'Quintero'),
  ('05303', 'CL-VS', 'Rinconada'),
  ('05601', 'CL-VS', 'San Antonio'),
  ('05304', 'CL-VS', 'San Esteban'),
  ('05701', 'CL-VS', 'San Felipe'),
  ('05706', 'CL-VS', 'Santa María'),
  ('05606', 'CL-VS', 'Santo Domingo'),
  ('05101', 'CL-VS', 'Valparaíso'),
  ('05804', 'CL-VS', 'Villa Alemana'),
  ('05109', 'CL-VS', 'Viña del Mar'),
  ('05405', 'CL-VS', 'Zapallar'),
  ('13502', 'CL-RM', 'Alhué'),
  ('13402', 'CL-RM', 'Buin'),
  ('13403', 'CL-RM', 'Calera de Tango'),
  ('13102', 'CL-RM', 'Cerrillos'),
  ('13103', 'CL-RM', 'Cerro Navia'),
  ('13301', 'CL-RM', 'Colina'),
  ('13104', 'CL-RM', 'Conchalí'),
  ('13503', 'CL-RM', 'Curacaví'),
  ('13105', 'CL-RM', 'El Bosque'),
  ('13602', 'CL-RM', 'El Monte'),
  ('13106', 'CL-RM', 'Estación Central'),
  ('13107', 'CL-RM', 'Huechuraba'),
  ('13108', 'CL-RM', 'Independencia'),
  ('13603', 'CL-RM', 'Isla de Maipo'),
  ('13109', 'CL-RM', 'La Cisterna'),
  ('13110', 'CL-RM', 'La Florida'),
  ('13111', 'CL-RM', 'La Granja'),
  ('13112', 'CL-RM', 'La Pintana'),
  ('13113', 'CL-RM', 'La Reina'),
  ('13302', 'CL-RM', 'Lampa'),
  ('13114', 'CL-RM', 'Las Condes'),
  ('13115', 'CL-RM', 'Lo Barnechea'),
  ('13116', 'CL-RM', 'Lo Espejo'),
  ('13117', 'CL-RM', 'Lo Prado'),
  ('13118', 'CL-RM', 'Macul'),
  ('13119', 'CL-RM', 'Maipú'),
  ('13504', 'CL-RM', 'María Pinto'),
  ('13501', 'CL-RM', 'Melipilla'),
  ('13120', 'CL-RM', 'Ñuñoa'),
  ('13604', 'CL-RM', 'Padre Hurtado'),
  ('13404', 'CL-RM', 'Paine'),
  ('13121', 'CL-RM', 'Pedro Aguirre Cerda'),
  ('13605', 'CL-RM', 'Peñaflor'),
  ('13122', 'CL-RM', 'Peñalolén'),
  ('13202', 'CL-RM', 'Pirque'),
  ('13123', 'CL-RM', 'Providencia'),
  ('13124', 'CL-RM', 'Pudahuel'),
  ('13201', 'CL-RM', 'Puente Alto'),
  ('13125', 'CL-RM', 'Quilicura'),
  ('13126', 'CL-RM', 'Quinta Normal'),
  ('13127', 'CL-RM', 'Recoleta'),
  ('13128', 'CL-RM', 'Renca'),
  ('13401', 'CL-RM', 'San Bernardo'),
  ('13129', 'CL-RM', 'San Joaquín'),
  ('13203', 'CL-RM', 'San José de Maipo'),
  ('13130', 'CL-RM', 'San Miguel'),
  ('13505', 'CL-RM', 'San Pedro'),
  ('13131', 'CL-RM', 'San Ramón'),
  ('13101', 'CL-RM', 'Santiago'),
  ('13601', 'CL-RM', 'Talagante'),
  ('13303', 'CL-RM', 'Tiltil'),
  ('13132', 'CL-RM', 'Vitacura'),
  ('06302', 'CL-LI', 'Chépica'),
  ('06303', 'CL-LI', 'Chimbarongo'),
  ('06102', 'CL-LI', 'Codegua'),
  ('06103', 'CL-LI', 'Coinco'),
  ('06104', 'CL-LI', 'Coltauco'),
  ('06105', 'CL-LI', 'Doñihue'),
  ('06106', 'CL-LI', 'Graneros'),
  ('06202', 'CL-LI', 'La Estrella'),
  ('06107', 'CL-LI', 'Las Cabras'),
  ('06203', 'CL-LI', 'Litueche'),
  ('06304', 'CL-LI', 'Lolol'),
  ('06108', 'CL-LI', 'Machalí'),
  ('06109', 'CL-LI', 'Malloa'),
  ('06204', 'CL-LI', 'Marchihue'),
  ('06110', 'CL-LI', 'Mostazal'),
  ('06305', 'CL-LI', 'Nancagua'),
  ('06205', 'CL-LI', 'Navidad'),
  ('06111', 'CL-LI', 'Olivar'),
  ('06306', 'CL-LI', 'Palmilla'),
  ('06206', 'CL-LI', 'Paredones'),
  ('06307', 'CL-LI', 'Peralillo'),
  ('06112', 'CL-LI', 'Peumo'),
  ('06113', 'CL-LI', 'Pichidegua'),
  ('06201', 'CL-LI', 'Pichilemu'),
  ('06308', 'CL-LI', 'Placilla'),
  ('06309', 'CL-LI', 'Pumanque'),
  ('06114', 'CL-LI', 'Quinta de Tilcoco'),
  ('06101', 'CL-LI', 'Rancagua'),
  ('06115', 'CL-LI', 'Rengo'),
  ('06116', 'CL-LI', 'Requínoa'),
  ('06301', 'CL-LI', 'San Fernando'),
  ('06117', 'CL-LI', 'San Vicente'),
  ('06310', 'CL-LI', 'Santa Cruz'),
  ('07201', 'CL-ML', 'Cauquenes'),
  ('07202', 'CL-ML', 'Chanco'),
  ('07402', 'CL-ML', 'Colbún'),
  ('07102', 'CL-ML', 'Constitución'),
  ('07103', 'CL-ML', 'Curepto'),
  ('07301', 'CL-ML', 'Curicó'),
  ('07104', 'CL-ML', 'Empedrado'),
  ('07302', 'CL-ML', 'Hualañé'),
  ('07303', 'CL-ML', 'Licantén'),
  ('07401', 'CL-ML', 'Linares'),
  ('07403', 'CL-ML', 'Longaví'),
  ('07105', 'CL-ML', 'Maule'),
  ('07304', 'CL-ML', 'Molina'),
  ('07404', 'CL-ML', 'Parral'),
  ('07106', 'CL-ML', 'Pelarco'),
  ('07203', 'CL-ML', 'Pelluhue'),
  ('07107', 'CL-ML', 'Pencahue'),
  ('07305', 'CL-ML', 'Rauco'),
  ('07405', 'CL-ML', 'Retiro'),
  ('07108', 'CL-ML', 'Río Claro'),
  ('07306', 'CL-ML', 'Romeral'),
  ('07307', 'CL-ML', 'Sagrada Familia'),
  ('07109', 'CL-ML', 'San Clemente'),
  ('07406', 'CL-ML', 'San Javier'),
  ('07110', 'CL-ML', 'San Rafael'),
  ('07101', 'CL-ML', 'Talca'),
  ('07308', 'CL-ML', 'Teno'),
  ('07309', 'CL-ML', 'Vichuquén'),
  ('07407', 'CL-ML', 'Villa Alegre'),
  ('07408', 'CL-ML', 'Yerbas Buenas'),
  ('16102', 'CL-NB', 'Bulnes'),
  ('16101', 'CL-NB', 'Chillán'),
  ('16103', 'CL-NB', 'Chillán Viejo'),
  ('16202', 'CL-NB', 'Cobquecura'),
  ('16203', 'CL-NB', 'Coelemu'),
  ('16302', 'CL-NB', 'Coihueco'),
  ('16104', 'CL-NB', 'El Carmen'),
  ('16204', 'CL-NB', 'Ninhue'),
  ('16303', 'CL-NB', 'Ñiquén'),
  ('16105', 'CL-NB', 'Pemuco'),
  ('16106', 'CL-NB', 'Pinto'),
  ('16205', 'CL-NB', 'Portezuelo'),
  ('16107', 'CL-NB', 'Quillón'),
  ('16201', 'CL-NB', 'Quirihue'),
  ('16206', 'CL-NB', 'Ránquil'),
  ('16301', 'CL-NB', 'San Carlos'),
  ('16304', 'CL-NB', 'San Fabián'),
  ('16108', 'CL-NB', 'San Ignacio'),
  ('16305', 'CL-NB', 'San Nicolás'),
  ('16207', 'CL-NB', 'Treguaco'),
  ('16109', 'CL-NB', 'Yungay'),
  ('08314', 'CL-BI', 'Alto Biobío'),
  ('08302', 'CL-BI', 'Antuco'),
  ('08202', 'CL-BI', 'Arauco'),
  ('08303', 'CL-BI', 'Cabrero'),
  ('08203', 'CL-BI', 'Cañete'),
  ('08103', 'CL-BI', 'Chiguayante'),
  ('08101', 'CL-BI', 'Concepción'),
  ('08204', 'CL-BI', 'Contulmo'),
  ('08102', 'CL-BI', 'Coronel'),
  ('08205', 'CL-BI', 'Curanilahue'),
  ('08104', 'CL-BI', 'Florida'),
  ('08112', 'CL-BI', 'Hualpén'),
  ('08105', 'CL-BI', 'Hualqui'),
  ('08304', 'CL-BI', 'Laja'),
  ('08201', 'CL-BI', 'Lebu'),
  ('08206', 'CL-BI', 'Los Alamos'),
  ('08301', 'CL-BI', 'Los Angeles'),
  ('08106', 'CL-BI', 'Lota'),
  ('08305', 'CL-BI', 'Mulchén'),
  ('08306', 'CL-BI', 'Nacimiento'),
  ('08307', 'CL-BI', 'Negrete'),
  ('08107', 'CL-BI', 'Penco'),
  ('08308', 'CL-BI', 'Quilaco'),
  ('08309', 'CL-BI', 'Quilleco'),
  ('08108', 'CL-BI', 'San Pedro de la Paz'),
  ('08310', 'CL-BI', 'San Rosendo'),
  ('08311', 'CL-BI', 'Santa Bárbara'),
  ('08109', 'CL-BI', 'Santa Juana'),
  ('08110', 'CL-BI', 'Talcahuano'),
  ('08207', 'CL-BI', 'Tirúa'),
  ('08111', 'CL-BI', 'Tomé'),
  ('08312', 'CL-BI', 'Tucapel'),
  ('08313', 'CL-BI', 'Yumbel'),
  ('09201', 'CL-AR', 'Angol'),
  ('09102', 'CL-AR', 'Carahue'),
  ('09121', 'CL-AR', 'Cholchol'),
  ('09202', 'CL-AR', 'Collipulli'),
  ('09103', 'CL-AR', 'Cunco'),
  ('09203', 'CL-AR', 'Curacautín'),
  ('09104', 'CL-AR', 'Curarrehue'),
  ('09204', 'CL-AR', 'Ercilla'),
  ('09105', 'CL-AR', 'Freire'),
  ('09106', 'CL-AR', 'Galvarino'),
  ('09107', 'CL-AR', 'Gorbea'),
  ('09108', 'CL-AR', 'Lautaro'),
  ('09109', 'CL-AR', 'Loncoche'),
  ('09205', 'CL-AR', 'Lonquimay'),
  ('09206', 'CL-AR', 'Los Sauces'),
  ('09207', 'CL-AR', 'Lumaco'),
  ('09110', 'CL-AR', 'Melipeuco'),
  ('09111', 'CL-AR', 'Nueva Imperial'),
  ('09112', 'CL-AR', 'Padre Las Casas'),
  ('09113', 'CL-AR', 'Perquenco'),
  ('09114', 'CL-AR', 'Pitrufquén'),
  ('09115', 'CL-AR', 'Pucón'),
  ('09208', 'CL-AR', 'Purén'),
  ('09209', 'CL-AR', 'Renaico'),
  ('09116', 'CL-AR', 'Saavedra'),
  ('09101', 'CL-AR', 'Temuco'),
  ('09117', 'CL-AR', 'Teodoro Schmidt'),
  ('09118', 'CL-AR', 'Toltén'),
  ('09210', 'CL-AR', 'Traiguén'),
  ('09211', 'CL-AR', 'Victoria'),
  ('09119', 'CL-AR', 'Vilcún'),
  ('09120', 'CL-AR', 'Villarrica'),
  ('14102', 'CL-LR', 'Corral'),
  ('14202', 'CL-LR', 'Futrono'),
  ('14201', 'CL-LR', 'La Unión'),
  ('14203', 'CL-LR', 'Lago Ranco'),
  ('14103', 'CL-LR', 'Lanco'),
  ('14104', 'CL-LR', 'Los Lagos'),
  ('14105', 'CL-LR', 'Máfil'),
  ('14106', 'CL-LR', 'Mariquina'),
  ('14107', 'CL-LR', 'Paillaco'),
  ('14108', 'CL-LR', 'Panguipulli'),
  ('14204', 'CL-LR', 'Río Bueno'),
  ('14101', 'CL-LR', 'Valdivia'),
  ('10202', 'CL-LL', 'Ancud'),
  ('10102', 'CL-LL', 'Calbuco'),
  ('10201', 'CL-LL', 'Castro'),
  ('10401', 'CL-LL', 'Chaitén'),
  ('10203', 'CL-LL', 'Chonchi'),
  ('10103', 'CL-LL', 'Cochamó'),
  ('10204', 'CL-LL', 'Curaco de Vélez'),
  ('10205', 'CL-LL', 'Dalcahue'),
  ('10104', 'CL-LL', 'Fresia'),
  ('10105', 'CL-LL', 'Frutillar'),
  ('10402', 'CL-LL', 'Futaleufú'),
  ('10403', 'CL-LL', 'Hualaihué'),
  ('10107', 'CL-LL', 'Llanquihue'),
  ('10106', 'CL-LL', 'Los Muermos'),
  ('10108', 'CL-LL', 'Maullín'),
  ('10301', 'CL-LL', 'Osorno'),
  ('10404', 'CL-LL', 'Palena'),
  ('10101', 'CL-LL', 'Puerto Montt'),
  ('10302', 'CL-LL', 'Puerto Octay'),
  ('10109', 'CL-LL', 'Puerto Varas'),
  ('10206', 'CL-LL', 'Puqueldón'),
  ('10303', 'CL-LL', 'Purranque'),
  ('10304', 'CL-LL', 'Puyehue'),
  ('10207', 'CL-LL', 'Queilén'),
  ('10208', 'CL-LL', 'Quellón'),
  ('10209', 'CL-LL', 'Quemchi'),
  ('10210', 'CL-LL', 'Quinchao'),
  ('10305', 'CL-LL', 'Río Negro'),
  ('10306', 'CL-LL', 'San Juan de la Costa'),
  ('10307', 'CL-LL', 'San Pablo'),
  ('11201', 'CL-AI', 'Aysén'),
  ('11401', 'CL-AI', 'Chile Chico'),
  ('11202', 'CL-AI', 'Cisnes'),
  ('11301', 'CL-AI', 'Cochrane'),
  ('11101', 'CL-AI', 'Coyhaique'),
  ('11203', 'CL-AI', 'Guaitecas'),
  ('11102', 'CL-AI', 'Lago Verde'),
  ('11302', 'CL-AI', 'O''Higgins'),
  ('11402', 'CL-AI', 'Río Ibáñez'),
  ('11303', 'CL-AI', 'Tortel'),
  ('12202', 'CL-MA', 'Antártica'),
  ('12201', 'CL-MA', 'Cabo de Hornos'),
  ('12102', 'CL-MA', 'Laguna Blanca'),
  ('12401', 'CL-MA', 'Natales'),
  ('12301', 'CL-MA', 'Porvenir'),
  ('12302', 'CL-MA', 'Primavera'),
  ('12101', 'CL-MA', 'Punta Arenas'),
  ('12103', 'CL-MA', 'Río Verde'),
  ('12104', 'CL-MA', 'San Gregorio'),
  ('12303', 'CL-MA', 'Timaukel'),
  ('12402', 'CL-MA', 'Torres del Paine')
on conflict (official_code) do update set
  region_code = excluded.region_code,
  commune_name = excluded.commune_name;

alter table public.chile_communes enable row level security;
drop policy if exists chile_communes_public_read on public.chile_communes;
create policy chile_communes_public_read on public.chile_communes
for select to anon, authenticated
using (true);

revoke all on public.chile_communes from anon, authenticated;
grant select on public.chile_communes to anon, authenticated;

create or replace function private.validate_professional_profile_coverage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.region_code is null and coalesce(cardinality(new.commune_codes), 0) = 0 then
    return new;
  end if;

  if new.region_code is null then
    raise exception 'La cobertura requiere una región.';
  end if;

  if coalesce(cardinality(new.commune_codes), 0) > 60 then
    raise exception 'La cobertura no puede superar 60 comunas.';
  end if;

  if exists (
    select 1
    from unnest(new.commune_codes) selected(commune_name)
    where not exists (
      select 1
      from public.chile_communes catalog
      where catalog.region_code = new.region_code
        and catalog.commune_name = selected.commune_name
    )
  ) then
    raise exception 'Una o más comunas no pertenecen a la región seleccionada.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_professional_profile_coverage on public.professional_profiles;
create trigger validate_professional_profile_coverage
before insert or update of region_code, commune_codes on public.professional_profiles
for each row execute function private.validate_professional_profile_coverage();

create or replace function public.update_owned_profile_coverage(
  p_region_code text,
  p_commune_names text[],
  p_modalities text[],
  p_has_vehicle boolean
)
returns table (
  updated_region_code text,
  updated_commune_names text[],
  updated_modalities text[],
  updated_has_vehicle boolean,
  updated_status public.profile_status
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_record public.professional_profiles%rowtype;
  safe_communes text[];
  safe_modalities text[];
  next_status public.profile_status;
begin
  if (select private.current_app_role()) not in ('technician', 'company') then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  if p_region_code not in (
    'CL-AP', 'CL-TA', 'CL-AN', 'CL-AT', 'CL-CO', 'CL-VS', 'CL-RM', 'CL-LI',
    'CL-ML', 'CL-NB', 'CL-BI', 'CL-AR', 'CL-LR', 'CL-LL', 'CL-AI', 'CL-MA'
  ) then
    raise exception 'Región no válida.';
  end if;

  select array_agg(commune_name order by first_position)
  into safe_communes
  from (
    select trim(commune) as commune_name, min(position) as first_position
    from unnest(coalesce(p_commune_names, '{}'::text[])) with ordinality as selected(commune, position)
    where char_length(trim(commune)) between 2 and 100
    group by trim(commune)
  ) normalized;

  if coalesce(cardinality(safe_communes), 0) < 1 or cardinality(safe_communes) > 60 then
    raise exception 'Selecciona entre 1 y 60 comunas.';
  end if;

  if exists (
    select 1
    from unnest(safe_communes) selected(commune_name)
    where not exists (
      select 1
      from public.chile_communes catalog
      where catalog.region_code = p_region_code
        and catalog.commune_name = selected.commune_name
    )
  ) then
    raise exception 'Una o más comunas no pertenecen a la región seleccionada.';
  end if;

  select array_agg(modality order by first_position)
  into safe_modalities
  from (
    select trim(value) as modality, min(position) as first_position
    from unnest(coalesce(p_modalities, '{}'::text[])) with ordinality as selected(value, position)
    where trim(value) = any(array[
      'Atención a domicilio', 'Atención en taller', 'Diagnóstico remoto inicial'
    ]::text[])
    group by trim(value)
  ) normalized;

  if coalesce(cardinality(safe_modalities), 0) < 1 then
    raise exception 'Selecciona al menos una modalidad.';
  end if;

  select * into profile_record
  from public.professional_profiles
  where owner_user_id = (select auth.uid())
  for update;

  if not found then raise exception 'Perfil profesional no encontrado.'; end if;
  if profile_record.status in ('suspended', 'rejected', 'deleted') then
    raise exception 'El estado actual no permite editar la cobertura.';
  end if;

  next_status := case
    when profile_record.status in ('approved', 'verified', 'under_review')
      then 'submitted'::public.profile_status
    else profile_record.status
  end;

  update public.professional_profiles
  set region_code = p_region_code,
      commune_codes = safe_communes,
      modalities = safe_modalities,
      has_vehicle = coalesce(p_has_vehicle, false),
      status = next_status,
      submitted_at = case when next_status = 'submitted' then now() else submitted_at end
  where id = profile_record.id;

  insert into public.audit_log (
    actor_user_id, action, entity_type, entity_id, reason, before_data, after_data
  ) values (
    (select auth.uid()),
    'profile.coverage_updated',
    'professional_profile',
    profile_record.id::text,
    'Cobertura actualizada por el propietario del perfil.',
    jsonb_build_object('region_code', profile_record.region_code, 'commune_names', profile_record.commune_codes),
    jsonb_build_object('region_code', p_region_code, 'commune_names', safe_communes, 'status', next_status)
  );

  return query select p_region_code, safe_communes, safe_modalities, coalesce(p_has_vehicle, false), next_status;
end;
$$;

revoke all on function public.update_owned_profile_coverage(text, text[], text[], boolean) from public, anon;
grant execute on function public.update_owned_profile_coverage(text, text[], text[], boolean) to authenticated;

commit;
