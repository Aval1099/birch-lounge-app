# MCP Services Troubleshooting Guide

## 🔧 **Quick Diagnostics**

### Run Health Check
```bash
npm run mcp:test        # Test all services
npm run mcp:status      # Check service status  
npm run mcp:health      # Detailed health check
```

### Check Environment
```bash
# Verify .env file exists and has correct settings
cat .env | grep MCP

# Check if all required directories exist
ls -la data/
```

---

## 🚨 **Common Issues & Solutions**

### **1. "Service Not Available" Error**

**Symptoms:**
- Service shows as unavailable in dashboard
- API calls fail with connection errors

**Solutions:**
```bash
# Check if service file exists
ls src/services/mcp*Service.js

# Verify environment configuration
grep "MCP_.*_ENABLED" .env

# Test individual service
node -e "console.log('Service files exist')"
```

**Fix:**
1. Ensure service is enabled in `.env`: `MCP_WEB_FETCH_ENABLED=true`
2. Check file permissions
3. Restart the application

---

### **2. API Key Authentication Errors**

**Symptoms:**
- "Invalid API key" errors
- "Authentication failed" messages
- 401/403 HTTP errors

**Solutions:**

#### Check API Key Format
```bash
# Exa Search API Key
echo $EXA_API_KEY | grep -E "^[a-zA-Z0-9_-]+$"

# OpenAI API Key  
echo $OPENAI_API_KEY | grep -E "^sk-[a-zA-Z0-9_-]+$"

# GitHub Token
echo $GITHUB_TOKEN | grep -E "^ghp_[a-zA-Z0-9_-]+$"

# Notion API Key
echo $NOTION_API_KEY | grep -E "^secret_[a-zA-Z0-9_-]+$"
```

#### Test API Keys Independently
```bash
# Test Exa API
curl -H "Authorization: Bearer $EXA_API_KEY" https://api.exa.ai/search

# Test OpenAI API
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Test GitHub API
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

**Fix:**
1. Regenerate API keys from provider dashboards
2. Update `.env` file with new keys
3. Restart application
4. Check for typos or extra spaces

---

### **3. Rate Limiting Issues**

**Symptoms:**
- "Rate limit exceeded" errors
- Slow response times
- Temporary service unavailability

**Solutions:**
```bash
# Check current rate limits in .env
grep "RATE_LIMIT" .env

# Monitor API usage
npm run mcp:logs | grep "rate"
```

**Fix:**
1. Reduce request frequency
2. Implement caching
3. Upgrade to higher API tier
4. Add delays between requests

---

### **4. Database Connection Issues**

**Symptoms:**
- Database service unavailable
- Connection timeout errors
- PostgreSQL connection failures

**Solutions:**

#### Check PostgreSQL Status
```bash
# Windows
sc query postgresql

# macOS/Linux  
brew services list | grep postgresql
# or
systemctl status postgresql
```

#### Test Database Connection
```bash
# Test connection string
psql "postgresql://localhost:5432/birch_lounge_analytics"

# Check if database exists
psql -l | grep birch_lounge
```

**Fix:**
1. Start PostgreSQL service
2. Create database: `createdb birch_lounge_analytics`
3. Update connection string in `.env`
4. Check firewall settings

---

### **5. File Permission Errors**

**Symptoms:**
- "Permission denied" errors
- Cannot read/write files
- Service startup failures

**Solutions:**
```bash
# Check file permissions
ls -la src/services/mcp*Service.js
ls -la data/

# Fix permissions (Unix/macOS)
chmod 755 src/services/mcp*Service.js
chmod 755 data/

# Windows - Run as Administrator
```

**Fix:**
1. Ensure proper file permissions
2. Run with appropriate user privileges
3. Check directory ownership

---

### **6. Network/Firewall Issues**

**Symptoms:**
- Connection timeouts
- DNS resolution failures
- Blocked API requests

**Solutions:**
```bash
# Test network connectivity
ping api.exa.ai
ping api.openai.com
ping api.github.com

# Check DNS resolution
nslookup api.exa.ai

