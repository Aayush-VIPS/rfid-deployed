# External Cron Setup for Auto-Close Sessions

Since you're on **Vercel Free Tier** (no Cron support) and in **testing phase**, here are your options for automatically closing old sessions:

---

## ⚡ Quick Option: EasyCron (Free & Simple)

### What is EasyCron?
- Free service that calls your API endpoint on schedule
- No account fees, no credit card needed
- Perfect for testing phase

### Setup Steps

#### 1. Create API Endpoint for Auto-Close
**File**: Create `rfid-backend-deploy/src/routes/cron.js`

```javascript
// rfid-backend-deploy/src/routes/cron.js
import express from 'express';
import { autoCloseStaleSessions } from '../services/sessionService.js';

const router = express.Router();

// Simple authentication token (put this in your .env)
const CRON_SECRET = process.env.CRON_SECRET || 'CHANGE_ME_IN_PRODUCTION';

router.post('/auto-close-sessions', async (req, res) => {
    // Verify secret token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const result = await autoCloseStaleSessions();
        res.json({ 
            success: true, 
            message: 'Auto-close completed',
            result 
        });
    } catch (error) {
        console.error('Cron auto-close error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

export default router;
```

#### 2. Add to Your Express App
**File**: `rfid-backend-deploy/src/app.js`

```javascript
// Add this with your other route imports
import cronRoutes from './routes/cron.js';

// Add this with your other route mounts
app.use('/api/cron', cronRoutes);
```

#### 3. Add CRON_SECRET to .env
**File**: `rfid-backend-deploy/.env`

```
CRON_SECRET=your-random-secret-here-12345
```

Generate a random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 4. Setup EasyCron

1. Go to: https://www.easycron.com/
2. Click "Sign Up" (free account)
3. Create new cron job:
   - **Name**: Auto-close RFID sessions
   - **URL**: `https://your-vercel-backend-url.vercel.app/api/cron/auto-close-sessions`
   - **Cron Expression**: `*/30 * * * *` (every 30 minutes)
   - **HTTP Method**: POST
   - **HTTP Headers**: Add header:
     - Key: `Authorization`
     - Value: `Bearer your-random-secret-here-12345`
   - **Timezone**: Asia/Kolkata (IST)

5. Click "Create" and "Enable"

### Testing
```bash
# Test your endpoint manually first:
curl -X POST https://your-backend.vercel.app/api/cron/auto-close-sessions \
  -H "Authorization: Bearer your-random-secret-here-12345"

# Should return:
# {"success":true,"message":"Auto-close completed","result":{...}}
```

---

## 🔄 Alternative: Vercel Cron (Requires Paid Plan)

If you upgrade to **Vercel Hobby ($20/month)**, you get native Cron support:

### Setup Steps

#### 1. Create `vercel.json`
**File**: `rfid-backend-deploy/vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-close-sessions",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

#### 2. Modify Cron Endpoint for Vercel
**File**: `rfid-backend-deploy/src/routes/cron.js`

```javascript
router.post('/auto-close-sessions', async (req, res) => {
    // Vercel Cron sends a special header
    const authHeader = req.headers['x-vercel-cron'] || req.headers.authorization;
    
    // For Vercel Cron, x-vercel-cron header is present
    // For external cron, check Authorization Bearer token
    if (req.headers['x-vercel-cron']) {
        // Vercel Cron - authenticated by header
    } else if (authHeader === `Bearer ${CRON_SECRET}`) {
        // External cron - authenticated by token
    } else {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const result = await autoCloseStaleSessions();
        res.json({ 
            success: true, 
            message: 'Auto-close completed',
            result 
        });
    } catch (error) {
        console.error('Cron auto-close error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});
```

#### 3. Deploy
```bash
cd rfid-backend-deploy
vercel --prod
```

Vercel automatically handles the cron scheduling.

---

## 🎯 Recommendation for Testing Phase

### Use EasyCron (Free) First

**Why?**
- You're in testing phase with 3 classes/day
- No need to pay $20/month yet
- Can switch to Vercel Cron later when you go production

**When to Upgrade?**
- When you have 10+ simultaneous classes
- When you need better monitoring
- When you want all infrastructure in one place

---

## 📊 Auto-Close Logic

The `autoCloseStaleSessions()` function should close sessions that are:
- Still "ACTIVE" status
- Started more than 2-4 hours ago (configurable)
- No recent attendance scans

**File**: Check `rfid-backend-deploy/src/services/sessionService.js`

Look for or add this function:

```javascript
export async function autoCloseStaleSessions() {
    const staleThresholdHours = 3; // Close sessions older than 3 hours
    const staleTime = new Date(Date.now() - staleThresholdHours * 60 * 60 * 1000);
    
    const staleSessions = await prisma.classSession.findMany({
        where: {
            status: 'ACTIVE',
            startTime: {
                lt: staleTime
            }
        }
    });
    
    const closed = [];
    for (const session of staleSessions) {
        await prisma.classSession.update({
            where: { id: session.id },
            data: { 
                status: 'CLOSED',
                endTime: new Date()
            }
        });
        closed.push(session.id);
    }
    
    return { 
        closedCount: closed.length, 
        closedSessions: closed 
    };
}
```

---

## ✅ Quick Start (5 Minutes)

1. **Add cron endpoint** (copy code above)
2. **Generate secret**: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. **Add to .env**: `CRON_SECRET=<your-generated-secret>`
4. **Deploy to Vercel**: `vercel --prod`
5. **Test endpoint**:
   ```bash
   curl -X POST https://your-backend.vercel.app/api/cron/auto-close-sessions \
     -H "Authorization: Bearer your-secret"
   ```
6. **Sign up for EasyCron**: https://www.easycron.com/
7. **Create cron job** with your URL and secret

**Done!** Sessions will auto-close every 30 minutes.

---

## 🔧 Troubleshooting

### EasyCron says "Failed"
- Check your Vercel backend is deployed and accessible
- Test the endpoint manually with curl first
- Verify the Authorization header matches your CRON_SECRET

### Sessions not closing automatically
- Check EasyCron dashboard for execution logs
- Verify `autoCloseStaleSessions()` function exists in sessionService.js
- Check backend logs in Vercel dashboard

### "Unauthorized" errors
- Double-check CRON_SECRET in .env matches EasyCron header
- Make sure you're using `Bearer your-secret` format
- Verify .env file is deployed to Vercel (check Vercel dashboard > Settings > Environment Variables)

---

## 💡 Pro Tip

For testing, you can manually trigger the cron:

```bash
# Windows PowerShell
Invoke-WebRequest -Uri "https://your-backend.vercel.app/api/cron/auto-close-sessions" `
  -Method POST `
  -Headers @{"Authorization"="Bearer your-secret"}

# Or use Postman/Thunder Client
POST https://your-backend.vercel.app/api/cron/auto-close-sessions
Header: Authorization: Bearer your-secret
```

This helps verify everything works before relying on EasyCron schedule.
