# Database Documentation

Cars365 utilizes Supabase (PostgreSQL 15+) as its primary source of truth.

## Core Schema Structure

### `users` (Auth)
Handled completely by Supabase Auth (`auth.users`).

### `organizations`
Represents the Vendor tenant.
- `id`: UUID (PK)
- `slug`: Text (Unique URL identifier)
- `status`: Enum (`pending`, `approved`, `suspended`)
- `owner_id`: UUID (FK -> auth.users)

### `branches`
Physical pickup/dropoff locations for organizations.
- `id`: UUID (PK)
- `organization_id`: UUID (FK -> organizations.id)
- `city`, `state`, `latitude`, `longitude`

### `vehicles`
The core catalog item.
- `id`: UUID (PK)
- `organization_id`: UUID (FK)
- `branch_id`: UUID (FK)
- `title`, `slug`, `make`, `model`, `year`, `category`
- `price_per_day_aud`: Integer

### `leads`
Enquiries submitted by customers to vendors.
- `id`: UUID (PK)
- `vehicle_id`: UUID (FK)
- `status`: Enum (`pending`, `contacted`, `converted`, `rejected`)

### `subscriptions`
Stripe recurring revenue tracking for organizations.

## Row Level Security (RLS)
The database enforces strict RLS. 
- **Vendors**: Can only read/update data where `organization_id` matches their auth context.
- **Customers**: Can only read `approved` vehicles and organizations.
- **Service Role**: `createAdminClient()` bypasses RLS and should only be used in secure Server Actions after verifying user authorization logic.

## Migrations
Migrations are written in plain SQL and stored in `supabase/migrations/`.
To apply migrations:
```bash
supabase db push
```

*Note: Never manually alter the schema in the Supabase Dashboard UI; always write a forward-migration file.*
