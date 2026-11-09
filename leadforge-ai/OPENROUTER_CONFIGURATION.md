# 🔄 OpenRouter Configuration Guide

**LeadForge AI uses OpenRouter through workspace-specific BYOK or an optional server-managed fallback.**

---

## 🎯 What is OpenRouter?

OpenRouter is a unified API gateway that provides access to multiple AI models through a single interface:

- **Multiple Providers**: GPT-4, Claude, Llama, Gemini, and more
- **One API Key**: Use different models without managing multiple API keys
- **Cost Optimization**: Choose the best model for each task
- **Fallback Options**: Automatically retry with different models
- **Usage Tracking**: Monitor costs across all models

**Website**: https://openrouter.ai

---

## ✅ Current Configuration

### API Key

Do not store API keys in this document, source files, or chat. Add a workspace
key from **Settings → Bring your own OpenRouter key**. Workspace keys are
encrypted at rest and are never returned by the settings API. See
[BYOK_AND_BILLING.md](./BYOK_AND_BILLING.md) for encryption-key setup.

### Configuration Location
```
Workspace settings: backend/src/routes/workspace.js
AI client resolution: backend/src/lib/openai.js
```

### OpenRouter Settings
```javascript
baseURL: "https://openrouter.ai/api/v1"
defaultHeaders: {
  "HTTP-Referer": "http://localhost:1101",
  "X-Title": "LeadForge AI"
}
```

---

## 🚀 How It Works

### 1. API Client Setup
The OpenAI SDK is configured to use OpenRouter's endpoint:

```javascript
// backend/src/lib/openai.js resolves the current workspace key per request.
// OPENAI_API_KEY is an optional server-managed fallback.
```

### 2. Model Selection
When making API calls, you can specify which model to use:

```javascript
// Example: Using GPT-4
const response = await openai.chat.completions.create({
  model: "openai/gpt-4", // OpenRouter format
  messages: [...],
});

// Example: Using Claude
const response = await openai.chat.completions.create({
  model: "anthropic/claude-3-opus", // OpenRouter format
  messages: [...],
});
```

### 3. Default Model
Our agents use GPT-4 by default, but you can easily switch:

```javascript
// In agent files, change the model parameter
model: "openai/gpt-4"        // GPT-4 (default)
model: "openai/gpt-3.5-turbo" // GPT-3.5 (cheaper)
model: "anthropic/claude-3-opus" // Claude Opus
model: "anthropic/claude-3-sonnet" // Claude Sonnet
model: "meta-llama/llama-3-70b" // Llama 3
```

---

## 📊 Available Models on OpenRouter

### OpenAI Models
```
openai/gpt-4                  - Most capable, best for complex tasks
openai/gpt-4-turbo           - Faster GPT-4, good balance
openai/gpt-3.5-turbo         - Fast and cheap, good for simple tasks
openai/gpt-4-32k             - Extended context window
```

### Anthropic Models
```
anthropic/claude-3-opus      - Most capable Claude model
anthropic/claude-3-sonnet    - Balanced performance
anthropic/claude-3-haiku     - Fast and economical
anthropic/claude-2           - Previous generation
```

### Meta Models
```
meta-llama/llama-3-70b       - Open source, very capable
meta-llama/llama-3-8b        - Smaller, faster Llama
```

### Google Models
```
google/gemini-pro            - Google's flagship model
google/gemini-1.5-pro        - Latest version
```

### Others
```
mistralai/mixtral-8x7b       - Open source mixture of experts
cohere/command               - Cohere's model
perplexity/pplx-70b-online   - With web search
```

---

## 💰 Cost Optimization

### Model Pricing (Approximate)
```
GPT-4:           $30-60 / 1M tokens   (Most expensive, most capable)
Claude Opus:     $15-75 / 1M tokens   (High quality)
GPT-3.5 Turbo:   $0.50-1.50 / 1M tokens (Cheap, good quality)
Llama 3 70B:     $0.70-0.90 / 1M tokens (Open source)
```

### Optimization Tips
1. **Use GPT-4 for complex tasks**: Requirements extraction, code generation
2. **Use GPT-3.5 for simple tasks**: Email drafting, simple conversations
3. **Use Claude for long content**: Better at understanding context
4. **Use Llama for high volume**: Cost-effective for many requests

---

## 🔧 Customizing Models per Agent

