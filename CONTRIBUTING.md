# Contributing to LeadForge AI

First off, thank you for considering contributing to LeadForge AI! 🎉

It's people like you that make LeadForge AI such a great tool.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Guidelines](#coding-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

---

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- **Be respectful** and inclusive
- **Be collaborative** and constructive
- **Be patient** with new contributors
- **Be open** to feedback and criticism
- **Focus on what is best** for the community

---

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Git installed
- Basic knowledge of JavaScript/TypeScript
- Familiarity with React and Next.js
- Understanding of REST APIs

### Quick Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/leadforge-ai.git
   cd leadforge-ai
   ```
3. **Follow the setup guide** in [QUICK_START.md](leadforge-ai/QUICK_START.md)
4. **Create a branch** for your changes

---

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues. When you create a bug report, include as many details as possible:

**Use this template:**
```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g. Windows, Mac, Linux]
 - Browser: [e.g. Chrome, Firefox]
 - Node version: [e.g. 18.0.0]
 - Version: [e.g. 1.0.0]

**Additional context**
Any other information about the problem.
```

### 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title** and description
- **Use case**: Explain why this would be useful
- **Possible implementation**: If you have ideas
- **Examples**: From other projects (if applicable)

### 📝 Improving Documentation

Documentation improvements are always welcome! This includes:

- Fixing typos or grammatical errors
- Adding examples or clarifications
- Translating documentation
- Adding missing documentation

### 💻 Contributing Code

We love code contributions! Here are some areas where you can help:

#### Good First Issues
Look for issues labeled `good first issue` - these are great for newcomers!

#### Priority Areas
- **Bug fixes** - Always appreciated
- **Performance improvements** - Make it faster
- **Test coverage** - Help us test better
- **UI/UX improvements** - Make it beautiful
- **Documentation** - Help others understand
- **New integrations** - Add CRM, email, or lead sources

---

## Development Setup

### 1. Install Dependencies

```bash
# Backend
cd leadforge-ai/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` files and fill in your values:

```bash
# Backend
cp leadforge-ai/backend/.env.example leadforge-ai/backend/.env

# Frontend
cp leadforge-ai/frontend/.env.local.example leadforge-ai/frontend/.env.local
```

### 3. Run Database Migrations

```bash
cd leadforge-ai/backend
npm run prisma:migrate
```

### 4. Start Development Servers

```bash
# Backend (Terminal 1)
cd leadforge-ai/backend
npm run dev

# Frontend (Terminal 2)
cd leadforge-ai/frontend
npm run dev
```

### 5. Verify Setup

- Frontend: http://localhost:1101
- Backend: http://localhost:1100
- API Docs: http://localhost:1100/api-docs

---

## Coding Guidelines

### Code Style

We follow industry-standard practices:

#### JavaScript/TypeScript
- Use **ES6+** syntax
- Use **camelCase** for variables and functions
- Use **PascalCase** for components and classes
- Use **UPPER_CASE** for constants
- **2 spaces** for indentation
- **Semicolons** are optional but be consistent

#### React/Next.js
- **Functional components** preferred over class components
- Use **hooks** for state management
- Keep components **small and focused**
- **Props** should be well-typed (if using TypeScript)

#### Backend
- Use **async/await** instead of callbacks
- **Error handling** in try-catch blocks
- **Input validation** for all endpoints
- **Descriptive variable names**

### File Structure

```
leadforge-ai/
├── backend/
│   ├── src/
│   │   ├── agents/      # AI agent logic
│   │   ├── routes/      # API endpoints
│   │   └── lib/         # Utilities
│   └── prisma/          # Database schema
└── frontend/
    ├── pages/           # Next.js pages
    ├── components/      # React components
    └── lib/             # Frontend utilities
```

### Naming Conventions

**Files:**
- Components: `ComponentName.js`
- Pages: `page-name.js`
- Utilities: `utilityName.js`
- Routes: `routeName.js`

**Functions:**
```javascript
// Good
async function fetchUserData() { }
const calculateTotal = (items) => { }

// Avoid
async function FetchData() { }
const calc = (x) => { }
```

### Comments

- Write **clear, concise comments**
- Explain **why**, not **what**
- Use **JSDoc** for functions
- Remove **commented-out code**

```javascript
/**
 * Drafts a personalized outreach email for a lead
 * @param {Object} lead - The lead object with name, email, company
 * @returns {Promise<{subject: string, body: string}>} Email content
 */
