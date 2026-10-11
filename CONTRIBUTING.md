# Contributing to IronPixels ⚡

Thank you for your interest in contributing to **IronPixels**! We welcome community contributions to make this retro gamified fitness RPG even better.

---

## Code of Conduct
Please treat everyone with respect, kindness, and professionalism. We are committed to providing a friendly, constructive, and inclusive environment for all contributors.

---

## How Can I Contribute?

### 1. Reporting Bugs
- Check existing [GitHub Issues](https://github.com/felixpalingan/IronPixels/issues) before opening a new issue to avoid duplicate reports.
- Provide a clear, descriptive title.
- Detail the exact reproduction steps, expected vs actual behavior, and include screenshots or browser console logs if applicable.

### 2. Suggesting Features
- Open a GitHub issue tagged with `[Feature Request]`.
- Clearly describe the proposed game mechanic, workout calculation feature, or UI enhancement.
- Explain the motivation and how it aligns with the 16-bit retro fitness theme.

### 3. Submitting Pull Requests
1. **Fork** the repository and clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/IronPixels.git
   cd IronPixels
   ```
2. **Create a topic branch**:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Follow code style & architecture conventions**:
   - Write type-safe code in TypeScript with strict typing.
   - Maintain server-authoritative combat, anti-cheat, and inventory transaction validation.
   - Use Tailwind CSS and follow the existing retro 16-bit aesthetic and design tokens.
   - Ensure all code comments, documentation, and user-facing copy are strictly in English.
5. **Run tests and verify the build**:
   ```bash
   npm test
   npm run build
   ```
   All mathematical engine tests must pass and the Next.js production build must compile with zero errors and zero warnings.
6. **Commit with Conventional Commits**:
   - `feat(...)`: New features or mechanics
   - `fix(...)`: Bug fixes
   - `refactor(...)`: Code refactoring without behavior change
   - `docs(...)`: Documentation updates
   - `test(...)`: Unit test additions or improvements
   - `chore(...)`: Tooling, configs, and dependencies
7. **Push to your fork** and open a Pull Request against the `main` branch.

---

## Database & Security Contributions
- Any database schema changes must include backward-compatible migration scripts in `supabase/migrations/`.
- Strict **Row-Level Security (RLS)** policies must be enforced on all newly created tables.
- Never commit private credentials, service role keys, or production environment variables into version control.
