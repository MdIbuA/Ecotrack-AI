# Security Policy

## Supported Versions
| Version | Supported |
|---------|----------|
| 1.0.x   | ✅       |

## Reporting a Vulnerability
Please report security vulnerabilities by emailing security@ecotrack.ai.
Do NOT open public GitHub issues for security vulnerabilities.

## Security Measures
- All API endpoints are protected by Firebase JWT authentication
- Helmet.js provides HTTP security headers including CSP
- Rate limiting prevents brute-force and DDoS attacks
- Input validation via express-validator on all endpoints
- NoSQL injection prevention via input sanitization
- CORS restricted to authorized frontend domains
- Credentials and secrets excluded from version control via .gitignore