# Test HTTPS connectivity
curl -I https://api.exa.ai
```

**Fix:**
1. Check firewall settings
2. Configure proxy if needed
3. Verify DNS settings
4. Check corporate network restrictions

---

## 🔍 **Service-Specific Issues**

### **Web Fetch MCP**

**Issue**: Cannot scrape certain websites
```bash
# Check allowed domains
grep "WEB_FETCH_ALLOWED_DOMAINS" .env

# Test URL accessibility
curl -I https://liquor.com/recipes/gin-and-tonic/
```

**Fix**: Add domain to allowed list, check robots.txt

### **Excel MCP**

**Issue**: Import/export failures
```bash
# Check directory permissions
ls -la data/imports/ data/exports/

# Verify template format
cat data/templates/recipe-template.json
```

**Fix**: Ensure directories exist and are writable

### **Search MCP**

**Issue**: No search results
```bash
# Test Exa API directly
curl -X POST https://api.exa.ai/search \
  -H "Authorization: Bearer $EXA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "gin cocktails"}'
```

**Fix**: Check API key, verify query format

### **Notion MCP**

**Issue**: Cannot create pages
```bash
# Test Notion API
curl -X GET https://api.notion.com/v1/databases/$NOTION_DATABASE_ID \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28"
```

**Fix**: Check database permissions, verify integration setup

---

## 📊 **Monitoring & Logging**

### **Enable Debug Mode**
```bash
# Add to .env
MCP_DEBUG=true
MCP_LOG_LEVEL=debug

# Restart application
npm run mcp:restart
```

### **View Logs**
```bash
# Application logs
npm run mcp:logs

# System logs (varies by OS)
# Windows: Event Viewer
# macOS: Console.app
# Linux: journalctl
```

### **Monitor Performance**
```bash
# Check memory usage
npm run mcp:status

# Monitor API usage
grep "API" logs/*.log

# Check response times
grep "response_time" logs/*.log
```

---

## 🆘 **Emergency Recovery**

### **Reset All Services**
```bash
# Stop all services
npm run mcp:stop

# Clear cache
rm -rf data/cache/*

# Reset configuration
cp .env.example .env

# Reinstall
npm run mcp:install

# Restart
npm run mcp:start
```

### **Backup & Restore**
```bash
# Backup configuration
cp .env .env.backup
cp mcp-config.json mcp-config.backup.json

# Backup data
tar -czf mcp-backup.tar.gz data/ logs/

# Restore from backup
tar -xzf mcp-backup.tar.gz
```

---

## 📞 **Getting Help**

### **Self-Help Resources**
1. **Documentation**: `/docs/mcp-services.md`
2. **API Setup**: `/docs/api-keys-setup.md`
3. **Integration Guide**: `/docs/claude-desktop-integration.md`

### **Community Support**
1. **GitHub Issues**: Report bugs and feature requests
2. **Discussions**: Share tips and ask questions
3. **Discord/Slack**: Real-time community help

### **Professional Support**
1. **API Provider Support**: Contact service providers directly
2. **Consulting**: Consider professional MCP integration help
3. **Custom Development**: Hire developers for custom features

---

## 🔄 **Maintenance Tasks**

### **Weekly**
- Check service health: `npm run mcp:health`
- Review logs for errors: `npm run mcp:logs`
- Monitor API usage and costs

### **Monthly**
- Update dependencies: `npm update`
- Rotate API keys for security
- Review and optimize configurations
- Backup important data

### **Quarterly**
- Review service performance metrics
- Evaluate new MCP services
- Update documentation
- Plan feature enhancements

---

## ✅ **Prevention Tips**

1. **Regular Testing**: Run `npm run mcp:test` weekly
2. **Monitor Usage**: Track API costs and limits
3. **Keep Updated**: Update dependencies regularly
4. **Backup Data**: Regular backups of configurations
5. **Document Changes**: Keep track of configuration changes
6. **Security**: Rotate API keys regularly
7. **Performance**: Monitor response times and optimize

Remember: Most issues are configuration-related and can be resolved by checking environment variables and API keys!
