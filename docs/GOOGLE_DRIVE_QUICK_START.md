# Google Drive Quick Start Guide

Get up and running with Google Drive integration in 5 minutes.

## 🚀 Quick Setup

### 1. Enable Google Drive (2 minutes)
1. Go to **Settings** → **Google Drive Storage**
2. Toggle **"Google Drive Storage"** to **ON**
3. Grant permissions when prompted

### 2. Choose Storage Folder (1 minute)
**Option A - Use Default:**
- Select **"Default (Invoices)"** ✅ Recommended for beginners

**Option B - Browse Existing:**
- Click **"Browse Folders"**
- Search and select your preferred folder

**Option C - Create New:**
- Click **"Browse Folders"** → **"New Folder"**
- Enter folder name → **"Create"**

### 3. Configure Auto-Upload (30 seconds)
- Toggle **"Automatic Upload"** to **ON** ✅ Recommended
- All new invoices will be automatically stored

### 4. Test It (1 minute)
1. Create a test invoice
2. Generate PDF
3. Check your Google Drive folder
4. Look for: `Invoice-{number}-{client}-{date}.pdf`

## 🎯 Key Features at a Glance

| Feature | What It Does | How to Use |
|---------|--------------|------------|
| **Auto Storage** | Saves invoice PDFs automatically | Enable in Settings |
| **Folder Browser** | Browse/create Google Drive folders | Click "Browse Folders" |
| **Search Folders** | Find folders quickly | Type in search box |
| **Create Folders** | Make new folders on-the-fly | Click "New Folder" |
| **Retry Failed** | Fix upload failures | Click retry buttons |
| **Status Tracking** | Monitor upload status | Check invoice details |

## 🔧 Common Tasks

### Change Storage Folder
1. Settings → Google Drive Storage
2. Click "Browse Folders"
3. Select new folder → "Select Folder"

### Retry Failed Uploads
**Single Invoice:**
- Open invoice → Click "Retry Upload"

**Multiple Invoices:**
- Settings → "Retry Failed Uploads"

### Create Organized Folders
**By Year:** `2024 Invoices`, `2023 Invoices`
**By Client:** `Client ABC`, `Client XYZ`
**By Type:** `Regular Invoices`, `Recurring Invoices`

## ⚠️ Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| "Authentication Required" | Click "Sign In to Google Drive" |
| "Permission Denied" | Check Google Account permissions |
| "Folder Not Found" | Select a different folder |
| "Quota Exceeded" | Wait 1-2 minutes, try again |
| Upload keeps failing | Check internet, retry later |

## 📋 File Naming

**Standard Invoices:**
`Invoice-INV001-ClientName-2024-01-15.pdf`

**Recurring Invoices:**
`Invoice-INV001-ClientName-2024-01-15-Recurring-Monthly.pdf`

## 🎨 Folder Browser Features

### Search
- Type to filter folders instantly
- Case-insensitive search
- Shows "X folders found"

### Create Folders
- Click "New Folder" button
- Enter name (no special characters: `<>:"/\|?*`)
- Max 255 characters
- Auto-selects new folder

### Navigation
- **Tab**: Navigate elements
- **Enter**: Select folder
- **Escape**: Close browser
- **Arrows**: Navigate list

## 🔒 Security Notes

- Files stored in **your** Google Drive
- App only accesses files it creates
- You can revoke access anytime
- Uses secure HTTPS transmission

## 📞 Need Help?

**Quick Checks:**
1. Are you signed in to Google?
2. Did you grant Drive permissions?
3. Is your internet connection stable?
4. Do you have Google Drive storage space?

**Documentation:**
- **Setup Guide**: `/docs/setup/google-drive-setup.md`
- **User Guide**: `/docs/user-guide/google-drive-guide.md`
- **Features**: `/docs/features/google-drive-integration.md`

**Status Check:**
- Visit: `your-app-url/api/google-drive/folders`
- Should return folder list if working

## ✅ Success Checklist

- [ ] Google Drive integration enabled
- [ ] Storage folder selected
- [ ] Auto-upload configured
- [ ] Test invoice uploaded successfully
- [ ] File appears in Google Drive
- [ ] Filename format is correct

---

**🎉 You're all set!** Your invoices will now be automatically backed up to Google Drive with professional organization and easy access from any device.