# API Documentation Guide - LeadForge AI

## 🎯 Overview

LeadForge AI now includes complete OpenAPI/Swagger documentation for all API endpoints!

---

## 📍 Access API Documentation

### Interactive Swagger UI
**URL:** http://localhost:1100/api-docs

Open this URL in your browser to access the interactive API documentation where you can:
- View all endpoints
- See request/response schemas
- Test API calls directly from the browser
- Download OpenAPI spec

### API Info Endpoint
**URL:** http://localhost:1100/api

Returns basic API information and links to documentation.

### OpenAPI Spec File
**Location:** `backend/openapi.yaml`

This is the source file that powers the Swagger UI. You can:
- Import it into Postman
- Use it with API testing tools
- Generate client SDKs
- Share with frontend developers

---

## 🚀 Quick Start

### 1. Start the Backend
```bash
cd backend
npm run dev
```

### 2. Open Swagger UI
Navigate to: **http://localhost:1100/api-docs**

### 3. Explore Endpoints
The documentation is organized into 9 categories:
- **Health** - Health check
- **Leads** - Lead management
- **Outreach** - Email drafting and approval
- **Chat** - Conversation management
- **Requirements** - Requirements extraction
- **Build** - Website generation and deployment
- **Discovery** - Lead discovery via Apollo/Hunter/Clearbit
- **Activities** - Real-time agent activity tracking
- **Tracking** - Email tracking (opens and clicks)

---

## 📊 API Endpoints

### Health Check
```
GET  /health
```
Returns `{ "ok": true }` if API is running.

### Leads
```
GET    /leads                  - List all leads
POST   /leads                  - Create new lead
GET    /leads/{id}             - Get lead details
```

### Outreach
```
POST   /outreach/draft                     - Draft email with AI
GET    /outreach/pending                   - Get pending approvals
POST   /outreach/{messageId}/approve       - Approve and send email
POST   /outreach/{messageId}/reject        - Reject draft
```

### Chat
```
POST   /chat/{conversationId}/reply   - Add lead reply + get AI response
GET    /chat/{conversationId}         - Get conversation history
```

### Requirements
```
POST   /requirements/{conversationId}/extract     - Extract requirements
GET    /requirements/project/{projectId}          - Get requirements
```

### Build
```
POST   /build/{projectId}          - Build and deploy website
GET    /build/{projectId}/status   - Get build status
```

### Discovery
```
POST   /discovery/search    - Search for leads (Apollo/Hunter/Clearbit)
GET    /discovery/stats     - Get discovery statistics
```

### Activities
```
GET    /activities                         - Get recent activities
GET    /activities/stats                   - Get agent statistics
GET    /activities/agent/{name}/status     - Get agent status
```

### Tracking
```
GET    /track/open/{messageId}                - Track email open (pixel)
GET    /track/click/{messageId}/{linkId}      - Track link click
GET    /track/stats/{messageId}               - Get tracking stats
```

---

## 🧪 Testing with Swagger UI

### 1. View Endpoint Details
Click on any endpoint to expand and see:
- Description
- Parameters
- Request body schema
- Response codes and schemas
- Example responses

### 2. Try It Out
1. Click "Try it out" button
2. Fill in parameters (if required)
3. Fill in request body (if required)
4. Click "Execute"
5. See the response!

### Example: Create a Lead
1. Go to **Leads** section
2. Expand `POST /leads`
3. Click "Try it out"
4. Fill in request body:
```json
{
  "name": "Jane Smith",
  "email": "jane@techcorp.com",
  "company": "TechCorp",
  "source": "Website"
}
```
5. Click "Execute"
6. See the created lead in the response!

---

## 📥 Using with Postman

### Import OpenAPI Spec

1. Open Postman
2. Click "Import" button
3. Choose one of these options:

#### Option A: Import from URL
```
http://localhost:1100/api-docs/swagger.json
```

#### Option B: Import from File
1. Navigate to `backend/openapi.yaml`
2. Import the file
3. Postman will create a collection with all endpoints

### Benefits
- All endpoints pre-configured
- Request examples included
- Response schemas documented
- Easy to modify and test

---

## 🔧 Customizing the Documentation

### Update OpenAPI Spec
Edit `backend/openapi.yaml` to:
- Add new endpoints
- Update descriptions
- Modify schemas
- Add examples
- Add authentication

### Reload Changes
Changes are automatically reloaded when you save the file (thanks to `--watch` mode).

Just refresh the Swagger UI page to see updates!

---

## 🎯 Apollo OAuth Configuration

### Current Setup
The API now supports **both** authentication methods:

1. **API Key** (simpler)
   ```env
   APOLLO_API_KEY=cG8-4baGEHhn0FkdsUNXvQ
   ```

2. **OAuth** (more secure)
   ```env
   APOLLO_CLIENT_ID=5zFVG6g19t_wDlniS2qS_FyrFMCqfBXrYVY4FczY4KA
   APOLLO_CLIENT_SECRET=mLI-2pyJQi-OpZR7Otck0cMC4GC9OcEPV546-P5v0dM
   ```

