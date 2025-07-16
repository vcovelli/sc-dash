# Relational UI Testing Guide

This guide helps you set up and test the relational-ui page with proper authentication and data.

## Quick Setup

### 1. Run the Automated Setup Script

```bash
# Set up everything in one command
python scripts/setup_relational_ui_testing.py

# Or clean existing data and start fresh
python scripts/setup_relational_ui_testing.py --clean
```

### 2. Test the Setup

1. **Start your development servers:**
   ```bash
   # Backend (in one terminal)
   cd backend
   python manage.py runserver

   # Frontend (in another terminal)
   cd frontend
   npm run dev
   ```

2. **Login and test:**
   - Navigate to `http://localhost:3000/login`
   - Login with: `relational@test.com` / `testpass123`
   - Navigate to `http://localhost:3000/relational-ui`
   - You should see populated data in all tables!

## What the Setup Creates

### Test Organization & Users
- **Organization:** "Test Organization" 
- **Users with different roles:**
  - `owner@test.com` - Owner role
  - `manager@test.com` - National Manager
  - `employee@test.com` - Employee
  - `client@test.com` - Client
  - `readonly@test.com` - Read Only
  - `relational@test.com` - Owner (specifically for relational UI testing)

### Sample Data (realistic business data)
- **5 Suppliers** - TechCorp Solutions, Global Electronics, etc.
- **5 Warehouses** - West Coast Distribution, East Coast Fulfillment, etc.
- **8 Customers** - Acme Corporation, Beta Industries, etc.
- **12 Products** - Electronics and tech accessories with realistic prices
- **~30 Inventory items** - Products distributed across warehouses
- **25 Orders** - Recent orders with various statuses
- **~20 Shipments** - Tracking shipments with carriers and dates

## Manual Setup (if needed)

### 1. Set up Organization and Users
```bash
cd backend
python manage.py setup_test_org --clean
```

### 2. Set up Relational Data
```bash
# Get the organization ID first
python manage.py shell -c "from accounts.models import Organization; print(Organization.objects.get(name='Test Organization').id)"

# Use the ID in the command
python manage.py setup_relational_test_data --org-id=<ORG_ID> --clean
```

## Troubleshooting

### Issue: "Redirects to login page"

**Symptoms:** Navigating to `/relational-ui` immediately redirects to `/login`

**Causes & Solutions:**

1. **Not logged in:**
   - Login with `relational@test.com` / `testpass123`

2. **Token expired:**
   - Clear browser localStorage and login again
   - Or logout and login again

3. **Backend not running:**
   - Ensure backend is running on `http://localhost:8000`
   - Check `NEXT_PUBLIC_BACKEND_URL` in frontend environment

### Issue: "Empty data showing"

**Symptoms:** Page loads but shows "No data found" messages

**Causes & Solutions:**

1. **Test data not created:**
   ```bash
   python scripts/setup_relational_ui_testing.py --clean
   ```

2. **Database connection issues:**
   - Check PostgreSQL is running
   - Verify organization database exists: `orgdata_<ORG_ID>`
   - Check database credentials in `.env`

3. **API endpoint issues:**
   - Test API directly: `http://localhost:8000/api/suppliers/`
   - Check backend logs for errors

### Issue: "Frontend crashes or errors"

**Symptoms:** JavaScript errors, page crashes

**Causes & Solutions:**

1. **Frontend dependencies:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Environment variables:**
   - Check `NEXT_PUBLIC_BACKEND_URL` is set correctly
   - Usually: `http://localhost:8000`

3. **Clear browser cache:**
   - Hard refresh (Ctrl+Shift+R)
   - Clear application data in DevTools

## Development Workflow

### Adding More Test Data
```bash
# Add more data to existing organization
python manage.py setup_relational_test_data --org-id=<ORG_ID>

# Start completely fresh
python scripts/setup_relational_ui_testing.py --clean
```

### Testing Different User Roles
Login with different test users to test permissions:
- `owner@test.com` - Full access
- `employee@test.com` - Limited access
- `readonly@test.com` - View only

### API Testing
Test the backend API directly:
```bash
# Get all suppliers
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8000/api/suppliers/

# Get all products
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8000/api/products/
```

## Database Schema

The relational data includes these tables with relationships:

```
suppliers
├── products (supplier FK)
    └── inventory (product FK, warehouse FK)

warehouses
└── inventory (warehouse FK)

customers
└── orders (customer FK)
    └── shipments (order FK)
```

## Files Created/Modified

### New Management Commands
- `backend/accounts/management/commands/setup_relational_test_data.py`

### Setup Scripts
- `scripts/setup_relational_ui_testing.py`

### Frontend Improvements
- Enhanced empty state handling in `SheetsPageInner.tsx`
- Better authentication flow
- Graceful error handling for empty data

## Common Use Cases

### Testing Empty State
1. Run setup without the relational data command
2. Login and navigate to relational-ui
3. Should see friendly empty state with "Add First" buttons

### Testing Data Population
1. Run full setup script
2. Login and test each table tab
3. Verify data loads and CRUD operations work

### Testing Authentication
1. Access relational-ui without login (should redirect)
2. Login with valid credentials (should work)
3. Try with expired token (should prompt re-login)

## Next Steps

- Test CRUD operations on each table
- Test relationships between tables (e.g., products → suppliers)
- Test permissions with different user roles
- Test data export/import functionality
- Add more realistic business scenarios

## Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review backend logs for API errors
3. Check browser console for frontend errors
4. Verify database connectivity and data existence
5. Ask for help with specific error messages