async function draftOutreachEmail(lead) {
  // Implementation
}
```

---

## Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
# Good commit messages
git commit -m "feat(agents): add email scheduling feature"
git commit -m "fix(api): resolve CORS issue on /leads endpoint"
git commit -m "docs: update API documentation with new endpoints"
git commit -m "refactor(chat): improve conversation history loading"

# Avoid
git commit -m "fixed stuff"
git commit -m "updates"
git commit -m "wip"
```

---

## Pull Request Process

### 1. Create a Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 2. Make Your Changes

- Write **clean, maintainable code**
- Follow the **coding guidelines**
- Add **tests** if applicable
- Update **documentation** if needed

### 3. Test Your Changes

```bash
# Run tests (if available)
npm test

# Test manually
# - Create a test lead
# - Draft outreach
# - Verify feature works
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat(scope): add amazing feature"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

1. Go to the original repository on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill in the PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have tested my changes
```

### 7. Wait for Review

- Maintainers will review your PR
- Address any feedback
- Make requested changes
- Be patient and respectful

### PR Requirements

Before your PR can be merged:

- ✅ All tests pass
- ✅ Code follows style guidelines
- ✅ Documentation updated
- ✅ No merge conflicts
- ✅ Approved by maintainer

---

## Testing

### Running Tests

```bash
# Backend tests
cd leadforge-ai/backend
npm test

# Frontend tests
cd leadforge-ai/frontend
npm test
```

### Writing Tests

Example test structure:

```javascript
describe('Lead API', () => {
  test('should create a new lead', async () => {
    const lead = {
      name: 'Test User',
      email: 'test@example.com',
      company: 'Test Corp'
    };
    
    const response = await api.createLead(lead);
    
    expect(response.status).toBe(201);
    expect(response.data.email).toBe(lead.email);
  });
});
```

---

## Project Structure

### Backend

```
backend/
├── src/
│   ├── agents/              # AI agent implementations
│   │   ├── outreachAgent.js
│   │   ├── chatAgent.js
│   │   ├── requirementsAgent.js
│   │   ├── developerAgent.js
│   │   └── integrations/    # External API integrations
│   ├── routes/              # Express route handlers
│   │   ├── leads.js
│   │   ├── outreach.js
│   │   ├── chat.js
│   │   ├── requirements.js
│   │   ├── build.js
│   │   ├── discovery.js
│   │   ├── activities.js
│   │   └── tracking.js
│   ├── lib/                 # Shared utilities
│   │   ├── prisma.js
│   │   ├── openai.js
│   │   ├── mailer.js
│   │   └── emailTracking.js
│   └── server.js            # Express app setup
├── prisma/
│   └── schema.prisma        # Database schema
└── openapi.yaml             # API documentation
```

### Frontend

```
frontend/
├── pages/                   # Next.js pages
│   ├── index.js            # Leads list
│   ├── dashboard.js        # Main dashboard
│   ├── agents.js           # Agent monitoring
│   ├── discover.js         # Lead discovery
│   ├── outreach.js         # Approval queue
│   └── leads/
│       └── [id].js         # Lead detail
├── components/              # React components
│   ├── Layout.js           # App layout
│   └── Toast.js            # Notifications
├── lib/
│   └── api.js              # API client
└── styles/
    └── globals.css         # Global styles
```

---

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussion
- **Pull Requests**: Code contributions

### Getting Help

If you need help:

1. Check the **documentation** first
2. Search **existing issues**
3. Ask in **GitHub Discussions**
4. Create a **new issue** if needed

### Recognition

Contributors will be:
- Listed in the project README
- Mentioned in release notes
- Credited in commit history

---

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards-compatible)
- **PATCH**: Bug fixes

### Creating a Release

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a git tag
4. Push to GitHub
5. Create GitHub Release

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

If you have questions about contributing, feel free to ask in:
- GitHub Discussions
- GitHub Issues (with the `question` label)

---

**Thank you for contributing to LeadForge AI!** 🎉

Your contributions help make this project better for everyone.

---

*Last updated: July 10, 2026*
