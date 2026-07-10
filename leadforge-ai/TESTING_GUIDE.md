# Complete Testing Guide - LeadForge AI

## 🧪 Full Application Test

Follow this guide to test every feature from start to finish.

---

## Prerequisites

### 1. Start Both Servers

**Terminal 1 - Backend:**
```bash
cd "c:\Protected File\Real Project\leadforge-ai\leadforge-ai\backend"
npm run dev
```
✅ Should see: "LeadForge backend listening on http://localhost:1100"

**Terminal 2 - Frontend:**
```bash
cd "c:\Protected File\Real Project\leadforge-ai\leadforge-ai\frontend"
npm run dev
```
✅ Should see: "ready - started server on 0.0.0.0:1101"

### 2. Open Application
Navigate to: **http://localhost:1101**

✅ Should see: Professional dashboard with LeadForge AI logo in sidebar

---

## Test 1: Navigation & UI

### Check Sidebar
- [ ] Logo appears at top (LeadForge AI logo image)
- [ ] All navigation items visible:
  - Main: Dashboard, Leads, Discover, Agents
  - Engagement: Outreach, Conversations, Analytics
  - Automation: Projects, Integrations, Team
- [ ] Active page is highlighted in blue
- [ ] User avatar shows at bottom

### Check Topbar
- [ ] Search bar present
- [ ] Theme toggle button (moon/sun icon)
- [ ] Notifications bell icon
- [ ] Menu hamburger icon

### Test Theme Toggle
- [ ] Click moon icon
- [ ] Background turns dark
- [ ] All text remains readable
- [ ] Click sun icon
- [ ] Background turns light

✅ **Expected**: Smooth theme transition, all elements visible in both modes

---

## Test 2: Dashboard Overview

### Navigate to Dashboard
Click "Dashboard" in sidebar

### Check Stats Cards
- [ ] 4 stat cards displayed
- [ ] Total Leads count
- [ ] Active Conversations count
- [ ] Outreach Sent count
- [ ] Generated Sites count

### Check Charts
- [ ] Lead funnel chart (bar chart)
- [ ] Conversion rate chart (line chart)
- [ ] Status distribution (pie chart)
- [ ] Activity timeline

✅ **Expected**: Clean dashboard with stats and visualizations

---

## Test 3: Create a Lead

### Navigate to Leads
Click "Leads" in sidebar

### Add New Lead
1. Click "Add Lead" button (top right)
2. Fill in form:
   - Name: `John Doe`
   - Email: `john.doe@testcorp.com`
   - Company: `Test Corp`
   - Source: `Manual Testing`
3. Click "Add Lead"

### Verify
- [ ] Form closes
- [ ] Toast notification: "Lead created successfully" (or similar)
- [ ] New lead appears in table
- [ ] Status badge shows "NEW"

✅ **Expected**: Lead created and visible in list

---

## Test 4: Lead Detail & Pipeline

### Open Lead Detail
Click on "John Doe" in the leads table

### Check Pipeline Progress
- [ ] 5-step pipeline visible at top
- [ ] Step 1 (New Lead) is filled/active
- [ ] Steps 2-5 are empty/inactive
- [ ] Pipeline is visually clean

### Check Tabs
- [ ] Three tabs: Conversation, Requirements, Projects
- [ ] Conversation tab is active
- [ ] Empty state message shown
- [ ] "Draft Outreach Email" button visible

✅ **Expected**: Professional lead detail page with pipeline

---

## Test 5: Outreach Agent (Agent 1)

### Open Agents Page in New Tab
Right-click "Agents" in sidebar → Open in new tab

### Watch Real-Time Activity
Position windows side-by-side:
- Left: Lead detail page
- Right: Agents page

### Draft Outreach
1. On lead detail page, click "Draft Outreach Email"
2. Immediately switch to Agents page

### Verify Real-Time Updates
- [ ] Outreach Agent status changes to "Working" (orange)
- [ ] Activity feed shows "drafting email for John Doe"
- [ ] Status updates within 3-5 seconds
- [ ] Status changes to "Success" (green)
- [ ] Activity feed shows "completed"

