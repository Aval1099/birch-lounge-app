# 🔒 Security Guide - Birch Lounge Recipe Manager

## 🚨 Critical Security Notice

This application handles sensitive data including API keys and user information. **NEVER commit real API keys, passwords, or sensitive configuration to version control.**

## 📋 Security Checklist

### ✅ Before Development
- [ ] Copy `.env.example` to `.env.local`
- [ ] Replace all placeholder values with real credentials
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Enable 2FA on all service accounts
- [ ] Use unique, strong passwords for all accounts

### ✅ During Development
- [ ] Never hardcode API keys in source code
- [ ] Use environment variables for all sensitive configuration
- [ ] Regularly run security audits (`npm run security:audit`)
- [ ] Monitor console for security warnings
- [ ] Test with security features enabled

### ✅ Before Deployment
- [ ] Run comprehensive security audit
- [ ] Verify no secrets in git history
- [ ] Configure production environment variables
- [ ] Set up monitoring and alerting
- [ ] Review and update API key permissions

## 🔐 API Key Security

### Supported Services
- **Google Gemini AI**: For AI-powered recipe assistance
- **Supabase**: For cloud sync and authentication
- **OpenAI**: For future AI features (optional)
- **Anthropic Claude**: For future AI features (optional)

### Security Best Practices

#### 1. Environment Variables (Recommended)
```bash
# .env.local (NEVER commit this file)
VITE_GEMINI_API_KEY=AIzaSyYour_Real_API_Key_Here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_real_anon_key_here
```

#### 2. API Key Formats
- **Google Gemini**: `AIza[35 characters]`
- **OpenAI**: `sk-[48 characters]`
- **Anthropic**: `sk-ant-[95 characters]`
- **Supabase JWT**: `eyJ[JWT token]`

#### 3. Key Rotation Schedule
- **Development**: Every 90 days
- **Staging**: Every 60 days  
- **Production**: Every 30 days

## 🛡️ Security Features

### Built-in Security Services

#### 1. Security Service (`src/services/securityService.ts`)
- Real-time API key exposure detection
- XSS attack prevention
- CSRF protection
- Console output monitoring
- Network request monitoring
- Automatic threat detection

#### 2. API Key Service (`src/services/apiKeyService.js`)
- Secure in-memory key storage
- Automatic key validation
- Legacy key cleanup
- Environment variable integration
- Key rotation support

#### 3. Environment Validation (`src/services/envValidationService.js`)
- API key format validation
- Security compliance checking
- Configuration validation
- Best practice recommendations

### Security Monitoring

#### Real-time Monitoring
- API key exposure attempts
- XSS injection attempts
- Suspicious network activity
- Unauthorized access attempts
- Console security violations

#### Security Events
```typescript
// Example security event
{
  type: 'api_key_exposed',
  severity: 'critical',
  timestamp: 1640995200000,
  details: { source: 'network_request' },
  recommendations: ['Rotate API key immediately']
}
```

## 🔍 Security Auditing

### Automated Security Audit
```bash
# Run comprehensive security audit
npm run security:audit

# Run with specific directory
node scripts/security-audit.js /path/to/scan
```

### Manual Security Checks
```bash
# Check for exposed secrets in git history
git log --all --full-history --grep="password\|secret\|key" --oneline

# Search for potential API keys in codebase
grep -r "AIza\|sk-\|eyJ" src/ --exclude-dir=node_modules

# Check environment file security
ls -la .env*
```

### Security Audit Report
The security audit generates a comprehensive report including:
- **Critical Issues**: Exposed API keys, hardcoded secrets
- **High Issues**: Insecure storage, weak encryption
- **Medium Issues**: Configuration warnings, best practice violations
- **Low Issues**: Minor security improvements

## 🚨 Incident Response

### If API Keys Are Compromised

#### Immediate Actions (0-15 minutes)
1. **Revoke compromised keys** in service dashboards
2. **Generate new API keys** with minimal permissions
3. **Update environment variables** with new keys
4. **Deploy updated configuration** to all environments
5. **Monitor for unauthorized usage** of old keys

#### Investigation (15-60 minutes)
1. **Review git history** for when keys were exposed
2. **Check access logs** for unauthorized API usage
3. **Identify affected systems** and data
4. **Document timeline** of exposure

#### Recovery (1-24 hours)
1. **Implement additional security measures**
2. **Update security procedures** to prevent recurrence
3. **Notify stakeholders** if required
4. **Conduct post-incident review**

### Emergency Contacts
- **Security Team**: security@your-company.com
- **DevOps Team**: devops@your-company.com
- **On-call Engineer**: +1-xxx-xxx-xxxx

## 🔧 Security Configuration

### Environment Variables
```bash
# Security features
VITE_ENABLE_SECURITY_DEBUG=false
VITE_API_KEY_VALIDATION_STRICT=true
VITE_ENABLE_SECURITY_HEADERS=true
VITE_ENABLE_XSS_PROTECTION=true
VITE_ENABLE_CSRF_PROTECTION=true

# Monitoring
VITE_SECURITY_MONITORING_ENABLED=true
VITE_SECURITY_LOG_LEVEL=warn
VITE_MAX_API_CALLS_PER_MINUTE=100
```

### Content Security Policy
```javascript
// Recommended CSP headers (set by server)
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.gemini.com https://*.supabase.co;
```

## 📚 Security Resources

### Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [API Security Best Practices](https://owasp.org/www-project-api-security/)
- [React Security Guide](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)

### Tools
- [Security Audit Script](./scripts/security-audit.js)
- [Environment Validation](./src/services/envValidationService.js)
- [Security Service](./src/services/securityService.ts)

### Service-Specific Security
- [Google API Security](https://developers.google.com/identity/protocols/oauth2/security-best-practices)
- [Supabase Security](https://supabase.com/docs/guides/auth/security)
- [OpenAI API Security](https://platform.openai.com/docs/guides/safety-best-practices)

## 🎯 Security Compliance

### Standards Compliance
- **OWASP Top 10**: Protection against common vulnerabilities
- **GDPR**: Privacy-by-design for user data
- **SOC 2**: Security controls for service organizations
- **ISO 27001**: Information security management

### Regular Security Tasks

#### Daily
- [ ] Monitor security alerts and logs
- [ ] Review API usage patterns
- [ ] Check for security updates

#### Weekly  
- [ ] Run automated security scans
- [ ] Review access permissions
- [ ] Update security documentation

#### Monthly
- [ ] Rotate API keys
- [ ] Conduct security training
- [ ] Review incident response procedures

#### Quarterly
- [ ] Comprehensive security audit
- [ ] Penetration testing
- [ ] Security policy review

## 🔄 Continuous Security

### CI/CD Integration
```yaml
# Example GitHub Actions security check
- name: Security Audit
  run: npm run security:audit
  
- name: Dependency Check
  run: npm audit --audit-level=high
  
- name: Secret Scanning
  uses: trufflesecurity/trufflehog@main
```

### Monitoring and Alerting
- **Real-time security event monitoring**
- **API usage anomaly detection**
- **Automated incident response**
- **Security metrics dashboard**

## 📞 Support

For security questions or to report vulnerabilities:
- **Email**: security@your-company.com
- **Security Portal**: https://your-company.com/security
- **Bug Bounty**: https://your-company.com/bug-bounty

---

**Remember**: Security is everyone's responsibility. When in doubt, ask the security team!
