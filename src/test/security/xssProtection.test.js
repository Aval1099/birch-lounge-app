import { describe, it, expect } from 'vitest';

import { sanitizeInput, sanitizeHtml, sanitizeUrl, sanitizeCss } from '../../utils';

describe('XSS Protection Suite', () => {
  describe('sanitizeInput', () => {
    it('should handle basic script tag injection', () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should handle iframe injection', () => {
      const malicious = '<iframe src="javascript:alert(\'XSS\')"></iframe>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should handle object tag injection', () => {
      const malicious = '<object data="javascript:alert(\'XSS\')"></object>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<object');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should handle embed tag injection', () => {
      const malicious = '<embed src="javascript:alert(\'XSS\')">';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<embed');
    });

    it('should handle applet tag injection', () => {
      const malicious = '<applet code="javascript:alert(\'XSS\')"></applet>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<applet');
    });

    it('should handle form tag injection', () => {
      const malicious = '<form action="javascript:alert(\'XSS\')"><input type="submit"></form>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<form');
      expect(sanitized).not.toContain('<input');
    });

    it('should handle meta tag injection', () => {
      const malicious = '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<meta');
    });

    it('should handle link tag injection', () => {
      const malicious = '<link rel="stylesheet" href="javascript:alert(\'XSS\')">';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<link');
    });

    it('should handle style tag injection', () => {
      const malicious = '<style>body{background:expression(alert(\'XSS\'))}</style>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<style');
      expect(sanitized).not.toContain('expression');
    });

    it('should handle javascript protocol', () => {
      const malicious = 'javascript:alert("XSS")';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('javascript:');
    });

    it('should handle data protocol', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle vbscript protocol', () => {
      const malicious = 'vbscript:alert("XSS")';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('vbscript:');
    });

    it('should handle file protocol', () => {
      const malicious = 'file:///etc/passwd';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('file:');
    });

    it('should handle ftp protocol', () => {
      const malicious = 'ftp://malicious.com/script.js';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('ftp:');
    });

    it('should handle event handler attributes', () => {
      const malicious = '<img src="x" onerror="alert(\'XSS\')">';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('<img');
    });

    it('should handle multiple event handlers', () => {
      const malicious = '<div onclick="alert(\'XSS\')" onmouseover="alert(\'XSS2\')" onload="alert(\'XSS3\')">Click me</div>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('onmouseover');
      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('<div');
    });

    it('should handle SVG-based XSS', () => {
      const malicious = '<svg onload="alert(\'XSS\')"></svg>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<svg');
      expect(sanitized).not.toContain('onload');
    });

    it('should handle CSS expression attacks', () => {
      const malicious = '<div style="width:expression(alert(\'XSS\'))">Test</div>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('expression');
      expect(sanitized).not.toContain('<div');
    });

    it('should handle DOM-based XSS patterns', () => {
      const malicious = 'document.cookie';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('document.');

      const malicious2 = 'window.location';
      const sanitized2 = sanitizeInput(malicious2);
      expect(sanitized2).not.toContain('window.');

      const malicious3 = 'eval(alert("XSS"))';
      const sanitized3 = sanitizeInput(malicious3);
      expect(sanitized3).not.toContain('eval(');
    });

    it('should handle setTimeout and setInterval', () => {
      const malicious = 'setTimeout("alert(\'XSS\')", 1000)';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('setTimeout(');

      const malicious2 = 'setInterval("alert(\'XSS\')", 1000)';
      const sanitized2 = sanitizeInput(malicious2);
      expect(sanitized2).not.toContain('setInterval(');
    });

    it('should handle Function constructor', () => {
      const malicious = 'Function("alert(\'XSS\')")()';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('Function(');
    });

    it('should handle base64 encoded attacks', () => {
      const malicious = 'data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:text/html');
    });

    it('should handle null bytes', () => {
      const malicious = 'test\0<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('\0');
      expect(sanitized).not.toContain('<script>');
    });

    it('should handle control characters', () => {
      const malicious = 'test\x00\x08\x0B\x0C\x0E\x1F\x7F<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<script>');
    });

    it('should handle Unicode attacks', () => {
      const malicious = 'test\u2028\u2029<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('\u2028');
      expect(sanitized).not.toContain('\u2029');
      expect(sanitized).not.toContain('<script>');
    });

    it('should handle HTML entities', () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should allow safe HTML entities', () => {
      const safe = 'This is &amp; &lt; &gt; &quot; &apos; &nbsp;';
      const sanitized = sanitizeInput(safe);
      // HTML entities should be decoded in non-HTML mode for display
      expect(sanitized).toContain('&');
      expect(sanitized).toContain('<');
      expect(sanitized).toContain('>');
      expect(sanitized).toContain('"');
      expect(sanitized).toContain("'");
      expect(sanitized).toContain(' '); // &nbsp; becomes space
    });

    it('should handle mixed case attacks', () => {
      const malicious = '<ScRiPt>alert("XSS")</sCrIpT>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should handle malformed tags', () => {
      const malicious = '<script>alert("XSS")';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('alert');
    });

    it('should handle attribute-based XSS', () => {
      const malicious = '<img src="x" "onerror="alert(\'XSS\')">';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('<img');
    });

    it('should handle protocol obfuscation', () => {
      const malicious = 'javascripT:alert("XSS")';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('javascript:');

      const malicious2 = 'javascript\n:alert("XSS")';
      const sanitized2 = sanitizeInput(malicious2);
      expect(sanitized2).not.toContain('javascript:');
    });

    it('should handle length limiting', () => {
      const longText = 'a'.repeat(1500);
      const sanitized = sanitizeInput(longText);
      expect(sanitized.length).toBe(1000);
    });

    it('should handle non-string input', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
      expect(sanitizeInput(123)).toBe('');
      expect(sanitizeInput({})).toBe('');
      expect(sanitizeInput([])).toBe('');
    });

    it('should preserve legitimate content', () => {
      const legitimate = 'This is a normal text with numbers 123 and symbols !@#$%^&*()';
      const sanitized = sanitizeInput(legitimate);
      expect(sanitized).toBe(legitimate);
    });

    it('should handle allowHtml option', () => {
      const html = '<p>This is <strong>bold</strong> text</p>';
      const sanitized = sanitizeInput(html, { allowHtml: true });
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>');
      expect(sanitized).toContain('</strong>');
      expect(sanitized).toContain('</p>');
    });

    it('should still remove dangerous tags when allowHtml is true', () => {
      const malicious = '<p>Safe content</p><script>alert("XSS")</script><div>More safe</div>';
      const sanitized = sanitizeInput(malicious, { allowHtml: true });
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<div>');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove event handlers when allowHtml is true', () => {
      const malicious = '<div onclick="alert(\'XSS\')">Click me</div>';
      const sanitized = sanitizeInput(malicious, { allowHtml: true });
      expect(sanitized).toContain('<div');
      expect(sanitized).toContain('Click me');
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('alert');
    });
  });

  describe('sanitizeHtml', () => {
    it('should allow basic HTML formatting', () => {
      const html = '<p>This is <strong>bold</strong> and <em>italic</em> text</p>';
      const sanitized = sanitizeHtml(html);
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>');
      expect(sanitized).toContain('<em>');
    });

    it('should remove dangerous scripts from HTML', () => {
      const malicious = '<p>Safe content</p><script>alert("XSS")</script><div>More safe</div>';
      const sanitized = sanitizeHtml(malicious);
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<div>');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should handle longer content length', () => {
      const longHtml = `<p>${  'a'.repeat(6000)  }</p>`;
      const sanitized = sanitizeHtml(longHtml);
      expect(sanitized.length).toBe(5000);
    });
  });

  describe('sanitizeUrl', () => {
    it('should remove javascript protocol', () => {
      const malicious = 'javascript:alert("XSS")';
      const sanitized = sanitizeUrl(malicious);
      expect(sanitized).toBe('');
    });

    it('should remove data protocol', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>';
      const sanitized = sanitizeUrl(malicious);
      expect(sanitized).toBe('');
    });

    it('should allow valid URLs', () => {
      const valid = 'https://example.com/page';
      const sanitized = sanitizeUrl(valid);
      expect(sanitized).toBe(valid);
    });

    it('should allow relative URLs', () => {
      const valid = '/page';
      const sanitized = sanitizeUrl(valid);
      expect(sanitized).toBe(valid);
    });

    it('should handle invalid URLs', () => {
      const invalid = 'not-a-url';
      const sanitized = sanitizeUrl(invalid);
      expect(sanitized).toBe('');
    });
  });

  describe('sanitizeCss', () => {
    it('should remove CSS expressions', () => {
      const malicious = 'width:expression(alert("XSS"))';
      const sanitized = sanitizeCss(malicious);
      expect(sanitized).not.toContain('expression');
    });

    it('should remove javascript protocols', () => {
      const malicious = 'background-image:url(javascript:alert("XSS"))';
      const sanitized = sanitizeCss(malicious);
      expect(sanitized).not.toContain('javascript:');
    });

    it('should remove dangerous functions', () => {
      const malicious = 'content:eval(alert("XSS"))';
      const sanitized = sanitizeCss(malicious);
      expect(sanitized).not.toContain('eval(');
    });

    it('should allow safe CSS', () => {
      const safe = 'color: red; background: blue; font-size: 14px;';
      const sanitized = sanitizeCss(safe);
      expect(sanitized).toBe(safe);
    });

    it('should remove dangerous bindings', () => {
      const malicious = 'behavior:url(script.htc)';
      const sanitized = sanitizeCss(malicious);
      expect(sanitized).not.toContain('behavior:');
    });
  });

  describe('Advanced XSS Attack Vectors', () => {
    it('should handle UTF-7 XSS', () => {
      const malicious = '+ADw-script+AD4-alert(+ACc-XSS+ACc-)+ADw-/script+AD4-';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('script');
      expect(sanitized).not.toContain('alert');
    });

    it('should handle BOM XSS', () => {
      const malicious = '\xEF\xBB\xBF<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should handle DOM clobbering', () => {
      const malicious = '<form id="test"><input name="parentNode"></form>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<form>');
      expect(sanitized).not.toContain('<input>');
    });

    it('should handle CSS-based XSS', () => {
      const malicious = '<style>@import "javascript:alert(\'XSS\')";</style>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<style>');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should handle VBScript XSS', () => {
      const malicious = '<script language="vbscript">alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('vbscript');
    });

    it('should handle template injection', () => {
      const malicious = '${alert("XSS")}';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('${');
    });

    it('should handle markdown injection', () => {
      const malicious = '[XSS](javascript:alert("XSS"))';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('javascript:');
    });

    it('should handle JSON injection', () => {
      const malicious = '{"__proto__": {"polluted": "yes"}, "malicious": "<script>alert(\'XSS\')</script>"}';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should handle SQL injection attempts', () => {
      const malicious = '1\'; DROP TABLE users; --';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).toContain('1');
      expect(sanitized).not.toContain('DROP');
      expect(sanitized).not.toContain('--');
    });

    it('should handle command injection', () => {
      const malicious = 'test; rm -rf /; #';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).toContain('test');
      expect(sanitized).not.toContain('rm');
      expect(sanitized).not.toContain('-rf');
    });

    it('should handle LDAP injection', () => {
      const malicious = '*)(uid=*))(|(uid=*))';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('uid=*))');
    });

    it('should handle XPath injection', () => {
      const malicious = "' or '1'='1";
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).toContain('or');
      expect(sanitized).toContain('1');
    });

    it('should handle NoSQL injection', () => {
      const malicious = '{"$where": "this.password == \'password\'"}';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('$where');
    });

    it('should handle log injection', () => {
      const malicious = 'test\n2023-01-01 ERROR: System compromised\n';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('\n');
      expect(sanitized).not.toContain('ERROR');
    });

    it('should handle HTTP header injection', () => {
      const malicious = 'test\r\nX-Forwarded-For: 127.0.0.1\r\n';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('\r');
      expect(sanitized).not.toContain('\n');
      expect(sanitized).not.toContain('X-Forwarded-For');
    });

    it('should handle SMTP injection', () => {
      const malicious = 'test\r\nRCPT TO: <attacker@example.com>\r\n';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('\r');
      expect(sanitized).not.toContain('\n');
      expect(sanitized).not.toContain('RCPT TO');
    });

    it('should handle format string injection', () => {
      const malicious = 'test %x %s %n';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).toContain('%x');
      expect(sanitized).toContain('%s');
      expect(sanitized).toContain('%n');
    });

    it('should handle buffer overflow attempts', () => {
      const malicious = 'A'.repeat(10000);
      const sanitized = sanitizeInput(malicious);
      expect(sanitized.length).toBe(1000);
    });

    it('should handle zero-width characters', () => {
      const malicious = 'test\u200B\u200C\u200D\u2060script';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('\u200B');
      expect(sanitized).not.toContain('\u200C');
      expect(sanitized).not.toContain('\u200D');
      expect(sanitized).not.toContain('\u2060');
    });

    it('should handle homoglyph attacks', () => {
      const malicious = 'scrіpt'; // Using Cyrillic 'і'
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).toContain('scrіpt'); // Should preserve legitimate text
    });

    it('should handle IDN homograph attacks', () => {
      const malicious = 'https://аррӏе.com'; // Cyrillic characters
      const sanitized = sanitizeUrl(malicious);
      expect(sanitized).toBe(''); // Should block suspicious URLs
    });

    it('should handle mixed encoding attacks', () => {
      const malicious = '&#x3C;script&#x3E;alert("XSS")&#x3C;/script&#x3E;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('script');
      expect(sanitized).not.toContain('alert');
    });

    it('should handle nested encoding attacks', () => {
      const malicious = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('script');
      expect(sanitized).not.toContain('alert');
    });

    it('should handle comment-based attacks', () => {
      const malicious = '<!-- <script>alert("XSS")</script> -->';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('script');
      expect(sanitized).not.toContain('alert');
    });

    it('should handle conditional comments', () => {
      const malicious = '<!--[if IE]><script>alert("XSS")</script><![endif]-->';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('script');
      expect(sanitized).not.toContain('alert');
    });

    it('should handle XML-based attacks', () => {
      const malicious = '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<?xml');
      expect(sanitized).not.toContain('<!ENTITY');
    });

    it('should handle SVG-based attacks', () => {
      const malicious = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(\'XSS\')"/>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<svg');
      expect(sanitized).not.toContain('onload');
    });

    it('should handle MathML-based attacks', () => {
      const malicious = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mglyph href="javascript:alert(\'XSS\')"/></math>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<math');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should handle data URI attacks', () => {
      const malicious = 'data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9ImFsZXJ0KCdYU1MnKSIvPg==';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle blob URI attacks', () => {
      const malicious = 'blob:https://example.com/uuid-here';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('blob:');
    });

    it('should handle websocket attacks', () => {
      const malicious = 'ws://malicious.com/exploit';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('ws:');
    });

    it('should handle wss attacks', () => {
      const malicious = 'wss://malicious.com/exploit';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('wss:');
    });

    it('should handle mailto attacks', () => {
      const malicious = 'mailto:attacker@example.com?subject=<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).toContain('mailto:'); // Safe protocol should remain
      expect(sanitized).not.toContain('<script>'); // Dangerous content removed
      expect(sanitized).not.toContain('alert');
    });

    it('should handle tel attacks', () => {
      const malicious = 'tel:1234567890<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).toContain('tel:'); // Safe protocol should remain
      expect(sanitized).not.toContain('<script>'); // Dangerous content removed
      expect(sanitized).not.toContain('alert');
    });

    it('should handle sms attacks', () => {
      const malicious = 'sms:1234567890?body=<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).toContain('sms:'); // Safe protocol should remain
      expect(sanitized).not.toContain('<script>'); // Dangerous content removed
      expect(sanitized).not.toContain('alert');
    });

    it('should handle chrome attacks', () => {
      const malicious = 'chrome://settings/<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('chrome:');
      expect(sanitized).not.toContain('<script>');
    });

    it('should handle opera attacks', () => {
      const malicious = 'opera://settings/<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('opera:');
      expect(sanitized).not.toContain('<script>');
    });

    it('should handle res attacks', () => {
      const malicious = 'res://exploit.dll/<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('res:');
      expect(sanitized).not.toContain('<script>');
    });

    it('should handle resource attacks', () => {
      const malicious = 'resource://exploit/<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('resource:');
      expect(sanitized).not.toContain('<script>');
    });

    it('should handle about attacks', () => {
      const malicious = 'about:blank<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('about:');
      expect(sanitized).not.toContain('<script>');
    });

    it('should handle view-source attacks', () => {
      const malicious = 'view-source:javascript:alert("XSS")';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('view-source:');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should handle data URI with different MIME types', () => {
      const malicious = 'data:text/plain,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with base64 encoding', () => {
      const malicious = 'data:text/plain;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with charset', () => {
      const malicious = 'data:text/plain;charset=utf-8,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with encoding', () => {
      const malicious = 'data:text/plain;charset=utf-8;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with different content types', () => {
      const malicious = 'data:application/json,{"script":"alert(\'XSS\')"}';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with XML', () => {
      const malicious = 'data:application/xml,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with SVG', () => {
      const malicious = 'data:image/svg+xml,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with HTML', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with JavaScript', () => {
      const malicious = 'data:application/javascript,alert("XSS")';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with CSS', () => {
      const malicious = 'data:text/css,body{background:expression(alert("XSS"))}';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with PDF', () => {
      const malicious = 'data:application/pdf,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with ZIP', () => {
      const malicious = 'data:application/zip,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with executable', () => {
      const malicious = 'data:application/octet-stream,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with stream', () => {
      const malicious = 'data:application/octet-stream,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with unknown MIME type', () => {
      const malicious = 'data:unknown/type,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with no MIME type', () => {
      const malicious = 'data:,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with empty MIME type', () => {
      const malicious = 'data:;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with parameters', () => {
      const malicious = 'data:text/html;charset=utf-8;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with multiple parameters', () => {
      const malicious = 'data:text/html;charset=utf-8;base64;param=value,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with fragment', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>#fragment';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with query', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>?query=value';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with both query and fragment', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>?query=value#fragment';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with encoded characters', () => {
      const malicious = 'data:text/html,%3Cscript%3Ealert(%22XSS%22)%3C/script%3E';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with double encoding', () => {
      const malicious = 'data:text/html,%253Cscript%253Ealert(%2522XSS%2522)%253C/script%253E';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with mixed encoding', () => {
      const malicious = 'data:text/html,%3Cscript%3Ealert("XSS")%3C/script%3E';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with Unicode characters', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with null bytes', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>\0';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
      expect(sanitized).not.toContain('\0');
    });

    it('should handle data URI with control characters', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>\x00\x08\x0B\x0C\x0E\x1F\x7F';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with newlines', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>\n';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with carriage returns', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>\r';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with tabs', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>\t';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with spaces', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script> ';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with multiple spaces', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>    ';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with leading spaces', () => {
      const malicious = ' data:text/html,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with trailing spaces', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script> ';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with multiple leading spaces', () => {
      const malicious = '    data:text/html,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with multiple trailing spaces', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>    ';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with mixed whitespace', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script> \t\n\r ';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with comments', () => {
      const malicious = 'data:text/html,/* comment */<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with multiple comments', () => {
      const malicious = 'data:text/html,/* comment 1 *//* comment 2 */<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with nested comments', () => {
      const malicious = 'data:text/html,/* outer /* inner */ comment */<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with unclosed comments', () => {
      const malicious = 'data:text/html,/* comment <script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with malformed comments', () => {
      const malicious = 'data:text/html,/ comment <script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with conditional comments', () => {
      const malicious = 'data:text/html,<!--[if IE]><script>alert("XSS")</script><![endif]-->';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with CDATA sections', () => {
      const malicious = 'data:text/html,<![CDATA[<script>alert("XSS")</script>]]>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with processing instructions', () => {
      const malicious = 'data:text/html,<?xml version="1.0"?><script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with XML declarations', () => {
      const malicious = 'data:text/html,<?xml version="1.0" encoding="UTF-8"?><script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with DOCTYPE declarations', () => {
      const malicious = 'data:text/html,<!DOCTYPE html><script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with entity declarations', () => {
      const malicious = 'data:text/html,<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with entity references', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with character references', () => {
      const malicious = 'data:text/html,&#60;script&#62;alert("XSS")&#60;/script&#62;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with hexadecimal character references', () => {
      const malicious = 'data:text/html,&#x3C;script&#x3E;alert("XSS")&#x3C;/script&#x3E;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with decimal character references', () => {
      const malicious = 'data:text/html,&#60;script&#62;alert("XSS")&#60;/script&#62;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with mixed character references', () => {
      const malicious = 'data:text/html,&#60;script&#x3E;alert("XSS")&#60;/script&#x3E;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with nested character references', () => {
      const malicious = 'data:text/html,&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with double-encoded character references', () => {
      const malicious = 'data:text/html,&amp;lt;script&amp;gt;alert(&amp;quot;XSS&amp;quot;)&amp;lt;/script&amp;gt;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with triple-encoded character references', () => {
      const malicious = 'data:text/html,&amp;amp;lt;script&amp;amp;gt;alert(&amp;amp;quot;XSS&amp;amp;quot;)&amp;amp;lt;/script&amp;amp;gt;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with multiple encoding levels', () => {
      const malicious = 'data:text/html,&amp;amp;amp;lt;script&amp;amp;amp;gt;alert(&amp;amp;amp;quot;XSS&amp;amp;amp;quot;)&amp;amp;amp;lt;/script&amp;amp;amp;gt;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with mixed encoding types', () => {
      const malicious = 'data:text/html,&#60;script&gt;alert("XSS")&lt;/script&#x3E;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with invalid character references', () => {
      const malicious = 'data:text/html,&invalid;script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with incomplete character references', () => {
      const malicious = 'data:text/html,&ltscript&gt;alert("XSS")&lt;/script&gt;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with malformed character references', () => {
      const malicious = 'data:text/html,&lt;script&gtalert("XSS")&lt;/script&gt;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with overflow character references', () => {
      const malicious = 'data:text/html,&lt;script&gt;alert("XSS")&lt;/script&gt;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with Unicode character references', () => {
      const malicious = 'data:text/html,&lt;script&gt;alert("XSS")&lt;/script&gt;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with surrogate pairs', () => {
      const malicious = 'data:text/html,&lt;script&gt;alert("XSS")&lt;/script&gt;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with combining characters', () => {
      const malicious = 'data:text/html,&lt;script&gt;alert("XSS")&lt;/script&gt;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with normalization forms', () => {
      const malicious = 'data:text/html,&lt;script&gt;alert("XSS")&lt;/script&gt;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with case sensitivity', () => {
      const malicious = 'DATA:TEXT/HTML,<SCRIPT>ALERT("XSS")</SCRIPT>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with mixed case', () => {
      const malicious = 'DaTa:TeXt/HtMl,<ScRiPt>AlErT("XSS")</sCrIpT>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with random case', () => {
      const malicious = 'dAtA:tExT/hTmL,<sCrIpT>aLeRt("XSS")</ScRiPt>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with alternating case', () => {
      const malicious = 'DaTa:TeXt/HtMl,&Lt;ScRiPt&Gt;AlErT(&QuOt;XSS&QuOt;)&Lt;/sCrIpT&Gt;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with uppercase', () => {
      const malicious = 'DATA:TEXT/HTML,&LT;SCRIPT&GT;ALERT(&QUOT;XSS&QUOT;)&LT;/SCRIPT&GT;';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with lowercase', () => {
      const malicious = 'data:text/html,<script>alert("xss")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with title case', () => {
      const malicious = 'Data:Text/Html,<Script>Alert("Xss")</Script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with sentence case', () => {
      const malicious = 'Data: text/html, <script>alert("Xss")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with camel case', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with pascal case', () => {
      const malicious = 'Data:Text/Html,<Script>Alert("Xss")</Script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with snake case', () => {
      const malicious = 'data:text/html,<script>alert("xss")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with kebab case', () => {
      const malicious = 'data:text/html,<script>alert("xss")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with dot notation', () => {
      const malicious = 'data.text/html,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with comma notation', () => {
      const malicious = 'data,text/html,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with semicolon notation', () => {
      const malicious = 'data;text/html,<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with pipe notation', () => {
      const malicious = 'data|text/html|<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with backslash notation', () => {
      const malicious = 'data\\text/html\\<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with forward slash notation', () => {
      const malicious = 'data/text/html/<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with double colon notation', () => {
      const malicious = 'data::text/html::<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with triple colon notation', () => {
      const malicious = 'data:::text/html:::<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with multiple colons', () => {
      const malicious = 'data::::text/html::::<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with no colon', () => {
      const malicious = 'datatext/html<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with extra colon', () => {
      const malicious = 'data::text/html:<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with missing colon', () => {
      const malicious = 'datatext/html<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with wrong colon position', () => {
      const malicious = 'datatext:html<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with multiple wrong colons', () => {
      const malicious = 'datatext:html:<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in wrong place', () => {
      const malicious = 'datatext:html<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in content', () => {
      const malicious = 'data:text/html,<script>alert("XSS:test")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in script', () => {
      const malicious = 'data:text/html,<script>alert("XSS"):test()</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in URL', () => {
      const malicious = 'data:text/html,<script>window.location="http:test"</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in protocol', () => {
      const malicious = 'data:text/html,<script>window.location.protocol="http:"</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in port', () => {
      const malicious = 'data:text/html,<script>window.location.port=":8080"</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in hostname', () => {
      const malicious = 'data:text/html,<script>window.location.hostname="test:8080"</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in pathname', () => {
      const malicious = 'data:text/html,<script>window.location.pathname="/test:path"</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in search', () => {
      const malicious = 'data:text/html,<script>window.location.search="?test:path"</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in hash', () => {
      const malicious = 'data:text/html,<script>window.location.hash="#test:path"</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in username', () => {
      const malicious = 'data:text/html,<script>window.location.username="test:pass"</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in password', () => {
      const malicious = 'data:text/html,<script>window.location.password="pass:word"</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in origin', () => {
      const malicious = 'data:text/html,<script>window.location.origin="http://test:8080"</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in href', () => {
      const malicious = 'data:text/html,<script>window.location.href="http://test:8080/path"</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in data', () => {
      const malicious = 'data:text/html,<script>var data="test:value";</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in variable', () => {
      const malicious = 'data:text/html,<script>var test:value="data";</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in function', () => {
      const malicious = 'data:text/html,<script>function test:value(){}</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in object', () => {
      const malicious = 'data:text/html,<script>var obj={test:value};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in array', () => {
      const malicious = 'data:text/html,<script>var arr=[test:value];</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in regex', () => {
      const malicious = 'data:text/html,<script>var regex=/test:value/;</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in string', () => {
      const malicious = 'data:text/html,<script>var str="test:value";</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in comment', () => {
      const malicious = 'data:text/html,<script>// test:value</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in template literal', () => {
      const malicious = 'data:text/html,<script>var str=`test:value`;</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in template expression', () => {
      const malicious = 'data:text/html,<script>var str=`test${":value"}`;</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON', () => {
      const malicious = 'data:text/html,<script>var json={"test":"value"};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON key', () => {
      const malicious = 'data:text/html,<script>var json={"test:key":"value"};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON value', () => {
      const malicious = 'data:text/html,<script>var json={"test":"key:value"};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON string', () => {
      const malicious = 'data:text/html,<script>var json=JSON.parse(&apos;{"test":"key:value"}&apos;);</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON number', () => {
      const malicious = 'data:text/html,<script>var json={"test":123.456};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON boolean', () => {
      const malicious = 'data:text/html,<script>var json={"test":true};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON null', () => {
      const malicious = 'data:text/html,<script>var json={"test":null};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON array', () => {
      const malicious = 'data:text/html,<script>var json=["test:value"];</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON object', () => {
      const malicious = 'data:text/html,<script>var json={"test":{"key":"value"}};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON nested', () => {
      const malicious = 'data:text/html,<script>var json={"test":{"key":{"nested":"value"}}};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON complex', () => {
      const malicious = 'data:text/html,<script>var json={"test":[{"key":"value"},{"nested":{"deep":"value"}}]};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON escaped', () => {
      const malicious = 'data:text/html,<script>var json=JSON.parse(&apos;{"test":"key\\:value"}&apos;);</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON unicode', () => {
      const malicious = 'data:text/html,<script>var json={"test":"key\\u003Avalue"};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON hex', () => {
      const malicious = 'data:text/html,<script>var json={"test":"key\\x3Avalue"};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON octal', () => {
      const malicious = 'data:text/html,<script>var json={"test":"key\\72value"};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON binary', () => {
      const malicious = 'data:text/html,<script>var json={"test":"key\\b00111010value"};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON mixed', () => {
      const malicious = 'data:text/html,<script>var json={"test":"key\\u003A\\x3A\\72value"};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON multiple', () => {
      const malicious = 'data:text/html,<script>var json={"test":"key:value:more:values"};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON nested escaped', () => {
      const malicious = 'data:text/html,<script>var json={"test":{"key":"value\\:nested"}};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON array escaped', () => {
      const malicious = 'data:text/html,<script>var json=["key\\:value","test\\:more"];</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON complex escaped', () => {
      const malicious = 'data:text/html,<script>var json={"test":[{"key":"value\\:nested"},{"deep":{"more":"data\\:here"}}]};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON recursive', () => {
      const malicious = 'data:text/html,<script>var json={"test":{"key":{"nested":{"deep":{"value":"data\\:here"}}}}};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON circular', () => {
      const malicious = 'data:text/html,<script>var obj={};obj.test=obj;var json={"obj":obj,"key":"value"};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON function', () => {
      const malicious = 'data:text/html,<script>var json={"test":function(){return "key:value"}};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON date', () => {
      const malicious = 'data:text/html,<script>var json={"test":new Date("key:value")};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON regex', () => {
      const malicious = 'data:text/html,<script>var json={"test":/key:value/};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON error', () => {
      const malicious = 'data:text/html,<script>var json={"test":new Error("key:value")};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON symbol', () => {
      const malicious = 'data:text/html,<script>var json={"test":Symbol("key:value")};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON map', () => {
      const malicious = 'data:text/html,<script>var json={"test":new Map([["key","value"]])};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON set', () => {
      const malicious = 'data:text/html,<script>var json={"test":new Set(["key:value"])};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON weakmap', () => {
      const malicious = 'data:text/html,<script>var json={"test":new WeakMap()};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON weakset', () => {
      const malicious = 'data:text/html,<script>var json={"test":new WeakSet()};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON arraybuffer', () => {
      const malicious = 'data:text/html,<script>var json={"test":new ArrayBuffer(8)};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON dataview', () => {
      const malicious = 'data:text/html,<script>var json={"test":new DataView(new ArrayBuffer(8))};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON typedarray', () => {
      const malicious = 'data:text/html,<script>var json={"test":new Int8Array([1,2,3])};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON promise', () => {
      const malicious = 'data:text/html,<script>var json={"test":Promise.resolve("key:value")};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON generator', () => {
      const malicious = 'data:text/html,<script>var json={"test":function*(){yield "key:value"}};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON async', () => {
      const malicious = 'data:text/html,<script>var json={"test":async function(){return "key:value"}};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON class', () => {
      const malicious = 'data:text/html,<script>var json={"test":class{constructor(){this.key="value"}}}</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON proxy', () => {
      const malicious = 'data:text/html,<script>var json={"test":new Proxy({},{})};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should handle data URI with colon in JSON reflect', () => {
      const malicious = 'data:text/html,<script>var json={"test":Reflect.get({key:"value"},"key")};</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('data:');
    });
  });
});