# Security Policy

## Supported Versions

Currently, only the latest `master` branch is supported with security updates. 

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Abroad Compass very seriously. If you discover a security vulnerability within Abroad Compass, please do not disclose it publicly.

Instead, please send an e-mail to our core maintainer team. We will review the vulnerability and respond as quickly as possible (usually within 48 hours). 

We will handle the reporting and resolution of the vulnerability in a confidential manner.

## Best Practices

- Always ensure you are pulling the latest environment templates.
- **Never** commit your `.env` file or expose your `SUPABASE_SERVICE_ROLE_KEY`.
- If you believe a key was leaked, immediately revoke it in your Supabase or AI Provider dashboard.
