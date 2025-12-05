/**
 * Configuration Loader
 * Loads and merges rule engine configuration from multiple sources
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { RuleEngineConfig, Severity } from './types';

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConfigLoader {
  private static readonly PROJECT_CONFIG_PATH = '.repoforge/rules.json';
  private static readonly GLOBAL_CONFIG_PATH = path.join(os.homedir(), '.repoforge', 'rules.json');

  /**
   * Load configuration with precedence:
   * 1. Default configuration (hardcoded)
   * 2. Global config (~/.repoforge/rules.json)
   * 3. Project config (.repoforge/rules.json)
   * 4. CLI flags (passed as parameter)
   */
  static loadConfig(
    projectRoot: string,
    cliOverrides?: Partial<RuleEngineConfig>
  ): RuleEngineConfig {
    // Start with defaults
    const config: RuleEngineConfig = this.getDefaultConfig();

    // Load and merge global config
    const globalConfig = this.loadConfigFile(this.GLOBAL_CONFIG_PATH);
    if (globalConfig) {
      this.mergeConfig(config, globalConfig);
    }

    // Load and merge project config
    const projectConfigPath = path.join(projectRoot, this.PROJECT_CONFIG_PATH);
    const projectConfig = this.loadConfigFile(projectConfigPath);
    if (projectConfig) {
      this.mergeConfig(config, projectConfig);
    }

    // Apply CLI overrides (highest precedence)
    if (cliOverrides) {
      this.mergeConfig(config, cliOverrides);
    }

    return config;
  }

  /**
   * Get default configuration
   */
  private static getDefaultConfig(): RuleEngineConfig {
    return {
      minSeverity: undefined, // Report all severities by default
      disabledRules: [],
      customRules: [],
      failOnSeverity: undefined, // Don't fail by default
      parallel: true,
      maxFiles: undefined // No limit by default
    };
  }

  /**
   * Load configuration from a file
   */
  private static loadConfigFile(filePath: string): Partial<RuleEngineConfig> | null {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const config = JSON.parse(content);

      // Validate the loaded config
      const validation = this.validateConfig(config);
      
      // Log warnings but continue
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          console.warn(`Warning in ${filePath}: ${warning}`);
        });
      }

      // If invalid, log errors and return null
      if (!validation.valid) {
        validation.errors.forEach(error => {
          console.error(`Error in ${filePath}: ${error}`);
        });
        return null;
      }

      return config;
    } catch (error) {
      console.error(`Failed to load config from ${filePath}:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * Merge source config into target config
   * Source values override target values
   */
  private static mergeConfig(
    target: RuleEngineConfig,
    source: Partial<RuleEngineConfig>
  ): void {
    if (source.minSeverity !== undefined) {
      target.minSeverity = source.minSeverity;
    }

    if (source.failOnSeverity !== undefined) {
      target.failOnSeverity = source.failOnSeverity;
    }

    if (source.disabledRules !== undefined) {
      // Replace, don't merge arrays
      target.disabledRules = [...source.disabledRules];
    }

    if (source.customRules !== undefined) {
      // Replace, don't merge arrays
      target.customRules = [...source.customRules];
    }

    if (source.parallel !== undefined) {
      target.parallel = source.parallel;
    }

    if (source.maxFiles !== undefined) {
      target.maxFiles = source.maxFiles;
    }
  }

  /**
   * Validate configuration values
   */
  static validateConfig(config: any): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate minSeverity
    if (config.minSeverity !== undefined) {
      if (!this.isValidSeverity(config.minSeverity)) {
        errors.push(`Invalid minSeverity '${config.minSeverity}'. Must be one of: CRITICAL, HIGH, MEDIUM, LOW, SUGGESTION`);
      }
    }

    // Validate failOnSeverity
    if (config.failOnSeverity !== undefined) {
      if (!this.isValidSeverity(config.failOnSeverity)) {
        errors.push(`Invalid failOnSeverity '${config.failOnSeverity}'. Must be one of: CRITICAL, HIGH, MEDIUM, LOW, SUGGESTION`);
      }
    }

    // Validate disabledRules
    if (config.disabledRules !== undefined) {
      if (!Array.isArray(config.disabledRules)) {
        errors.push('disabledRules must be an array');
      } else {
        for (const ruleId of config.disabledRules) {
          if (typeof ruleId !== 'string' || ruleId.trim() === '') {
            errors.push('All disabledRules entries must be non-empty strings');
            break;
          }
        }
      }
    }

    // Validate customRules
    if (config.customRules !== undefined) {
      if (!Array.isArray(config.customRules)) {
        errors.push('customRules must be an array');
      }
    }

    // Validate parallel
    if (config.parallel !== undefined) {
      if (typeof config.parallel !== 'boolean') {
        errors.push('parallel must be a boolean');
      }
    }

    // Validate maxFiles
    if (config.maxFiles !== undefined) {
      if (typeof config.maxFiles !== 'number' || config.maxFiles <= 0) {
        errors.push('maxFiles must be a positive number');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if a string is a valid severity level
   */
  private static isValidSeverity(severity: string): severity is Severity {
    const validSeverities: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SUGGESTION'];
    return validSeverities.includes(severity as Severity);
  }

  /**
   * Save configuration to a file
   */
  static saveConfig(filePath: string, config: RuleEngineConfig): void {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const content = JSON.stringify(config, null, 2);
      fs.writeFileSync(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save config to ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
