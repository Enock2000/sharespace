# Production Environment Setup

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

### Firebase Configuration
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
```

### Backblaze B2 Configuration
```env
B2_KEY_ID=your_b2_key_id
B2_APPLICATION_KEY=your_b2_application_key
B2_BUCKET_ID=your_bucket_id
B2_BUCKET_NAME=your_bucket_name
B2_ENDPOINT=s3.us-west-001.backblazeb2.com
```

### Application Configuration
```env
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=generate_a_random_secret_key
JWT_SECRET=another_random_secret
JWT_EXPIRES_IN=24h
```

## Deployment Checklist

### 1. Firebase Setup
- [ ] Create Firebase project
- [ ] Enable Authentication (Email/Password)
- [ ] Create Realtime Database
- [ ] Configure security rules for tenant isolation
- [ ] Add your production domain to authorized domains

### 2. Backblaze B2 Setup
- [ ] Create B2 account
- [ ] Create bucket for file storage
- [ ] Generate application key with read/write permissions
- [ ] Configure CORS if needed for direct uploads

### 3. Vercel Deployment
- [ ] Connect GitHub repository to Vercel
- [ ] Add all environment variables in Vercel dashboard
- [ ] Configure production domain
- [ ] Enable automatic deployments from main branch

### 4. Email Service Integration (Optional but Recommended)
To enable user invitations via email, integrate an email service:
- SendGrid
- AWS SES
- Mailgun
- Postmark

Update `/app/api/auth/invite/route.ts` to send actual emails instead of console logs.

### 5. Security Hardening
- [ ] Review and update Firebase security rules
- [ ] Set up rate limiting (Vercel Edge Config or Upstash)
- [ ] Enable HTTPS only
- [ ] Configure CSP headers
- [ ] Set up monitoring and alerts

## Firebase Security Rules Example

```json
{
  "rules": {
    "users": {
      "$userId": {
        ".read": "auth != null && (auth.uid == $userId || root.child('users').child(auth.uid).child('tenant_id').val() == data.child('tenant_id').val())",
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    "files": {
      "$fileId": {
        ".read": "auth != null && root.child('users').child(auth.uid).child('tenant_id').val() == data.child('tenant_id').val()",
        ".write": "auth != null && root.child('users').child(auth.uid).child('tenant_id').val() == data.child('tenant_id').val()"
      }
    },
    "audit_logs": {
      "$tenantId": {
        ".read": "auth != null && root.child('users').child(auth.uid).child('tenant_id').val() == $tenantId",
        ".write": false
      }
    }
  }
}
```

## Production Features

### ✅ Implemented
- Firebase Authentication with email/password
- Real-time dashboard statistics from Firebase
- File upload to Backblaze B2
- Folder management
- User management and invitations
- Audit logging
- RBAC permissions
- Tenant isolation
- Modern, responsive UI

### 📧 Email Integration Required
The invitation system creates database records but needs an email service to send actual invitation emails to users. See the TODO in `/app/api/auth/invite/route.ts`.

### 🚀 Optional Enhancements
- File versioning UI
- Soft delete/trash functionality
- Advanced search
- File preview
- Real-time collaboration
- Mobile app

## Support

For production issues:
1. Check Vercel deployment logs
2. Review Firebase Console for auth/database errors
3. Monitor Backblaze B2 usage and errors
4. Check browser console for client-side errors
