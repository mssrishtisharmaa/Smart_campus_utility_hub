-- Optional reference data. Run migrations first. Auth users are created by scripts/seed-demo-users.ts.
insert into public.locations(name,state,latitude,longitude) values
('New Delhi','Delhi',28.6139,77.209),('Mumbai','Maharashtra',19.076,72.8777),
('Chennai','Tamil Nadu',13.0827,80.2707),('Kolkata','West Bengal',22.5726,88.3639),
('Bengaluru','Karnataka',12.9716,77.5946),('Jaipur','Rajasthan',26.9124,75.7873),
('Guwahati','Assam',26.1445,91.7362),('Bhubaneswar','Odisha',20.2961,85.8245)
on conflict(name,latitude,longitude) do nothing;
insert into public.advisory_rules(provider,payload,is_demo) values('WeatherGPT',
'{"activity":"Pesticide spraying","version":"bharat-1.0-demo","rain_probability_threshold":50,"wind_kmh_threshold":15,"heat_c_threshold":38,"expert_validated":false}',true);
insert into public.provider_health(provider,payload,is_demo) values
('Open-Meteo','{"status":"not_checked","description":"Live adapter available; no successful retrieval claimed by this seed."}',true),
('IMD','{"status":"not_connected","description":"Authorized feed integration required."}',true);