### Check Email Draft
Switch back to lead detail page
- [ ] Email message appears in conversation
- [ ] Subject line visible
- [ ] Email body visible
- [ ] Pipeline shows steps 1-2 filled
- [ ] "Pending Approval" badge visible

✅ **Expected**: Email drafted, visible in conversation, agents page showed live updates

---

## Test 6: Approve Outreach

### Navigate to Outreach Queue
Click "Outreach" in sidebar

### Check Pending Email
- [ ] Draft email card displayed
- [ ] Lead info shown (John Doe, Test Corp)
- [ ] Subject line displayed
- [ ] Email body displayed
- [ ] "Pending Approval" badge visible
- [ ] Two buttons: "Approve & Send" and "Reject Draft"

### Approve Email
1. Click "Approve & Send"
2. Confirm in dialog

### Verify
- [ ] Button shows "Sending..." with spinner
- [ ] Toast notification: "Email sent successfully"
- [ ] Email disappears from queue
- [ ] "All clear!" message shown

### Check Lead Status
Go back to Leads list
- [ ] John Doe's status changed to "OUTREACH_SENT"

✅ **Expected**: Email approved and sent, status updated

---

## Test 7: Chat Agent (Agent 2)

### Return to Lead Detail
Click on John Doe in leads list

### Simulate Lead Reply
1. Scroll to "Simulate Lead Reply" box
2. Type: `Thanks for reaching out! I'm interested in learning more about your services. What's the pricing?`
3. Click "Send Reply"

### Watch Agents Page
Switch to Agents tab
- [ ] Chat Agent status changes to "Working"
- [ ] Activity feed updates
- [ ] Status changes to "Success"

### Check Conversation
Back on lead detail page
- [ ] Lead's message appears (right side, gray bubble)
- [ ] AI response appears (left side, blue bubble)
- [ ] Response is contextual and relevant
- [ ] Pipeline shows steps 1-3 filled
- [ ] "Extract Requirements" button appears

✅ **Expected**: AI responds naturally, conversation flows

---

## Test 8: Requirements Agent (Agent 3)

### Extract Requirements
On lead detail page, click "Extract Requirements"

### Watch Real-Time
- [ ] Button shows spinner: "Extracting..."
- [ ] Check Agents page - Requirements Agent working
- [ ] Activity feed updates
- [ ] Status completes in 5-8 seconds

### View Requirements
1. Switch to "Requirements" tab
2. Check content:
   - [ ] JSON structure visible
   - [ ] Brand information extracted
   - [ ] Features listed
   - [ ] Colors defined
   - [ ] Project status badge visible

### Verify Project Created
- [ ] Pipeline shows steps 1-4 filled
- [ ] Status badge shows "READY_TO_BUILD"

✅ **Expected**: Requirements extracted and displayed as JSON

---

## Test 9: Developer Agent (Agent 4)

### Build & Deploy
1. Switch to "Projects" tab
2. Click "Build & Deploy" button

### Watch Build Process
- [ ] Status changes to "BUILDING"
- [ ] Orange warning banner appears
- [ ] Spinner visible
- [ ] Page auto-refreshes every 3 seconds

### Monitor Agents Page
- [ ] Developer Agent status: "Working"
- [ ] Activity feed: "building site"
- [ ] Real-time updates continue

### Wait for Completion (10-30 seconds)
Watch the lead detail page auto-refresh

### Verify Deployment
- [ ] Status changes to "DEPLOYED"
- [ ] Green success banner appears: "🎉 Site deployed successfully!"
- [ ] Live URL displayed (vercel.app link)
- [ ] URL is clickable
- [ ] Build log shown below
- [ ] Pipeline shows ALL 5 steps filled!

### Test Deployed Site
Click the Vercel URL
- [ ] New tab opens
- [ ] Website loads
- [ ] Site reflects requirements (brand, colors, features)

