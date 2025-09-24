#!/usr/bin/env node

// =============================================================================
// SECURITY AUDIT SCRIPT - Comprehensive security scanning for API keys and sensitive data
// =============================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Security patterns to detect
 */
const SECURITY_PATTERNS = {
  // API Keys
  googleApiKey: {
    pattern: /AIza[0-9A-Za-z-_]{35}/g,
    severity: 'CRITICAL',
    description: 'Google API Key detected'
  },
  openaiApiKey: {
    pattern: /sk-[a-zA-Z0-9]{48}/g,
    severity: 'CRITICAL',
    description: 'OpenAI API Key detected'
  },
  anthropicApiKey: {
    pattern: /sk-ant-[a-zA-Z0-9-_]{95}/g,
    severity: 'CRITICAL',
    description: 'Anthropic API Key detected'
  },
  supabaseKey: {
    pattern: /eyJ[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+/g,
    severity: 'HIGH',
    description: 'Supabase/JWT Token detected'
  },

  // Generic secrets
  genericSecret: {
    pattern: /(?:secret|password|token|key)\s*[:=]\s*['"][a-zA-Z0-9+/=]{20,}['\"]/gi,
    severity: 'HIGH',
    description: 'Generic secret/password detected'
  },

  // Environment variables in code
  envVarExposed: {
    pattern: /process\.env\.[A-Z_]+/g,
    severity: 'MEDIUM',
    description: 'Environment variable reference (review for client-side exposure)'
  },

  // Hardcoded URLs with credentials
  urlWithCredentials: {
    pattern: /https?:\/\/[^:]+:[^@]+@[^\/\s]+/g,
    severity: 'HIGH',
    description: 'URL with embedded credentials detected'
  },

  // Private keys
  privateKey: {
    pattern: /-----BEGIN [A-Z ]+PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    description: 'Private key detected'
  },

  // AWS credentials
  awsAccessKey: {
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'CRITICAL',
    description: 'AWS Access Key detected'
  },

  // Database connection strings
  dbConnection: {
    pattern: /(?:mongodb|mysql|postgres|redis):\/\/[^\s]+/gi,
    severity: 'HIGH',
    description: 'Database connection string detected'
  }
};

/**
 * Files and directories to exclude from scanning
 */
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
  /\.env\.example$/,
  /\.env\.example\.secure$/,
  /security-audit\.cjs$/,
  /security-audit-report\.json$/,
  /\.log$/,
  /\.lock$/,
  /\.map$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /test/,
  /tests/,
  /spec/,
  /\.test\./,
  /\.spec\./,
  /SECURITY\.md$/,
  /README\.md$/,
  /CHANGELOG\.md$/
];

/**
 * File extensions to scan
 */
const SCAN_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.json', '.env', '.env.local',
  '.env.development', '.env.production', '.yml', '.yaml', '.md'
];

/**
 * Security audit results
 */
class SecurityAuditResults {
  constructor() {
    this.findings = [];
    this.summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: 0
    };
    this.scannedFiles = 0;
    this.startTime = Date.now();
  }

  addFinding(finding) {
    this.findings.push(finding);
    this.summary[finding.severity.toLowerCase()]++;
    this.summary.total++;
  }

  generateReport() {
    const duration = Date.now() - this.startTime;

    return {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      scannedFiles: this.scannedFiles,
      summary: this.summary,
      findings: this.findings,
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.summary.critical > 0) {
      recommendations.push({
        priority: 'IMMEDIATE',
        action: 'Remove all hardcoded API keys and secrets from code',
        details: 'Critical security vulnerabilities detected. These must be fixed before deployment.'
      });
    }

    if (this.summary.high > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Review and secure all high-severity findings',
        details: 'High-risk security issues that should be addressed promptly.'
      });
    }

    recommendations.push({
      priority: 'BEST_PRACTICE',
      action: 'Use environment variables for all sensitive configuration',
      details: 'Store API keys and secrets in .env files that are excluded from version control.'
    });

    recommendations.push({
      priority: 'BEST_PRACTICE',
      action: 'Implement proper secret management',
      details: 'Consider using services like HashiCorp Vault, AWS Secrets Manager, or Azure Key Vault for production.'
    });

    return recommendations;
  }
}

/**
 * Security scanner class
 */
