# Security Documentation - RepairFone

## SEC-014: Security Best Practices and Secret Management

This document outlines the security procedures, secret rotation guidelines, and best practices for the RepairFone application.

---

## Table of Contents

1. [Environment Variable Requirements](#environment-variable-requirements)
2. [JWT Secret Rotation Procedures](#jwt-secret-rotation-procedures)
3. [Database Credential Rotation Guidelines](#database-credential-rotation-guidelines)
4. [API Key Management Best Practices](#api-key-management-best-practices)
5. [Security Checklist](#security-checklist)

---

## Environment Variable Requirements

### Required Environment Variables

The following environment variables must be configured for the application to run securely:

#### Application Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Application environment | Yes | `production`, `development`, `test` |
| `PORT` | Server listening port | Yes | `3000` |
| `API_PREFIX` | API route prefix | Yes | `api/v1` |

#### Database Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DB_HOST` | Database server hostname | Yes | `localhost` or `db.example.com` |
| `DB_PORT` | Database server port | Yes | `5432` |
| `DB_USERNAME` | Database user | Yes | `repairfone_user` |
| `DB_PASSWORD` | Database password | Yes | (Strong password) |
| `DB_DATABASE` | Database name | Yes | `fastRepair_bd` |

#### JWT Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `JWT_SECRET` | Access token signing secret | Yes | (Min 32 characters) |
| `JWT_EXPIRATION` | Access token expiration | Yes | `15m` |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | Yes | (Min 32 characters) |
| `JWT_REFRESH_EXPIRATION` | Refresh token expiration | Yes | `7d` |

#### OTP Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `OTP_EXPIRATION_MINUTES` | OTP validity period | Yes | `5` |
| `OTP_MAX_ATTEMPTS` | Maximum OTP verification attempts | Yes | `3` |

#### Security Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `ALLOWED_ORIGINS` | CORS allowed origins | Yes | `https://app.repairfone.com` |
| `THROTTLE_TTL` | Rate limit time window (ms) | Yes | `60000` |
| `THROTTLE_LIMIT` | Max requests per window | Yes | `100` |

### Environment-Specific Requirements

#### Production Environment

- `NODE_ENV` MUST be set to `production`
- All secrets MUST be at least 32 characters with high entropy
- `ALLOWED_ORIGINS` MUST NOT include `localhost` or `*`
- Database credentials MUST use dedicated service accounts
- All connections MUST use TLS/SSL

#### Development Environment

- Use `.env.example` as a template
- Never commit `.env` files to version control
- Use different secrets than production

---

## JWT Secret Rotation Procedures

### Overview

JWT secrets should be rotated regularly to minimize the impact of potential secret compromise. This section outlines the procedures for safe secret rotation.

### Rotation Schedule

| Secret Type | Rotation Frequency | Grace Period |
|-------------|-------------------|--------------|
| `JWT_SECRET` | Every 90 days | 24 hours |
| `JWT_REFRESH_SECRET` | Every 90 days | 7 days |

### Pre-Rotation Checklist

- [ ] Schedule rotation during low-traffic period
- [ ] Notify team members of upcoming rotation
- [ ] Prepare new secrets in secure storage
- [ ] Test new secrets in staging environment
- [ ] Prepare rollback procedure

### Rotation Procedure

#### Step 1: Generate New Secrets

```bash
# Generate cryptographically secure secrets
# Option 1: Using OpenSSL
openssl rand -base64 48

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Option 3: Using Python
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

#### Step 2: Implement Dual-Secret Support (Recommended)

For zero-downtime rotation, implement support for multiple active secrets:

```typescript
// Example: Accept both old and new JWT secrets during transition
const verifyToken = (token: string) => {
  const secrets = [process.env.JWT_SECRET, process.env.JWT_SECRET_OLD];

  for (const secret of secrets.filter(Boolean)) {
    try {
      return jwt.verify(token, secret);
    } catch (e) {
      continue;
    }
  }
  throw new UnauthorizedException('Invalid token');
};
```

#### Step 3: Update Secrets

1. Add new secret as `JWT_SECRET_NEW` in environment
2. Update application to sign tokens with new secret
3. Keep old secret for verification during grace period
4. After grace period, remove old secret

#### Step 4: Post-Rotation Verification

- [ ] Verify new tokens are being issued correctly
- [ ] Monitor authentication error rates
- [ ] Confirm old tokens are still valid during grace period
- [ ] After grace period, verify old tokens are rejected

### Emergency Rotation (Security Incident)

In case of suspected secret compromise:

1. **Immediately** generate new secrets
2. Update all environments simultaneously
3. Force logout all users (invalidate all existing tokens)
4. Monitor for suspicious activity
5. Conduct security incident review

```bash
# Emergency commands
# 1. Generate emergency secrets
NEW_JWT_SECRET=$(openssl rand -base64 48)
NEW_REFRESH_SECRET=$(openssl rand -base64 48)

# 2. Update environment (example for cloud platforms)
# AWS: aws ssm put-parameter --name "/repairfone/jwt-secret" --value "$NEW_JWT_SECRET" --overwrite
# Heroku: heroku config:set JWT_SECRET="$NEW_JWT_SECRET"

# 3. Restart application
# This will invalidate all existing tokens
```

---

## Database Credential Rotation Guidelines

### Rotation Schedule

| Environment | Rotation Frequency | Method |
|-------------|-------------------|--------|
| Production | Every 60 days | Automated |
| Staging | Every 90 days | Semi-automated |
| Development | As needed | Manual |

### Pre-Rotation Requirements

- [ ] Database supports multiple concurrent users
- [ ] Application supports credential hot-reloading OR rolling restart
- [ ] Backup credentials stored securely
- [ ] Monitoring alerts configured

### Rotation Procedure

#### Step 1: Create New Database User

```sql
-- PostgreSQL example
-- 1. Create new user with same permissions
CREATE USER repairfone_user_new WITH PASSWORD 'new_secure_password';

-- 2. Grant same permissions as existing user
GRANT ALL PRIVILEGES ON DATABASE fastRepair_bd TO repairfone_user_new;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO repairfone_user_new;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO repairfone_user_new;

-- 3. Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO repairfone_user_new;
```

#### Step 2: Update Application Configuration

1. Update `DB_USERNAME` and `DB_PASSWORD` in environment
2. Perform rolling restart of application instances
3. Verify database connectivity

#### Step 3: Remove Old Credentials

```sql
-- After confirming all instances use new credentials (wait 24 hours)
-- 1. Revoke permissions from old user
REVOKE ALL PRIVILEGES ON DATABASE fastRepair_bd FROM repairfone_user_old;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM repairfone_user_old;

-- 2. Drop old user
DROP USER repairfone_user_old;
```

### Connection Pool Considerations

- Drain existing connections before rotation
- Configure connection pool to refresh on credential change
- Set appropriate `maxPoolSize` and `idleTimeoutMillis`

---

## API Key Management Best Practices

### Key Generation

#### Requirements

- Minimum 32 bytes (256 bits) of entropy
- Use cryptographically secure random number generator
- Include key prefix for identification (e.g., `rf_live_`, `rf_test_`)

```typescript
// Example key generation
import { randomBytes } from 'crypto';

function generateApiKey(prefix: string = 'rf'): string {
  const key = randomBytes(32).toString('hex');
  const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test';
  return `${prefix}_${environment}_${key}`;
}
```

### Key Storage

#### DO

- Store keys in secure secret management systems (AWS Secrets Manager, HashiCorp Vault, Azure Key Vault)
- Encrypt keys at rest
- Use separate keys for different environments
- Implement key versioning

#### DON'T

- Store keys in source code
- Store keys in plain text configuration files
- Share keys via email or messaging platforms
- Use the same key across environments

### Key Rotation

| Key Type | Rotation Frequency | Notification Period |
|----------|-------------------|---------------------|
| Public API keys | Every 180 days | 30 days |
| Internal service keys | Every 90 days | 14 days |
| Third-party integration keys | Per provider requirements | As required |

### Key Revocation

#### Immediate Revocation Triggers

- Suspected compromise
- Employee departure with key access
- Key exposed in logs or error messages
- Key found in public repository

#### Revocation Procedure

1. Generate new key immediately
2. Update dependent services with new key
3. Mark old key as revoked in database
4. Log revocation event for audit
5. Monitor for failed authentication attempts with old key

### API Key Security Checklist

- [ ] Keys are transmitted only over HTTPS
- [ ] Keys are not logged in application logs
- [ ] Keys are not exposed in error messages
- [ ] Keys have appropriate rate limits
- [ ] Keys have minimal required permissions (principle of least privilege)
- [ ] Key usage is monitored and audited
- [ ] Unused keys are regularly identified and revoked

---

## Security Checklist

### Pre-Deployment Security Review

#### Code Security

- [ ] No secrets hardcoded in source code
- [ ] No secrets in committed configuration files
- [ ] `.env` files are in `.gitignore`
- [ ] Input validation on all user inputs
- [ ] Output encoding to prevent XSS
- [ ] SQL injection prevention (parameterized queries)
- [ ] CSRF protection enabled

#### Authentication & Authorization

- [ ] Strong password requirements enforced
- [ ] JWT tokens have appropriate expiration
- [ ] Refresh token rotation implemented
- [ ] Role-based access control (RBAC) properly configured
- [ ] Failed login attempts are rate-limited
- [ ] Account lockout after multiple failures

#### Infrastructure Security

- [ ] HTTPS enforced in production
- [ ] Security headers configured (Helmet)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Database connections use SSL
- [ ] Firewall rules restrict unnecessary access

#### Monitoring & Logging

- [ ] Security events are logged
- [ ] Logs do not contain sensitive data
- [ ] Alerting configured for security events
- [ ] Log retention policy defined

### Regular Security Tasks

| Task | Frequency | Owner |
|------|-----------|-------|
| Dependency vulnerability scan | Weekly | DevOps |
| JWT secret rotation | Every 90 days | Security Team |
| Database credential rotation | Every 60 days | DBA |
| API key audit | Monthly | Security Team |
| Access control review | Quarterly | Security Team |
| Penetration testing | Annually | External Vendor |

---

## Incident Response

### Security Incident Classification

| Level | Description | Response Time |
|-------|-------------|---------------|
| Critical | Active data breach, system compromise | Immediate |
| High | Suspected breach, vulnerability exploited | Within 1 hour |
| Medium | Potential vulnerability discovered | Within 24 hours |
| Low | Security improvement identified | Within 1 week |

### Emergency Contacts

Maintain an up-to-date list of:

- Security team lead
- DevOps on-call
- Legal/Compliance contact
- External security consultant

### Incident Response Steps

1. **Identify** - Confirm and classify the incident
2. **Contain** - Limit the scope and impact
3. **Eradicate** - Remove the threat
4. **Recover** - Restore normal operations
5. **Learn** - Document and improve processes

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-06 | Security Team | Initial document creation |

---

## References

- [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/auth-methods.html)