✅ **Expected**: Site built, deployed to Vercel, fully functional

---

## Test 10: Complete Workflow Review

### Check Agents Page
Go to Agents page
- [ ] All 4 agents show recent activity
- [ ] Activity feed shows complete workflow
- [ ] Statistics updated:
  - Outreach: 1 sent
  - Chat: 1 conversation
  - Requirements: 1 extracted
  - Developer: 1 deployed

### Check Projects Page
Click "Projects" in sidebar
- [ ] Generated website card visible
- [ ] Deploy status: DEPLOYED
- [ ] URL shown
- [ ] Lead name displayed

### Check Analytics
Click "Analytics" in sidebar
- [ ] Charts updated with new data
- [ ] Lead funnel shows progression
- [ ] Conversion tracked

✅ **Expected**: Complete pipeline visible across all pages

---

## Test 11: Discovery (Apollo Integration)

### Navigate to Discover
Click "Discover" in sidebar

### Test Apollo Search
1. Fill in search criteria:
   - Industry: `Technology`
   - Company size: `50-200`
   - Location: `San Francisco`
2. Click "Search Leads"

### Verify
- [ ] Loading state shown
- [ ] Results appear (if Apollo key valid)
- [ ] Leads show company info
- [ ] "Add to CRM" buttons visible

### Add Lead from Discovery
- [ ] Click "Add to CRM" on a result
- [ ] Toast notification
- [ ] Lead added to main list

✅ **Expected**: Apollo search works, leads can be imported

---

## Test 12: Integrations

### Navigate to Integrations
Click "Integrations" in sidebar

### Check Integration Cards
- [ ] Apollo.io card shows "Connected" (green badge)
- [ ] API key (partially masked)
- [ ] Hunter.io card (needs setup)
- [ ] Clearbit card (needs setup)

### Test Connection Status
- [ ] Green badge for configured integrations
- [ ] Gray badge for pending integrations

✅ **Expected**: Integration status visible and accurate

---

## Test 13: Team Management

### Navigate to Team
Click "Team" in sidebar

### Check Team Page
- [ ] Team stats displayed
- [ ] "Invite Team Member" button
- [ ] Role types listed:
  - Admin
  - Manager
  - Member
  - Viewer
- [ ] Permissions matrix visible

### Test Invite Modal
1. Click "Invite Team Member"
2. Check form:
   - [ ] Email input
   - [ ] Role selector
   - [ ] Message textarea
   - [ ] Send/Cancel buttons

✅ **Expected**: Team management UI complete (backend pending)

---

## Test 14: Toast Notifications

### Test Different Toast Types
Throughout testing, verify:
- [ ] Success toasts are green
- [ ] Error toasts are red
- [ ] Toasts auto-dismiss after 5 seconds
- [ ] Multiple toasts stack properly
- [ ] Toasts slide in from right
- [ ] Icons match toast type (✓ for success, ✕ for error)

✅ **Expected**: Professional toast system, no alerts

---

## Test 15: Search & Filters

### Return to Leads Page
Click "Leads" in sidebar

### Test Search
1. Type in search box: `John`
2. Verify:
   - [ ] Results filter immediately
   - [ ] Only matching leads shown
   - [ ] Count updates at bottom

### Test Status Filter
1. Select "OUTREACH_SENT" from dropdown
2. Verify:
   - [ ] Only sent leads shown
   - [ ] Search still works with filter
   - [ ] "Showing X of Y leads" updates

### Clear Filters
- [ ] Clear search box
- [ ] Select "All Statuses"
- [ ] All leads visible again

✅ **Expected**: Fast, responsive filtering

---

## Test 16: Conversations Page

### Navigate to Conversations
Click "Conversations" in sidebar

### Check List
- [ ] All conversations listed
- [ ] John Doe conversation visible
- [ ] Message preview shown
- [ ] Timestamp displayed
- [ ] Unread badge (if applicable)

✅ **Expected**: Conversation list with details

---

## Test 17: Mobile Responsiveness