class SecurityScanner {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.results = new SecurityAuditResults();
  }

  /**
   * Scan directory recursively
   */
  async scanDirectory(dir = this.rootDir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(this.rootDir, fullPath);

      // Skip excluded patterns
      if (this.shouldExclude(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath);
      } else if (entry.isFile() && this.shouldScanFile(entry.name)) {
        await this.scanFile(fullPath, relativePath);
      }
    }
  }

  /**
   * Check if path should be excluded
   */
  shouldExclude(relativePath) {
    return EXCLUDE_PATTERNS.some(pattern => pattern.test(relativePath));
  }

  /**
   * Check if file should be scanned
   */
  shouldScanFile(filename) {
    const ext = path.extname(filename);
    return SCAN_EXTENSIONS.includes(ext) || filename.startsWith('.env');
  }

  /**
   * Scan individual file
   */
  async scanFile(filePath, relativePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.results.scannedFiles++;

      // Scan for each security pattern
      Object.entries(SECURITY_PATTERNS).forEach(([patternName, config]) => {
        const matches = content.match(config.pattern);

        if (matches) {
          matches.forEach(match => {
            // Get line number
            const lineNumber = this.getLineNumber(content, match);

            this.results.addFinding({
              type: patternName,
              severity: config.severity,
              description: config.description,
              file: relativePath,
              line: lineNumber,
              match: this.sanitizeMatch(match),
              recommendation: this.getRecommendation(patternName)
            });
          });
        }
      });

      // Additional checks for specific file types
      if (relativePath.includes('.env')) {
        this.scanEnvFile(content, relativePath);
      }

    } catch (error) {
      console.warn(`Warning: Could not scan file ${relativePath}: ${error.message}`);
    }
  }

  /**
   * Get line number for a match
   */
  getLineNumber(content, match) {
    const index = content.indexOf(match);
    if (index === -1) return 1;

    return content.substring(0, index).split('\n').length;
  }

  /**
   * Sanitize match for safe display
   */
  sanitizeMatch(match) {
    // For API keys, show only first and last few characters
    if (match.length > 20) {
      return `${match.substring(0, 8)}...${match.substring(match.length - 4)}`;
    }
    return match;
  }

  /**
   * Get recommendation for specific pattern
   */
  getRecommendation(patternName) {
    const recommendations = {
      googleApiKey: 'Move to VITE_GEMINI_API_KEY environment variable',
      openaiApiKey: 'Move to VITE_OPENAI_API_KEY environment variable',
      anthropicApiKey: 'Move to VITE_ANTHROPIC_API_KEY environment variable',
      supabaseKey: 'Move to VITE_SUPABASE_ANON_KEY environment variable',
      genericSecret: 'Move to environment variables and exclude from version control',
      envVarExposed: 'Ensure this environment variable is not exposed to client-side code',
      urlWithCredentials: 'Remove credentials from URL and use secure authentication',
      privateKey: 'Remove private key and use secure key management',
      awsAccessKey: 'Move to AWS credentials file or environment variables',
      dbConnection: 'Move to environment variables and use connection pooling'
    };

    return recommendations[patternName] || 'Review and secure this finding';
  }

  /**
   * Scan environment file for additional checks
   */
  scanEnvFile(content, relativePath) {
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for empty values
      if (line.includes('=') && line.endsWith('=')) {
        this.results.addFinding({
          type: 'emptyEnvVar',
          severity: 'LOW',
          description: 'Empty environment variable',
          file: relativePath,
          line: index + 1,
          match: line.trim(),
          recommendation: 'Provide a value or remove unused variable'
        });
      }

      // Check for example values
      if (line.includes('your_') || line.includes('example_') || line.includes('replace_')) {
        this.results.addFinding({
          type: 'exampleValue',
          severity: 'MEDIUM',
          description: 'Example/placeholder value in environment file',
          file: relativePath,
          line: index + 1,
          match: line.trim(),
          recommendation: 'Replace with actual value or remove if not needed'
        });
      }
    });
  }

  /**
   * Run complete security audit
   */
  async runAudit() {
    console.log('🔒 Starting security audit...');
    console.log(`📁 Scanning directory: ${this.rootDir}`);

    await this.scanDirectory();

    const report = this.results.generateReport();

    console.log('\n📊 Security Audit Results:');
    console.log(`   Files scanned: ${report.scannedFiles}`);
    console.log(`   Duration: ${report.duration}`);
    console.log(`   Total findings: ${report.summary.total}`);
    console.log(`   Critical: ${report.summary.critical}`);
    console.log(`   High: ${report.summary.high}`);
    console.log(`   Medium: ${report.summary.medium}`);
    console.log(`   Low: ${report.summary.low}`);

    if (report.findings.length > 0) {
      console.log('\n🚨 Security Findings:');
      report.findings.forEach((finding, index) => {
        console.log(`\n${index + 1}. [${finding.severity}] ${finding.description}`);
        console.log(`   File: ${finding.file}:${finding.line}`);
        console.log(`   Match: ${finding.match}`);
        console.log(`   Recommendation: ${finding.recommendation}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`\n${index + 1}. [${rec.priority}] ${rec.action}`);
        console.log(`   ${rec.details}`);
      });
    }

    // Save detailed report
    const reportPath = path.join(this.rootDir, 'security-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Exit with error code if critical issues found
    if (report.summary.critical > 0) {
      console.log('\n❌ CRITICAL SECURITY ISSUES DETECTED!');
      console.log('   These must be fixed before deployment.');
      process.exit(1);
    } else if (report.summary.high > 0) {
      console.log('\n⚠️  High-severity security issues detected.');
      console.log('   Please review and address these findings.');
      process.exit(1);
    } else {
      console.log('\n✅ No critical security issues detected.');
      process.exit(0);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const rootDir = process.argv[2] || process.cwd();

  if (!fs.existsSync(rootDir)) {
    console.error(`Error: Directory ${rootDir} does not exist`);
    process.exit(1);
  }

  const scanner = new SecurityScanner(rootDir);
  await scanner.runAudit();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Security audit failed:', error);
    process.exit(1);
  });
}

module.exports = { SecurityScanner, SECURITY_PATTERNS };