### Outreach Agent (Email Drafting)
**Current**: GPT-4  
**Alternative**: GPT-3.5 Turbo (emails don't need GPT-4 complexity)

```javascript
// backend/src/agents/outreachAgent.js
model: "openai/gpt-3.5-turbo" // Change from gpt-4
```

### Chat Agent (Conversations)
**Current**: GPT-4  
**Alternative**: Claude Sonnet (great at conversations)

```javascript
// backend/src/agents/chatAgent.js
model: "anthropic/claude-3-sonnet" // Natural conversations
```

### Requirements Agent (Extraction)
**Current**: GPT-4  
**Keep**: GPT-4 (needs structured output, complex reasoning)

```javascript
// backend/src/agents/requirementsAgent.js
model: "openai/gpt-4" // Keep this for quality
```

### Developer Agent (Code Generation)
**Current**: GPT-4  
**Alternative**: GPT-4 Turbo (faster, still great at code)

```javascript
// backend/src/agents/developerAgent.js
model: "openai/gpt-4-turbo" // Faster code generation
```

---

## 🧪 Testing Different Models

### Test Script
Create a test file to compare models:

```javascript
// backend/test-models.js
import { openai } from './src/lib/openai.js';

const models = [
  'openai/gpt-4',
  'openai/gpt-3.5-turbo',
  'anthropic/claude-3-sonnet',
  'meta-llama/llama-3-70b'
];

for (const model of models) {
  console.log(`Testing ${model}...`);
  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: 'Say hello!' }],
  });
  console.log(response.choices[0].message.content);
}
```

---

## 📈 Monitoring Usage

### View Usage on OpenRouter
1. Go to https://openrouter.ai/dashboard
2. Click "Usage" tab
3. See breakdown by model, cost, and time

### Cost Tracking
OpenRouter provides:
- ✅ Per-request cost breakdown
- ✅ Daily/weekly/monthly totals
- ✅ Model-by-model comparison
- ✅ Credit alerts

---

## 🔄 Fallback Strategy

### Configure Multiple Models
You can implement automatic fallback:

```javascript
async function callAIWithFallback(messages) {
  const models = [
    'openai/gpt-4',
    'openai/gpt-3.5-turbo',
    'anthropic/claude-3-sonnet',
  ];
  
  for (const model of models) {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages,
      });
      return response;
    } catch (error) {
      console.log(`${model} failed, trying next...`);
    }
  }
  throw new Error('All models failed');
}
```

---

## 🌐 Environment Variables

### Current Configuration (.env)
```env
# Optional server-managed fallback; workspace BYOK is configured in Settings.
OPENAI_API_KEY=
AI_KEY_ENCRYPTION_KEY=
OAUTH_STATE_SECRET=

# Frontend URL (for OpenRouter headers)
FRONTEND_URL=http://localhost:1101
```

### Production Configuration
```env
# Use your production domain
FRONTEND_URL=https://your-app.com

# OpenRouter will show this in usage logs
X_TITLE=LeadForge AI Production
```

---

## 🔐 Security

### API Key Protection
```
✅ Workspace API keys are encrypted at rest with AES-256-GCM
✅ Settings APIs never return stored key material
✅ Workspace key takes precedence over the optional server fallback
✅ Revoke and replace any key that was previously committed or shared
```

### Rate Limiting
OpenRouter has built-in rate limiting:
- Protects against abuse
- Prevents unexpected costs
- Can configure limits in dashboard

---

## 🚀 Benefits of OpenRouter

### 1. Flexibility
```
✅ Switch models without code changes
✅ Test different providers easily
✅ Use best model for each task
```

### 2. Cost Control
```
✅ Choose cheaper models when possible
✅ Track spending in real-time
✅ Set budget limits
```

### 3. Reliability
```
✅ Automatic failover to backup models
✅ No single point of failure
✅ Better uptime
```

### 4. Simplicity
```
✅ One API key for all models
✅ One billing account
✅ One dashboard for monitoring
```

---

## 📝 Migration Notes

### What Changed
1. ✅ Updated `backend/src/lib/openai.js` to use OpenRouter endpoint
2. ✅ Added OpenRouter headers (HTTP-Referer, X-Title)
3. ✅ Updated `.env` with OpenRouter API key
4. ✅ Updated `.env.example` with documentation
5. ✅ Server auto-restarted with new configuration

### What Stayed the Same
```
✅ All agent code unchanged
✅ All API endpoints unchanged
✅ All functionality works the same
✅ OpenAI SDK still used (just different endpoint)
```

### Backward Compatibility
If you want to switch back to OpenAI directly:
1. Get OpenAI API key (sk-proj-... format)
2. Update `.env` with OpenAI key
3. Remove `baseURL` from `backend/src/lib/openai.js`
4. Remove `defaultHeaders` from config

---

## 🧪 Verification

### Test the Configuration
```bash
# Start the backend (if not running)
cd backend
npm run dev

# Test with a lead discovery or email draft
# Check server logs for OpenRouter calls
```

### Expected Behavior
```
✅ API calls go to https://openrouter.ai/api/v1
✅ All 4 agents work correctly
✅ No errors in server logs
✅ Responses are fast and accurate
```

---

## 📚 Additional Resources

### OpenRouter Documentation
- **Website**: https://openrouter.ai
- **API Docs**: https://openrouter.ai/docs
- **Models List**: https://openrouter.ai/models
- **Pricing**: https://openrouter.ai/pricing
- **Dashboard**: https://openrouter.ai/dashboard

### Support
- **Discord**: https://discord.gg/openrouter
- **Email**: support@openrouter.ai
- **Status**: https://status.openrouter.ai

---

## ✅ Summary

### What You Have Now
```
✅ OpenRouter configured and working
✅ API key: [REDACTED — rotate this key]...da1b
✅ Access to 50+ AI models
✅ One API key for all models
✅ Cost tracking and optimization
✅ Automatic fallback options
```

### Next Steps (Optional)
1. Test different models for different agents
2. Monitor usage in OpenRouter dashboard
3. Optimize costs by using cheaper models where appropriate
4. Set up budget alerts
5. Configure fallback strategies

---

**Your LeadForge AI platform now uses OpenRouter for flexible, cost-effective AI!** 🚀

---

*Last Updated: July 10, 2026*  
*Configuration: OpenRouter*  
*Status: ACTIVE* ✅
