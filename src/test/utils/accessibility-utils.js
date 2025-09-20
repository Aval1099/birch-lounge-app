/**
 * Accessibility Testing Utilities
 * Provides tools for testing accessibility compliance in the Birch Lounge app
 */

import { axe, configureAxe } from 'jest-axe';

/**
 * Configure axe for consistent accessibility testing
 */
const axeConfig = {
  rules: {
    // Disable color contrast checking in tests (can be environment dependent)
    'color-contrast': { enabled: false },
    // Enable important accessibility rules
    'aria-allowed-attr': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'button-name': { enabled: true },
    'bypass': { enabled: true },
    'focus-order-semantics': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'frame-title': { enabled: true },
    'html-has-lang': { enabled: true },
    'html-lang-valid': { enabled: true },
    'image-alt': { enabled: true },
    'input-image-alt': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'label': { enabled: true },
    'landmark-banner-is-top-level': { enabled: true },
    'landmark-main-is-top-level': { enabled: true },
    'landmark-no-duplicate-banner': { enabled: true },
    'landmark-no-duplicate-contentinfo': { enabled: true },
    'landmark-one-main': { enabled: true },
    'link-name': { enabled: true },
    'list': { enabled: true },
    'listitem': { enabled: true },
    'meta-refresh': { enabled: true },
    'meta-viewport': { enabled: true },
    'page-has-heading-one': { enabled: true },
    'region': { enabled: true },
    'scope-attr-valid': { enabled: true },
    'server-side-image-map': { enabled: true },
    'tabindex': { enabled: true },
    'table-fake-caption': { enabled: true },
    'td-headers-attr': { enabled: true },
    'th-has-data-cells': { enabled: true },
    'valid-lang': { enabled: true },
    'video-caption': { enabled: true }
  }
};

configureAxe(axeConfig);

/**
 * Test accessibility of a rendered component
 * @param {HTMLElement} container - The container element to test
 * @param {Object} options - Additional axe options
 * @returns {Promise<Object>} Axe results
 */
export const testAccessibility = async (container, options = {}) => {
  const results = await axe(container, {
    ...axeConfig,
    ...options
  });
  return results;
};

/**
 * Assert that a component has no accessibility violations
 * @param {HTMLElement} container - The container element to test
 * @param {Object} options - Additional axe options
 */
export const expectNoA11yViolations = async (container, options = {}) => {
  const results = await testAccessibility(container, options);
  expect(results).toHaveNoViolations();
};

/**
 * Test keyboard navigation for a component
 * @param {HTMLElement} container - The container element
 * @param {Array} expectedFocusOrder - Expected order of focusable elements
 * @returns {Object} Keyboard navigation test results
 */
export const testKeyboardNavigation = (container, expectedFocusOrder = []) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const results = {
    focusableCount: focusableElements.length,
    focusableElements: Array.from(focusableElements),
    tabIndexIssues: [],
    ariaIssues: []
  };

  // Check for proper tab indices
  focusableElements.forEach((element, index) => {
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex && parseInt(tabIndex) > 0) {
      results.tabIndexIssues.push({
        element,
        tabIndex,
        message: 'Positive tabindex values should be avoided'
      });
    }
  });

  // Check for ARIA labels on interactive elements
  focusableElements.forEach(element => {
    const hasAriaLabel = element.hasAttribute('aria-label');
    const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
    const hasVisibleText = element.textContent.trim().length > 0;
    const isInput = element.tagName.toLowerCase() === 'input';
    const hasAssociatedLabel = isInput && document.querySelector(`label[for="${element.id}"]`);

    if (!hasAriaLabel && !hasAriaLabelledBy && !hasVisibleText && !hasAssociatedLabel) {
      results.ariaIssues.push({
        element,
        message: 'Interactive element lacks accessible name'
      });
    }
  });

  return results;
};

/**
 * Test color contrast (basic implementation)
 * @param {HTMLElement} element - Element to test
 * @returns {Object} Color contrast information
 */
export const testColorContrast = (element) => {
  const computedStyle = window.getComputedStyle(element);
  const color = computedStyle.color;
  const backgroundColor = computedStyle.backgroundColor;

  return {
    color,
    backgroundColor,
    element: element.tagName,
    // Note: Actual contrast calculation would require more complex color parsing
    // This is a simplified version for testing structure
    hasContrast: color !== backgroundColor
  };
};

/**
 * Test touch target sizes for mobile accessibility
 * @param {HTMLElement} container - Container to test
 * @param {number} minSize - Minimum touch target size (default 44px)
 * @returns {Object} Touch target test results
 */
export const testTouchTargets = (container, minSize = 44) => {
  const interactiveElements = container.querySelectorAll(
    'button, [role="button"], a, input, select, textarea, [onclick]'
  );

  const results = {
    totalElements: interactiveElements.length,
    violations: [],
    compliant: []
  };

  interactiveElements.forEach(element => {
    const rect = element.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (width < minSize || height < minSize) {
      results.violations.push({
        element,
        width,
        height,
        minSize,
        message: `Touch target too small: ${width}x${height}px (minimum: ${minSize}px)`
      });
    } else {
      results.compliant.push({
        element,
        width,
        height
      });
    }
  });

  return results;
};

/**
 * Test semantic HTML structure
 * @param {HTMLElement} container - Container to test
 * @returns {Object} Semantic structure test results
 */
export const testSemanticStructure = (container) => {
  const results = {
    headings: [],
    landmarks: [],
    lists: [],
    issues: []
  };

  // Check heading hierarchy
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;

  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));
    results.headings.push({ element: heading, level, text: heading.textContent });

    if (level > previousLevel + 1) {
      results.issues.push({
        type: 'heading-hierarchy',
        element: heading,
        message: `Heading level ${level} skips level ${previousLevel + 1}`
      });
    }
    previousLevel = level;
  });

  // Check landmarks
  const landmarks = container.querySelectorAll(
    'main, nav, aside, section, article, header, footer, [role="main"], [role="navigation"], [role="complementary"], [role="banner"], [role="contentinfo"]'
  );
  results.landmarks = Array.from(landmarks).map(landmark => ({
    element: landmark,
    role: landmark.getAttribute('role') || landmark.tagName.toLowerCase()
  }));

  // Check lists
  const lists = container.querySelectorAll('ul, ol, dl');
  results.lists = Array.from(lists).map(list => ({
    element: list,
    type: list.tagName.toLowerCase(),
    itemCount: list.children.length
  }));

  return results;
};

/**
 * Accessibility test suite for components
 * @param {HTMLElement} container - Container to test
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Complete accessibility test results
 */
export const runA11yTestSuite = async (container, options = {}) => {
  const results = {
    axe: await testAccessibility(container, options.axe),
    keyboard: testKeyboardNavigation(container, options.expectedFocusOrder),
    touchTargets: testTouchTargets(container, options.minTouchSize),
    semantics: testSemanticStructure(container),
    timestamp: new Date().toISOString()
  };

  return results;
};
