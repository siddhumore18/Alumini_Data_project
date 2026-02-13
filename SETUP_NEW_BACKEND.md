# 🚀 New Supabase Backend Setup Guide

## ✅ Step 1: Credentials Updated

Your `.env` file has been updated with the new Supabase backend:

```env
NEXT_PUBLIC_SUPABASE_URL=https://extgyexrphzydjgujmlr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 Step 2: Setup Database Schema

Your new Supabase project is **empty** and needs the database schema. Follow these steps:

### **Option A: Run SQL Scripts Manually (Recommended)**

1. **Go to Supabase SQL Editor:**
   - Visit: https://supabase.com/dashboard/project/extgyexrphzydjgujmlr/sql/new

2. **Run each SQL script in order:**
   
   Copy and paste the content of each file from the `scripts/` folder into the SQL Editor and click "Run":

   ```
   ✅ 000_setup_database.sql          (Creates core tables & RLS policies)
   ✅ 001_create_alumai_schema.sql    (Alumni schema)
   ✅ 002_create_profile_trigger.sql  (Auto-create profiles)
   ✅ 003_create_faculty_profiles_table.sql
   ✅ 004_fix_profiles_rls.sql
   ✅ 005_verify_rls_policies.sql
   ✅ 006_add_test_data.sql           (Optional: Test data)
   ✅ 007_check_database_status.sql   (Verification)
   ✅ 008_add_admin_features.sql
   ✅ 009_setup_auto_delete_announcements.sql
   ✅ 010_auto_create_admin_user.sql
   ✅ 011_create_admin_user_seed.sql
   ✅ 012_make_any_user_admin.sql
   ✅ 013_create_posts_table.sql
   ✅ 014_add_linkedin_to_profiles.sql
   ✅ 015_add_role_specific_fields.sql
   ```

3. **Verify Setup:**
   - After running all scripts, run this query to verify:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

### **Option B: Quick Setup (All-in-One)**

I can create a single combined SQL file for you to run all at once. Let me know if you prefer this!

---

## 🔐 Step 3: Configure Authentication

1. **Go to Authentication Settings:**
   - Visit: https://supabase.com/dashboard/project/extgyexrphzydjgujmlr/auth/users

2. **Enable Email Auth:**
   - Go to: Authentication > Providers
   - Enable "Email" provider
   - Configure email templates if needed

3. **Set Site URL and Redirect URLs (Critical for email verification!):**
   - Go to: Authentication > URL Configuration
   - **Site URL:** Add your app URL (e.g. `http://localhost:3000` for dev, `https://your-domain.com` for prod)
   - **Redirect URLs:** Add these to the allow list so email confirmation links work:
     - `http://localhost:3000/auth/callback` (development)
     - `https://your-domain.com/auth/callback` (production)
   - Without these, users won't be able to verify their email after signup.

---

## 📦 Step 4: Configure Storage (If needed)

If your app uses file uploads:

1. **Go to Storage:**
   - Visit: https://supabase.com/dashboard/project/extgyexrphzydjgujmlr/storage/buckets

2. **Create Buckets:**
   - Create buckets for: `avatars`, `documents`, `images`, etc.
   - Set appropriate policies (public/private)

---

## 🧪 Step 5: Test the Connection

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   - Visit: http://localhost:3000
   - Try to sign up/login
   - Check if data is being saved

4. **Verify in Supabase:**
   - Go to: https://supabase.com/dashboard/project/extgyexrphzydjgujmlr/editor
   - Check if tables are being populated

---

## 🔍 Troubleshooting

### **Connection Issues:**
- ✅ Verify `.env` file has correct credentials
- ✅ Restart dev server after changing `.env`
- ✅ Check browser console for errors

### **Database Errors:**
- ✅ Ensure all SQL scripts ran successfully
- ✅ Check RLS policies are enabled
- ✅ Verify user roles are set correctly

### **Authentication / Registration Issues:**
- ✅ Check email provider is enabled (Authentication > Providers > Email)
- ✅ Verify Site URL is configured (Authentication > URL Configuration)
- ✅ **Add `/auth/callback` to Redirect URLs** (Authentication > URL Configuration) — required for email verification
- ✅ Check spam folder for confirmation emails
- ✅ Use "Resend confirmation email" on the sign-up success page if email didn't arrive

---

## 📊 Database Tables Created

After running all scripts, you should have these tables:

- `profiles` - User profiles (alumni/faculty/admin)
- `academic_records` - Student academic data
- `projects` - User projects
- `faculty_profiles` - Faculty-specific data
- `posts` - Social posts/updates
- `announcements` - System announcements
- `admin_users` - Admin management

---

## 🎯 Next Steps

1. ✅ Run all SQL scripts in Supabase SQL Editor
2. ✅ Configure authentication settings
3. ✅ Test the application locally
4. ✅ Create your first admin user
5. ✅ Deploy frontend to Vercel/Netlify

---

## 🆘 Need Help?

If you encounter any issues:
1. Check Supabase logs: https://supabase.com/dashboard/project/extgyexrphzydjgujmlr/logs/explorer
2. Review SQL script errors in the SQL Editor
3. Ask me for help with specific error messages!

---

**Your new backend is ready to use!** 🎉
