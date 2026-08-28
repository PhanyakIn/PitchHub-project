# PitchHub-project

## Supabase booking setup

1. Open the Supabase SQL Editor for the same project used by `my-app` and run [`supabase-schema.sql`](supabase-schema.sql).
2. Copy the project URL and publishable/anon key from Supabase Project Settings > API into [`JS-Core-system/supabase-config.js`](JS-Core-system/supabase-config.js).
3. Open `booking.html` through a local web server, select available slots, and click `ยืนยันการจอง`.

The booking page reads active rows from `public.bookings` and inserts selected slots. The unique index prevents the same pitch and time from being booked twice. No service-role key should be placed in the browser or this repository.

The auth pages are [`login.html`](login.html) and [`register.html`](register.html). Registration sends `first_name` and `last_name` to Supabase Auth user metadata. If email confirmation is enabled in Supabase Auth settings, users must confirm their email before logging in.

The account page removes bookings more than 48 hours past their scheduled start when opened. For automatic cleanup even when nobody opens the account page, enable `pg_cron` in Supabase and run this once in SQL Editor:

```sql
select cron.schedule('delete-expired-pitchhub-bookings', '0 * * * *', $$select public.delete_expired_bookings();$$);
```
