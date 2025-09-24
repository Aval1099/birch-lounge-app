/**
 * MCP GitHub Service for Recipe Version Control and Collaboration
 * Integrates with GitHub MCP server for recipe versioning and team collaboration
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { apiKeyService } from './apiKeyService.js';

class MCPGitHubService {
  constructor() {
    this.client = null;
    this.transport = null;
    this.isConnected = false;

    // WARNING: VITE_ environment variables are exposed to client-side code
    // For production, consider using a backend proxy for sensitive operations
    this.repoConfig = {
      owner: process.env.VITE_GITHUB_OWNER || 'your-username',
      repo: process.env.VITE_GITHUB_RECIPES_REPO || 'birch-lounge-recipes',
      branch: 'main'
    };

    // Log security warning in development
    if (process.env.NODE_ENV === 'development' && process.env.VITE_GITHUB_TOKEN) {
      console.warn('⚠️ GitHub token exposed to client-side. Consider using a backend proxy for production.');
    }
  }

  /**
   * Initialize MCP GitHub connection
   */
  async initialize() {
    try {
      const githubToken = apiKeyService.getApiKey('github') || process.env.VITE_GITHUB_TOKEN;

      if (!githubToken) {
        throw new Error('GitHub token not found. Please configure in settings.');
      }

      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['@github/github-mcp-server'],
        env: {
          ...process.env,
          GITHUB_TOKEN: githubToken
        }
      });

      this.client = new Client({
        name: 'birch-lounge-github',
        version: '1.0.0'
      }, {
        capabilities: {
          tools: {}
        }
      });

      await this.client.connect(this.transport);
      this.isConnected = true;

      // Initialize repository structure if needed
      await this.initializeRepository();

      console.warn('MCP GitHub Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MCP GitHub Service:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Initialize repository structure for recipe management
   */
  async initializeRepository() {
    try {
      // Check if repository exists
      const repoExists = await this.checkRepositoryExists();

      if (!repoExists) {
        await this.createRepository();
      }

      // Ensure proper directory structure
      await this.ensureDirectoryStructure();

    } catch (error) {
      console.error('Error initializing repository:', error);
    }
  }

  /**
   * Check if repository exists
   * @returns {Promise<boolean>} Repository exists
   */
  async checkRepositoryExists() {
    try {
      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'get_repository',
          arguments: {
            owner: this.repoConfig.owner,
            repo: this.repoConfig.repo
          }
        }
      });

      return !!response.id;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create repository for recipe management
   */
  async createRepository() {
    try {
      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'create_repository',
          arguments: {
            name: this.repoConfig.repo,
            description: 'Birch Lounge Recipe Collection - Version controlled cocktail recipes',
            private: false,
            auto_init: true,
            gitignore_template: 'Node'
          }
        }
      });

      console.warn('Repository created successfully:', response.html_url);
    } catch (error) {
      console.error('Error creating repository:', error);
      throw error;
    }
  }

  /**
   * Ensure proper directory structure in repository
   */
  async ensureDirectoryStructure() {
    const directories = [
      'recipes/cocktails',
      'recipes/mocktails',
      'recipes/shots',
      'recipes/punches',
      'ingredients',
      'menus',
      'techniques',
      'training',
      'exports'
    ];

    for (const dir of directories) {
      await this.ensureDirectory(dir);
    }
  }

  /**
   * Ensure directory exists in repository
   * @param {string} path - Directory path
   */
  async ensureDirectory(path) {
    try {
      // Check if directory exists by looking for any file in it
      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'get_repository_content',
          arguments: {
            owner: this.repoConfig.owner,
            repo: this.repoConfig.repo,
            path
          }
        }
      });

      // Directory exists if we get content
      if (response.length > 0) return;

    } catch (error) {
      // Directory doesn't exist, create it with a .gitkeep file
      await this.createFile(`${path}/.gitkeep`, '', `Initialize ${path} directory`);
    }
  }

  /**
   * Save recipe to GitHub
   * @param {Object} recipe - Recipe to save
   * @param {Object} options - Save options
   * @returns {Promise<Object>} Commit information
   */
  async saveRecipeToGitHub(recipe, options = {}) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const filePath = this.getRecipeFilePath(recipe);
      const content = this.formatRecipeForGitHub(recipe);
      const commitMessage = options.commitMessage || `${options.isUpdate ? 'Update' : 'Add'} recipe: ${recipe.name}`;

      // Check if file exists
      const existingFile = await this.getFile(filePath);

      if (existingFile) {
        // Update existing file
        return await this.updateFile(filePath, content, commitMessage, existingFile.sha);
      } else {
        // Create new file
        return await this.createFile(filePath, content, commitMessage);
      }
    } catch (error) {
      console.error('Error saving recipe to GitHub:', error);
      throw error;
    }
  }

  /**
   * Get recipe file path
   * @param {Object} recipe - Recipe object
   * @returns {string} File path
   */
  getRecipeFilePath(recipe) {
    const category = recipe.category?.toLowerCase() || 'cocktails';
    const fileName = recipe.name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');

    return `recipes/${category}s/${fileName}.md`;
  }

  /**
   * Format recipe for GitHub (Markdown)
   * @param {Object} recipe - Recipe object
   * @returns {string} Formatted recipe content
   */
  formatRecipeForGitHub(recipe) {
    let content = `# ${recipe.name}\n\n`;

    // Metadata
    content += `## Recipe Information\n\n`;
    content += `- **Category**: ${recipe.category || 'Cocktail'}\n`;
    content += `- **Flavor Profile**: ${recipe.flavorProfile || 'Balanced'}\n`;
    content += `- **Alcohol Content**: ${recipe.alcoholContent || 'Alcoholic'}\n`;
    content += `- **Servings**: ${recipe.servings || 1}\n`;

    if (recipe.prepTime) {
      content += `- **Prep Time**: ${recipe.prepTime} minutes\n`;
    }

    if (recipe.glassType) {
      content += `- **Glass**: ${recipe.glassType}\n`;
    }

    content += `\n`;

    // Ingredients
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      content += `## Ingredients\n\n`;
      recipe.ingredients.forEach(ingredient => {
        content += `- ${ingredient.amount} ${ingredient.unit} ${ingredient.name}\n`;
      });
      content += `\n`;
    }

    // Instructions
    if (recipe.instructions) {
      content += `## Instructions\n\n`;
      content += `${recipe.instructions}\n\n`;
    }

    // Garnish
    if (recipe.garnish) {
      content += `## Garnish\n\n`;
      content += `${recipe.garnish}\n\n`;
    }

    // Notes
    if (recipe.notes) {
      content += `## Notes\n\n`;
      content += `${recipe.notes}\n\n`;
    }

    // Tags
    if (recipe.tags && recipe.tags.length > 0) {
      content += `## Tags\n\n`;
      content += `${recipe.tags.map(tag => `\`${tag}\``).join(', ')}\n\n`;
    }

    // Source
    if (recipe.source) {
      content += `## Source\n\n`;
      content += `${recipe.source}\n\n`;
    }

    // Metadata footer
    content += `---\n\n`;
    content += `*Recipe managed by Birch Lounge*\n`;
    content += `*Created: ${recipe.createdAt || new Date().toISOString()}*\n`;
    content += `*Last Updated: ${new Date().toISOString()}*\n`;

    return content;
  }

  /**
   * Get file from repository
   * @param {string} path - File path
   * @returns {Promise<Object|null>} File content and metadata
   */
  async getFile(path) {
    try {
      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'get_file_content',
          arguments: {
            owner: this.repoConfig.owner,
            repo: this.repoConfig.repo,
            path,
            ref: this.repoConfig.branch
          }
        }
      });

      return response;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create file in repository
   * @param {string} path - File path
   * @param {string} content - File content
   * @param {string} message - Commit message
   * @returns {Promise<Object>} Commit information
   */
  async createFile(path, content, message) {
    try {
      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'create_file',
          arguments: {
            owner: this.repoConfig.owner,
            repo: this.repoConfig.repo,
            path,
            message,
            content: Buffer.from(content).toString('base64'),
            branch: this.repoConfig.branch
          }
        }
      });

      return response.commit;
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  }

  /**
   * Update file in repository
   * @param {string} path - File path
   * @param {string} content - File content
   * @param {string} message - Commit message
   * @param {string} sha - File SHA
   * @returns {Promise<Object>} Commit information
   */
  async updateFile(path, content, message, sha) {
    try {
      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'update_file',
          arguments: {
            owner: this.repoConfig.owner,
            repo: this.repoConfig.repo,
            path,
            message,
            content: Buffer.from(content).toString('base64'),
            sha,
            branch: this.repoConfig.branch
          }
        }
      });

      return response.commit;
    } catch (error) {
      console.error('Error updating file:', error);
      throw error;
    }
  }

  /**
   * Get recipe history from GitHub
   * @param {string} recipeName - Recipe name
   * @returns {Promise<Object[]>} Recipe commit history
   */
  async getRecipeHistory(recipeName) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const filePath = this.getRecipeFilePath({ name: recipeName });

      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'get_commits',
          arguments: {
            owner: this.repoConfig.owner,
            repo: this.repoConfig.repo,
            path: filePath,
            per_page: 20
          }
        }
      });

      return response.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        url: commit.html_url
      }));
    } catch (error) {
      console.error('Error getting recipe history:', error);
      return [];
    }
  }

  /**
   * Save recipe version to GitHub with version metadata
   * @param {Object} recipe - Recipe with version metadata
   * @param {Object} options - Save options
   * @returns {Promise<Object>} GitHub response
   */
  async saveRecipeVersion(recipe, options = {}) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      // Create version-specific file path
      const versionPath = this.getVersionFilePath(recipe);
      const content = this.formatRecipeVersionForGitHub(recipe);

      const commitMessage = options.commitMessage ||
        `${options.isUpdate ? 'Update' : 'Create'} ${recipe.name} v${recipe.versionMetadata.versionNumber}`;

      // Check if version file exists
      const existingFile = await this.getFile(versionPath);

      if (existingFile) {
        return await this.updateFile(versionPath, content, commitMessage, existingFile.sha);
      } else {
        return await this.createFile(versionPath, content, commitMessage);
      }
    } catch (error) {
      console.error('Error saving recipe version to GitHub:', error);
      throw error;
    }
  }

  /**
   * Get version-specific file path
   * @param {Object} recipe - Recipe with version metadata
   * @returns {string} Version file path
   */
  getVersionFilePath(recipe) {
    const baseName = this.sanitizeFileName(recipe.name);
    const versionNumber = recipe.versionMetadata.versionNumber.replace(/\./g, '_');
    return `recipes/versions/${baseName}_v${versionNumber}.json`;
  }

  /**
   * Format recipe version for GitHub storage
   * @param {Object} recipe - Recipe with version metadata
   * @returns {string} Formatted JSON content
   */
  formatRecipeVersionForGitHub(recipe) {
    const versionData = {
      ...recipe,
      githubMetadata: {
        savedAt: new Date().toISOString(),
        version: '1.0',
        format: 'birch-lounge-version'
      }
    };

    return JSON.stringify(versionData, null, 2);
  }

  /**
   * Get all versions of a recipe family from GitHub
   * @param {string} recipeFamily - Recipe family ID
   * @returns {Promise<Object[]>} Array of recipe versions
   */
  async getRecipeVersionsFromGitHub(recipeFamily) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      // Get all files in the versions directory
      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'get_contents',
          arguments: {
            owner: this.repoConfig.owner,
            repo: this.repoConfig.repo,
            path: 'recipes/versions'
          }
        }
      });

      const versionFiles = response.filter(file =>
        file.name.includes(this.sanitizeFileName(recipeFamily)) &&
        file.name.endsWith('.json')
      );

      const versions = [];
      for (const file of versionFiles) {
        try {
          const content = await this.getFile(file.path);
          const versionData = JSON.parse(atob(content.content));
          versions.push(versionData);
        } catch (error) {
          console.error(`Error loading version file ${file.path}:`, error);
        }
      }

      return versions.sort((a, b) =>
        a.versionMetadata.versionNumber.localeCompare(
          b.versionMetadata.versionNumber,
          undefined,
          { numeric: true }
        )
      );
    } catch (error) {
      console.error('Error getting recipe versions from GitHub:', error);
      return [];
    }
  }

  /**
   * Create version branch in GitHub
   * @param {Object} baseRecipe - Base recipe
   * @param {Object} versionData - Version metadata
   * @returns {Promise<string>} Branch name
   */
  async createVersionBranch(baseRecipe, versionData) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const branchName = `version/${this.sanitizeFileName(baseRecipe.name)}-v${versionData.versionNumber}`;

      // Get the main branch SHA
      const mainBranch = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'get_branch',
          arguments: {
            owner: this.repoConfig.owner,
            repo: this.repoConfig.repo,
            branch: 'main'
          }
        }
      });

      // Create new branch
      await this.client.request({
        method: 'tools/call',
        params: {
          name: 'create_ref',
          arguments: {
            owner: this.repoConfig.owner,
            repo: this.repoConfig.repo,
            ref: `refs/heads/${branchName}`,
            sha: mainBranch.commit.sha
          }
        }
      });

      return branchName;
    } catch (error) {
      console.error('Error creating version branch:', error);
      throw error;
    }
  }

  /**
   * Sync version history with GitHub commits
   * @param {string} recipeFamily - Recipe family ID
   * @returns {Promise<Object[]>} Synchronized version history
   */
  async syncVersionHistory(recipeFamily) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      // Get commits for all version files of this recipe family
      const commits = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'get_commits',
          arguments: {
            owner: this.repoConfig.owner,
            repo: this.repoConfig.repo,
            path: `recipes/versions`,
            per_page: 50
          }
        }
      });

      // Filter commits related to this recipe family
      const familyCommits = commits.filter(commit =>
        commit.commit.message.toLowerCase().includes(recipeFamily.toLowerCase())
      );

      return familyCommits.map(commit => ({
        id: commit.sha,
        recipeId: recipeFamily,
        versionId: this.extractVersionFromCommit(commit),
        action: this.determineActionFromCommit(commit),
        timestamp: new Date(commit.commit.author.date).getTime(),
        userId: commit.commit.author.name,
        changes: [commit.commit.message],
        metadata: {
          githubSha: commit.sha,
          githubUrl: commit.html_url,
          committer: commit.commit.committer.name
        }
      }));
    } catch (error) {
      console.error('Error syncing version history:', error);
      return [];
    }
  }

  /**
   * Extract version ID from commit message
   * @param {Object} commit - GitHub commit object
   * @returns {string} Version ID
   */
  extractVersionFromCommit(commit) {
    const versionMatch = commit.commit.message.match(/v(\d+\.\d+(?:\.\d+)?)/);
    return versionMatch ? versionMatch[1] : 'unknown';
  }

  /**
   * Determine action type from commit message
   * @param {Object} commit - GitHub commit object
   * @returns {string} Action type
   */
  determineActionFromCommit(commit) {
    const message = commit.commit.message.toLowerCase();

    if (message.includes('create') || message.includes('add')) return 'created';
    if (message.includes('update') || message.includes('modify')) return 'modified';
    if (message.includes('publish')) return 'published';
    if (message.includes('archive')) return 'archived';
    if (message.includes('branch')) return 'branched';
    if (message.includes('merge')) return 'merged';

    return 'modified';
  }

  /**
   * Create pull request for recipe changes
   * @param {Object} options - PR options
   * @returns {Promise<Object>} Pull request information
   */
  async createRecipePullRequest(options) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'create_pull_request',
          arguments: {
            owner: this.repoConfig.owner,
            repo: this.repoConfig.repo,
            title: options.title,
            body: options.description,
            head: options.branch,
            base: this.repoConfig.branch
          }
        }
      });

      return response;
    } catch (error) {
      console.error('Error creating pull request:', error);
      throw error;
    }
  }

  /**
   * Export all recipes to GitHub
   * @param {Object[]} recipes - Recipes to export
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export results
   */
  async exportAllRecipesToGitHub(recipes, _options = {}) {
    if (!this.isConnected) {
      await this.initialize();
    }

    const results = {
      successful: [],
      failed: [],
      summary: {
        total: recipes.length,
        exported: 0,
        failed: 0
      }
    };

    for (const recipe of recipes) {
      try {
        const commit = await this.saveRecipeToGitHub(recipe, {
          commitMessage: `Bulk export: ${recipe.name}`,
          isUpdate: false
        });

        results.successful.push({
          recipe: recipe.name,
          commit
        });
        results.summary.exported++;

        // Rate limiting - wait 1 second between commits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.failed.push({
          recipe: recipe.name,
          error: error.message
        });
        results.summary.failed++;
      }
    }

    return results;
  }

  /**
   * Get repository statistics
   * @returns {Promise<Object>} Repository statistics
   */
  async getRepositoryStats() {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const [repoInfo, commits, contributors] = await Promise.all([
        this.client.request({
          method: 'tools/call',
          params: {
            name: 'get_repository',
            arguments: {
              owner: this.repoConfig.owner,
              repo: this.repoConfig.repo
            }
          }
        }),
        this.client.request({
          method: 'tools/call',
          params: {
            name: 'get_commits',
            arguments: {
              owner: this.repoConfig.owner,
              repo: this.repoConfig.repo,
              per_page: 100
            }
          }
        }),
        this.client.request({
          method: 'tools/call',
          params: {
            name: 'get_contributors',
            arguments: {
              owner: this.repoConfig.owner,
              repo: this.repoConfig.repo
            }
          }
        })
      ]);

      return {
        repository: {
          name: repoInfo.name,
          description: repoInfo.description,
          url: repoInfo.html_url,
          stars: repoInfo.stargazers_count,
          forks: repoInfo.forks_count,
          size: repoInfo.size,
          created: repoInfo.created_at,
          updated: repoInfo.updated_at
        },
        activity: {
          totalCommits: commits.length,
          recentCommits: commits.slice(0, 10),
          contributors: contributors.length
        }
      };
    } catch (error) {
      console.error('Error getting repository stats:', error);
      return null;
    }
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.close();
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const mcpGitHubService = new MCPGitHubService();
