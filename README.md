# PitchHub-project

## Supabase booking setup

1. Open the Supabase SQL Editor for the same project and run [`supabase-schema.sql`](supabase-schema.sql).
   Re-run it after pulling this repo — older versions had an open `Anyone can view users`
   policy that exposed every user's name + email. The current schema restricts
   `public.users` to the owner + admins (via `public.is_admin()`) and blocks
   `role='admin'` self-escalation on insert/update.
2. Copy your project URL and publishable/anon key from Supabase Project Settings > API into
   `JS-Core-system/supabase-config.local.js` (gitignored, never committed):
   ```js
   window.PITCHHUB_SUPABASE_CONFIG = {
     url: 'https://xyzcompany.supabase.co',
     key: 'sb_publishable_...',
   };
   ```
   `JS-Core-system/supabase-config.js` is only a public placeholder and every page loads
   the `.local.js` override after it. Never put real credentials in the committed file.
3. Open `booking.html` through a local web server, select available slots, and click `ยืนยันการจอง`.

The booking page reads active rows from `public.bookings` and inserts selected slots. The unique index prevents the same pitch and time from being booked twice. No service-role key should be placed in the browser or this repository.

The auth pages are [`login.html`](login.html) and [`register.html`](register.html). Registration sends `first_name` and `last_name` to Supabase Auth user metadata. If email confirmation is enabled in Supabase Auth settings, users must confirm their email before logging in.

The account page removes bookings more than 48 hours past their scheduled start when opened. For automatic cleanup even when nobody opens the account page, enable `pg_cron` in Supabase and run this once in SQL Editor:

```sql
select cron.schedule('delete-expired-pitchhub-bookings', '0 * * * *', $$select public.delete_expired_bookings();$$);
```
