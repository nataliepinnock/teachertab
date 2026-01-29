# Fix for npm Login Issues

## Problem
npm access tokens keep expiring, requiring constant re-login.

## Solution: Use a Persistent Authentication Token

### Step 1: Generate an npm Token
1. Go to https://www.npmjs.com/settings/[your-username]/tokens
2. Click "Generate New Token"
3. Choose token type:
   - **Automation** (recommended) - Never expires, for CI/CD
   - **Publish** - For publishing packages
   - **Read-only** - For installing packages only
4. Copy the token (you'll only see it once!)

### Step 2: Add Token to .npmrc

**Option A: Project-level (recommended)**
Create a file `.npmrc` in your project root (`C:\Users\natal\Documents\teachertab\.npmrc`):
```
//registry.npmjs.org/:_authToken=YOUR_TOKEN_HERE
```

**Option B: User-level**
Add to your global npm config:
```bash
npm config set //registry.npmjs.org/:_authToken YOUR_TOKEN_HERE
```

### Step 3: Verify
```bash
npm whoami
```

## Alternative: Use npm login with longer session
```bash
npm login --auth-type=legacy
```

## Fix Workspace Protocol Error
The error `Unsupported URL Type "workspace:"` suggests a workspace configuration issue. Check your `package.json` for workspace references and ensure all dependencies use proper registry URLs.

