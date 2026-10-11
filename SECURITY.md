# Security Policy 🛡️

The maintainers take the security of **IronPixels** seriously. We appreciate your efforts to responsibly disclose any potential vulnerabilities you discover.

---

## Supported Versions

Only the latest code on the default branch is actively supported with security updates.

| Version | Supported          |
| :---    | :---               |
| `main`  | :white_check_mark: |
| `< 1.0` | :x:                |

---

## Reporting a Vulnerability

If you discover a security vulnerability in IronPixels, **please do NOT report it via public GitHub issues or public discussions**.

Instead, please report the vulnerability privately through:
1. **GitHub Security Advisory**: Open a private advisory on GitHub via the [Security Advisories tab](https://github.com/felixpalingan/IronPixels/security/advisories/new).
2. **Direct Contact**: Contact the maintainer directly via GitHub profile ([@felixpalingan](https://github.com/felixpalingan)).

### What to Include in Your Report
To help us triage and resolve the issue quickly, please provide:
- A clear description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- Any affected endpoints (e.g. `/api/combat/*`, `/api/shop/gacha`), database tables, or authentication tokens.
- Recommended fixes or mitigations, if known.

---

## Response Timeline
- **Initial Acknowledgment**: Within 48 hours of receipt.
- **Triage & Status Update**: Within 5 business days detailing validation results and target remediation timeline.
- **Resolution**: A coordinated security patch will be prepared and deployed before any public disclosure.

---

## Baseline Security Guardrails
- **PostgreSQL Row-Level Security (RLS)** is enabled on all production database tables.
- Server-authoritative logic governs all combat multipliers, gacha rolls, and level progressions to prevent client manipulation.
- Zero hardcoded production secrets, API keys, or service role credentials in version control.