### Test on Smaller Window
1. Resize browser to ~600px width
2. Check:
   - [ ] Sidebar collapses
   - [ ] Hamburger menu appears
   - [ ] Content remains readable
   - [ ] Tables scroll horizontally
   - [ ] Forms stack vertically

### Test Sidebar Toggle
- [ ] Click hamburger
- [ ] Sidebar slides in
- [ ] Click outside
- [ ] Sidebar closes

✅ **Expected**: Responsive on all screen sizes

---

## Test 18: Error Handling

### Test with Backend Offline
1. Stop backend server (Ctrl+C in terminal 1)
2. Try to load Leads page
3. Verify:
   - [ ] Error message shown
   - [ ] UI doesn't crash
   - [ ] Helpful error text

### Restart Backend
1. Restart: `npm run dev`
2. Refresh page
3. Verify:
   - [ ] Data loads successfully
   - [ ] No residual errors

✅ **Expected**: Graceful error handling

---

## Test 19: Performance

### Check Load Times
- [ ] Initial page load < 1 second
- [ ] Navigation between pages instant
- [ ] API calls respond quickly
- [ ] No lag when typing
- [ ] Smooth animations

### Check Real-Time Updates
- [ ] Agents page refreshes every 3 seconds
- [ ] No flickering or jumping
- [ ] CPU usage reasonable
- [ ] Memory stable over time

✅ **Expected**: Fast, smooth performance

---

## Test 20: Final Verification

### Complete Checklist
- [ ] Logo displays correctly everywhere
- [ ] All 11 pages accessible
- [ ] All 4 agents working
- [ ] Real-time updates functioning
- [ ] Toast notifications working
- [ ] Theme toggle works
- [ ] Search and filters work
- [ ] Complete workflow tested
- [ ] No console errors
- [ ] Professional appearance throughout

### Create Second Test Lead
Repeat tests 3-9 with different data to verify consistency

### Multiple Leads Test
- [ ] Create 3-5 more leads
- [ ] Check dashboard updates
- [ ] Verify analytics charts
- [ ] Test sorting and filtering

✅ **Expected**: Everything works consistently

---

## 🐛 Common Issues & Solutions

### Backend won't start
**Error**: `DATABASE_URL is not defined`
**Solution**: Check backend/.env file, ensure DATABASE_URL is set

### Frontend can't connect
**Error**: `Failed to load leads`
**Solution**: Verify backend is running on port 1100, check NEXT_PUBLIC_API_URL

### OpenAI errors
**Error**: `OpenAI API error`
**Solution**: Verify OPENAI_API_KEY is valid and has credits

### No activities showing
**Issue**: Activity feed empty
**Solution**: Trigger an agent action, wait 3 seconds for refresh

### Build fails
**Error**: Vercel deployment fails
**Solution**: Check VERCEL_TOKEN, verify Vercel account status

---

## 📊 Success Criteria

All tests passing means:
- ✅ Complete UI/UX working
- ✅ All 4 agents functional
- ✅ Real-time updates working
- ✅ Full pipeline operational
- ✅ Professional appearance
- ✅ No critical bugs
- ✅ Ready for production

---

## 📝 Test Report Template

After completing all tests, fill out:

```
Date: ______________
Tester: ______________

✅ Passed: ___ / 20 tests
⚠️ Issues Found: ___
🐛 Bugs: ___

Critical Issues:
- 

Minor Issues:
-

Notes:
-

Overall Assessment: ________________
Ready for Production: YES / NO
```

---

## 🎯 Next Steps After Testing

If all tests pass:
1. ✅ Application is production-ready
2. Consider deployment to production
3. Set up monitoring and logging
4. Configure production environment variables
5. Set up backups
6. Share with stakeholders

If issues found:
1. Document all issues
2. Prioritize by severity
3. Fix critical bugs first
4. Re-test after fixes
5. Repeat until all tests pass

---

**Happy Testing! 🚀**

*This guide covers 100% of application features*
*Estimated completion time: 30-45 minutes for full test suite*
