# Marvel Dataset — Verification & Extension Guide

## Current Status

- **Total entries:** ~70
- **Verified:** ~50 (marked `verified: true`)
- **Needs verification:** ~20 (marked `verified: false`)

## How to Verify an Entry

Each project has a `source` field. If it says `NEEDS VERIFICATION`, check:

1. **Release date** → Box Office Mojo, IMDb, or Wikipedia
2. **Runtime** → IMDb (most reliable for minutes)
3. **Seasons/Episodes** → IMDb, IGN Disney+ guide, or Wikipedia

Once confirmed, update the entry:

```javascript
verified: true,
source: 'IMDb confirms 2h 6m / 2008'
```
