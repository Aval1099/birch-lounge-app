# Claude Desktop Integration Guide

This guide shows you how to integrate the Birch Lounge MCP services with Claude Desktop for enhanced AI-powered recipe management.

## 📋 **Prerequisites**

1. **Claude Desktop installed** - Download from https://claude.ai/download
2. **Birch Lounge MCP services installed** - Run `npm run mcp:install`
3. **API keys configured** - Edit `.env` file with your keys

## 🚀 **Quick Setup**

### Step 1: Locate Claude Desktop Config

Claude Desktop configuration file location:

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### Step 2: Copy MCP Configuration

Copy the contents of `mcp-config.json` from your Birch Lounge project:

```json
{
  "mcpServers": {
    "birch-lounge-web-fetch": {
      "command": "node",
      "args": ["C:/path/to/birch-lounge-app/src/services/mcpWebFetchService.js"],
      "env": {
        "WEB_FETCH_ALLOWED_DOMAINS": "liquor.com,diffordsguide.com,punchdrink.com",
        "WEB_FETCH_RATE_LIMIT": "30"
      }
    },
    "birch-lounge-excel": {
      "command": "node",
      "args": ["C:/path/to/birch-lounge-app/src/services/mcpExcelService.js"],
      "env": {
        "EXCEL_EXPORT_DIR": "C:/path/to/birch-lounge-app/data/exports",
        "EXCEL_IMPORT_DIR": "C:/path/to/birch-lounge-app/data/imports"
      }
    }
  }
}
```

**Important**: Replace `C:/path/to/birch-lounge-app` with your actual project path.

### Step 3: Add API Keys (Optional Services)

For services that require API keys, add them to the `env` section:

```json
{
  "mcpServers": {
    "birch-lounge-search": {
      "command": "node",
      "args": ["C:/path/to/birch-lounge-app/src/services/mcpSearchService.js"],
      "env": {
        "EXA_API_KEY": "your_actual_exa_api_key_here",
        "SEARCH_RATE_LIMIT": "100"
      }
    },
    "birch-lounge-notion": {
      "command": "node",
      "args": ["C:/path/to/birch-lounge-app/src/services/mcpNotionService.js"],
      "env": {
        "NOTION_API_KEY": "secret_your_actual_notion_key_here",
        "NOTION_DATABASE_ID": "your_actual_database_id_here"
      }
    },
    "birch-lounge-github": {
      "command": "node",
      "args": ["C:/path/to/birch-lounge-app/src/services/mcpGitHubService.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_actual_github_token_here",
        "GITHUB_OWNER": "your_github_username",
        "GITHUB_REPO": "birch-lounge-recipes"
      }
    },
    "birch-lounge-openai": {
      "command": "node",
      "args": ["C:/path/to/birch-lounge-app/src/services/mcpOpenAIService.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your_actual_openai_key_here",
        "OPENAI_MODEL": "gpt-4"
      }
    }
  }
}
```

### Step 4: Restart Claude Desktop

1. Close Claude Desktop completely
2. Restart the application
3. Check that MCP services are loaded

## 🧪 **Testing Integration**

### Verify MCP Services

In Claude Desktop, try these commands:

```
Can you help me find a gin and tonic recipe using the web fetch service?
```

```
Export my current recipes to Excel format using the Excel service.
```

```
Search for trending summer cocktails using the search service.
```

### Check Service Status

Ask Claude:
```
What MCP services are currently available for the Birch Lounge app?
```

## 🔧 **Advanced Configuration**

### Service-Specific Settings

#### Web Fetch Service
```json
{
  "birch-lounge-web-fetch": {
    "command": "node",
    "args": ["path/to/mcpWebFetchService.js"],
    "env": {
      "WEB_FETCH_ALLOWED_DOMAINS": "liquor.com,diffordsguide.com,punchdrink.com,cocktaildb.com",
      "WEB_FETCH_RATE_LIMIT": "30",
      "WEB_FETCH_TIMEOUT": "10000",
      "WEB_FETCH_USER_AGENT": "Birch-Lounge-Bot/1.0"
    }
  }
}
```

#### Database Service (PostgreSQL)
```json
{
  "birch-lounge-database": {
    "command": "node",
    "args": ["path/to/mcpDatabaseService.js"],
    "env": {
      "DATABASE_URL": "postgresql://username:password@localhost:5432/birch_lounge_analytics",
      "DB_POOL_MIN": "2",
      "DB_POOL_MAX": "10",
      "DB_TIMEOUT": "30000"
    }
  }
}
```

### Environment-Specific Configs

#### Development
```json
{
  "mcpServers": {
    "birch-lounge-dev": {
      "command": "node",
      "args": ["path/to/mcpManager.js"],
      "env": {
        "NODE_ENV": "development",
        "MCP_DEBUG": "true",
        "MCP_LOG_LEVEL": "debug"
      }
    }
  }
}
```

#### Production
```json
{
  "mcpServers": {
    "birch-lounge-prod": {
      "command": "node",
      "args": ["path/to/mcpManager.js"],
      "env": {
        "NODE_ENV": "production",
        "MCP_DEBUG": "false",
        "MCP_LOG_LEVEL": "error"
      }
    }
  }
}
```

## 🎯 **Use Cases & Examples**

### Recipe Discovery
```
"Find me 5 gin-based cocktails from Liquor.com and import them into my recipe collection."
```

### Bulk Operations
```
"Export all my cocktail recipes to an Excel file organized by category."
```

### Menu Planning
```
"Analyze my current menu and suggest cost optimizations using the OpenAI service."
```

### Documentation
```
"Create a Notion page documenting all my summer cocktail recipes with preparation notes."
```

### Version Control
```
"Commit my latest recipe changes to GitHub with a descriptive message."
```

## 🔍 **Troubleshooting**

### Common Issues

#### "MCP server not found"
- Check file paths in configuration
- Ensure Node.js is in PATH
- Verify service files exist

#### "Authentication failed"
- Check API keys are correct
- Verify environment variables
- Test keys independently

#### "Service timeout"
- Increase timeout values
- Check network connectivity
- Verify service endpoints

#### "Permission denied"
- Check file permissions
- Run Claude Desktop as administrator (Windows)
- Verify directory access

### Debug Mode

Enable debug logging:
```json
{
  "env": {
    "MCP_DEBUG": "true",
    "MCP_LOG_LEVEL": "debug"
  }
}
```

### Log Files

Check logs in:
- **Windows**: `%APPDATA%\Claude\logs\`
- **macOS**: `~/Library/Logs/Claude/`
- **Linux**: `~/.local/share/Claude/logs/`

## 📚 **Best Practices**

### Security
- Never commit API keys to version control
- Use environment variables for sensitive data
- Rotate API keys regularly
- Monitor usage for unusual activity

### Performance
- Use caching where appropriate
- Set reasonable rate limits
- Monitor API usage costs
- Optimize batch operations

### Maintenance
- Keep services updated
- Monitor service health
- Review logs regularly
- Test integrations after updates

## 🚀 **Next Steps**

1. **Start with basic services** (Web Fetch, Excel)
2. **Add API keys** for enhanced services
3. **Test integration** with real recipes
4. **Explore advanced features** and automation
5. **Share feedback** and contribute improvements

## 📞 **Support**

- **Documentation**: `/docs/mcp-services.md`
- **Troubleshooting**: `/docs/troubleshooting.md`
- **GitHub Issues**: Create issue for bugs
- **Community**: Join discussions and share tips
