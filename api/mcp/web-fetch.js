import { mcpWebFetchService } from '../../server/mcpWebFetchService.js';

const METHOD_NOT_ALLOWED = 'Method not allowed';

const readRequestBody = async (req) => {
  if (req.body) {
    if (typeof req.body === 'string') {
      return JSON.parse(req.body || '{}');
    }
    return req.body;
  }

  return new Promise((resolve, reject) => {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
};

const createResponse = (res, status, payload) => {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    createResponse(res, 405, { success: false, error: METHOD_NOT_ALLOWED });
    return;
  }

  try {
    const body = await readRequestBody(req);
    const { action, payload = {} } = body || {};

    switch (action) {
      case 'initialize': {
        const initialized = await mcpWebFetchService.initialize();
        createResponse(res, 200, {
          success: initialized,
          data: { connected: initialized }
        });
        return;
      }

      case 'fetchRecipe': {
        const { url } = payload;
        if (!url) {
          createResponse(res, 400, { success: false, error: 'Missing url parameter' });
          return;
        }

        const recipe = await mcpWebFetchService.fetchRecipe(url);
        createResponse(res, 200, { success: true, data: recipe });
        return;
      }

      case 'batchFetchRecipes': {
        const { urls = [] } = payload;
        if (!Array.isArray(urls) || urls.length === 0) {
          createResponse(res, 400, { success: false, error: 'urls must be a non-empty array' });
          return;
        }

        const result = await mcpWebFetchService.batchFetchRecipes(urls);
        createResponse(res, 200, { success: true, data: result });
        return;
      }

      case 'searchRecipes': {
        const { query, domain = null } = payload;
        if (!query) {
          createResponse(res, 400, { success: false, error: 'Missing query parameter' });
          return;
        }

        const results = await mcpWebFetchService.searchRecipes(query, domain);
        createResponse(res, 200, { success: true, data: results });
        return;
      }

      case 'disconnect': {
        await mcpWebFetchService.disconnect();
        createResponse(res, 200, { success: true, data: { disconnected: true } });
        return;
      }

      default: {
        createResponse(res, 400, { success: false, error: 'Unknown action' });
      }
    }
  } catch (error) {
    console.error('MCP web fetch API error:', error);
    createResponse(res, 500, {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