### How It Works
The system automatically uses OAuth if `APOLLO_CLIENT_ID` and `APOLLO_CLIENT_SECRET` are set, otherwise falls back to API Key.

**Priority:** OAuth > API Key

### Configuration Location
**File:** `backend/.env`

Both sets of credentials are now configured in your `.env` file!

### Testing Apollo Integration

#### Via Swagger UI
1. Open http://localhost:1100/api-docs
2. Go to **Discovery** section
3. Expand `POST /discovery/search`
4. Click "Try it out"
5. Use default values or customize:
```json
{
  "personTitles": ["CEO", "CTO"],
  "organizationNumEmployeesRanges": "51,200",
  "personLocations": ["San Francisco, CA"],
  "page": 1,
  "perPage": 10
}
```
6. Click "Execute"
7. See discovered leads!

#### Via cURL
```bash
curl -X POST http://localhost:1100/discovery/search \
  -H "Content-Type: application/json" \
  -d '{
    "personTitles": ["CEO", "CTO"],
    "organizationNumEmployeesRanges": "51,200",
    "page": 1,
    "perPage": 10
  }'
```

---

## 📚 Documentation Sections

### Servers
Configured for both:
- Development: `http://localhost:1100`
- Production: `https://api.leadforge.ai` (when deployed)

### Security
Currently no authentication for local dev.
For production, add:
- JWT authentication
- API key authentication
- OAuth2 flow

### Schemas
All data models documented:
- `Lead`
- `LeadWithDetails`
- `Conversation`
- `Message`
- `Project`
- `Activity`
- `DiscoveredLead`

### Tags
Endpoints grouped by functionality:
- Health
- Leads
- Outreach
- Chat
- Requirements
- Build
- Discovery
- Activities
- Tracking

---

## 🎨 Swagger UI Features

### What You Can Do:
- ✅ View all endpoints and their details
- ✅ See request/response schemas
- ✅ Test endpoints directly in browser
- ✅ View examples
- ✅ Download OpenAPI spec (JSON/YAML)
- ✅ Copy cURL commands
- ✅ Share with team members

### Customizations:
- ✅ Top bar hidden (cleaner look)
- ✅ Custom page title: "LeadForge AI API Documentation"
- ✅ Professional styling

---

## 🔍 Example Workflows

### 1. Complete Lead Workflow
```
1. POST /leads
   Create a new lead

2. POST /outreach/draft
   AI drafts outreach email

3. POST /outreach/{messageId}/approve
   Approve and send email

4. POST /chat/{conversationId}/reply
   Add lead's reply, get AI response

5. POST /requirements/{conversationId}/extract
   Extract structured requirements

6. POST /build/{projectId}
   Build and deploy website

7. GET /build/{projectId}/status
   Check deployment status
```

### 2. Discovery Workflow
```
1. POST /discovery/search
   Search for leads via Apollo

2. POST /leads
   Add discovered lead to CRM

3. Continue with outreach workflow...
```

### 3. Monitoring Workflow
```
1. GET /activities
   See recent agent activities

2. GET /activities/stats
   View agent statistics

3. GET /activities/agent/{name}/status
   Check specific agent status
```

---

## 📖 Integration Examples

### JavaScript/Fetch
```javascript
// Create a lead
const response = await fetch('http://localhost:1100/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Acme Corp'
  })
});
const lead = await response.json();
```

### Python/Requests
```python
import requests

# Create a lead
response = requests.post(
    'http://localhost:1100/leads',
    json={
        'name': 'John Doe',
        'email': 'john@example.com',
        'company': 'Acme Corp'
    }
)
lead = response.json()
```

### cURL
```bash
# Create a lead
curl -X POST http://localhost:1100/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","company":"Acme Corp"}'
```

---

## 🚀 Production Deployment

### Update Base URL
Edit `openapi.yaml`:
```yaml
servers:
  - url: https://api.yourdomain.com
    description: Production server
```

### Add Authentication
Edit `openapi.yaml` to add security:
```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []
```

### Regenerate Documentation
Restart the server to reload changes.

---

## 📞 Quick Reference

**Swagger UI:** http://localhost:1100/api-docs  
**API Info:** http://localhost:1100/api  
**Health Check:** http://localhost:1100/health  
**OpenAPI Spec:** `backend/openapi.yaml`

**Apollo OAuth:**
- Client ID: `5zFVG6g19t_wDlniS2qS_FyrFMCqfBXrYVY4FczY4KA`
- Client Secret: `mLI-2pyJQi-OpZR7Otck0cMC4GC9OcEPV546-P5v0dM`
- Already configured in `.env`!

---

## ✅ Verification Checklist

- [x] OpenAPI spec created (`backend/openapi.yaml`)
- [x] Swagger UI integrated (`/api-docs` endpoint)
- [x] All 8 route groups documented
- [x] Request/response schemas defined
- [x] Example requests included
- [x] Apollo OAuth credentials added
- [x] API info endpoint added (`/api`)
- [x] Documentation accessible at http://localhost:1100/api-docs

---

**Your API is now fully documented and ready to use!** 🎉

Open http://localhost:1100/api-docs and explore!
