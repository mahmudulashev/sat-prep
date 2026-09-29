-- The owner's .uz address also has no daily test limit.
insert into private.unrestricted_users (email) values ('mahmud@ulashev.uz')
on conflict do nothing;
