# 🚀 Supabase Hybrid Offline-First Setup Guide

This guide will help you set up the complete Supabase hybrid offline-first system for the Birch Lounge Recipe Manager.

## 📋 Overview

The hybrid system provides:
- ✅ **Offline-first**: App works without internet using localStorage
- ✅ **Cloud sync**: Automatic backup and sync when online
- ✅ **Multi-device**: Access recipes from any device
- ✅ **Team sharing**: Support for staff accounts
- ✅ **Free tier**: Perfect for small teams (up to 50K users)

## 🔧 Step 1: Create Supabase Project

1. **Sign up for Supabase** (free): https://supabase.com
2. **Create a new project**:
   - Project name: `birch-lounge-recipes`
   - Database password: Choose a strong password
   - Region: Select closest to your location
3. **Wait for project setup** (2-3 minutes)

## 🗄️ Step 2: Set Up Database Schema

1. **Open SQL Editor** in your Supabase dashboard
2. **Copy the entire contents** of `supabase-schema.sql`
3. **Paste and run** the SQL commands
4. **Verify setup**: Check that `user_data` table appears in Table Editor

## 🔑 Step 3: Get API Keys

1. **Go to Settings > API** in your Supabase dashboard
2. **Copy these values**:
   - Project URL (e.g., `https://your-project.supabase.co`)
   - Anon public key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## ⚙️ Step 4: Configure Environment Variables

1. **Create `.env.local`** in your project root:
```bash
# Copy .env.example to .env.local and fill in your values
cp .env.example .env.local
```

2. **Edit `.env.local`** with your Supabase credentials:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: Gemini AI (can be configured in app UI)
VITE_GEMINI_API_KEY=your_gemini_api_key

# App Configuration
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=Birch Lounge Recipe Manager
```

## 🚀 Step 5: Test the Setup

1. **Start the development server**:
```bash
yarn dev
```

2. **Check the browser console** for:
   - ✅ `Supabase client initialized successfully`
   - ✅ `Hybrid storage service initialized`

3. **Test authentication**:
   - Look for sync status indicator in the header
   - Click to sign up/sign in
   - Verify cloud sync works

## 👥 Step 6: Create Staff Accounts

1. **Sign up the main account** (you)
2. **Create staff accounts**:
   - Each staff member signs up with their email
   - They get their own isolated recipe data
   - No shared data by default (secure)

## 🔄 How the Hybrid System Works

### **Offline Mode**
- All data stored in localStorage
- App works normally without internet
- Changes queued for sync when online

### **Online Mode**
- Automatic background sync to Supabase
- Real-time updates across devices
- Conflict resolution (last-write-wins)

### **Connection Recovery**
- Detects when connection restored
- Automatically syncs pending changes
- No data loss during offline periods

## 🛡️ Security Features

- **Row Level Security (RLS)**: Users only see their own data
- **JWT Authentication**: Secure token-based auth
- **HTTPS Only**: All communication encrypted
- **No shared data**: Each user has isolated recipes

## 📊 Free Tier Limits

Perfect for small teams:
- **500MB** database storage
- **2GB** bandwidth per month
- **50,000** monthly active users
- **Unlimited** API requests

## 🔧 Troubleshooting

### **"Supabase not configured" message**
- Check `.env.local` file exists and has correct values
- Restart development server after adding env vars
- Verify Supabase URL and key are correct

### **Authentication not working**
- Check Supabase project is active
- Verify RLS policies are enabled
- Check browser console for error messages

### **Sync not working**
- Check internet connection
- Verify user is signed in
- Check browser console for sync errors

### **App works offline but not syncing**
- Environment variables missing or incorrect
- Supabase project not set up correctly
- Check network connectivity

## 🎯 Usage Tips

1. **Always works offline**: The app prioritizes localStorage
2. **Sign in for sync**: Cloud features require authentication
3. **Automatic sync**: Changes sync in background when online
4. **Manual sync**: Use sync button for immediate sync
5. **Multi-device**: Sign in on any device to access recipes

## 🔄 Migration from localStorage-only

The hybrid system is **100% backward compatible**:
- Existing localStorage data preserved
- No data loss during upgrade
- Gradual migration to cloud sync
- Can disable cloud sync anytime

## 📈 Scaling Options

If you outgrow the free tier:
- **Pro Plan**: $25/month for larger teams
- **Team Plan**: $599/month for organizations
- **Self-hosted**: Use open-source Supabase

## 🆘 Support

- **Supabase Docs**: https://supabase.com/docs
- **Community**: https://github.com/supabase/supabase/discussions
- **Discord**: https://discord.supabase.com

---

## ✅ Quick Verification Checklist

- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] App starts without errors
- [ ] Sync status indicator visible
- [ ] Can sign up/sign in
- [ ] Data syncs between devices
- [ ] Works offline

**🎉 You're all set! Your Birch Lounge Recipe Manager now has enterprise-grade offline-first cloud sync capabilities.**
