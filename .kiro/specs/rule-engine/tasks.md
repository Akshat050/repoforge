# Implementation Plan

- [x] 1. Define core types and interfaces





  - Create `core/ruleEngine/types.ts` with Severity, RuleCategory, Rule, Violation, RuleContext, RuleEngineConfig, and RuleEngineResult types
  - Ensure types are exported and available for use across the codebase
  - _Requirements: 1.1, 2.1, 3.1, 5.1, 6.1_

- [x] 2. Implement Rule Registry




- [x] 2.1 Create RuleRegistry class with core functionality

  - Implement rule registration, retrieval, and validation methods
  - Add support for filtering by category and framework
  - Handle duplicate rule ID prevention
  - _Requirements: 2.1, 2.2, 2.4, 3.1_

- [x] 2.2 Write property test for rule registration


  - **Property 6: Valid rule registration**
  - **Validates: Requirements 2.2**

- [x] 2.3 Write property test for duplicate prevention


  - **Property 7: Duplicate rule prevention**
  - **Validates: Requirements 2.4**

- [x] 2.4 Write property test for rule validation


  - **Property 5: Rule definition validation**
  - **Validates: Requirements 2.1, 2.3**

- [x] 2.5 Write property test for rule merging


  - **Property 8: Rule merging**
  - **Validates: Requirements 2.5**

- [x] 3. Implement Rule Executor




- [x] 3.1 Create RuleExecutor class with execution logic


  - Implement single rule execution with error handling
  - Add parallel file processing capability
  - Implement severity threshold filtering
  - Add support for disabled rules
  - _Requirements: 6.1, 8.1, 9.4_

- [x] 3.2 Write property test for severity threshold filtering


  - **Property 15: Severity threshold filtering**
  - **Validates: Requirements 6.1**

- [x] 3.3 Write property test for disabled rules exclusion

  - **Property 19: Disabled rules exclusion**
  - **Validates: Requirements 8.1, 8.2**

- [x] 3.4 Write property test for error resilience

  - **Property 22: Error resilience**
  - **Validates: Requirements 9.4**

- [x] 3.5 Write property test for framework-specific rules

  - **Property 17: Framework-specific rule application**
  - **Validates: Requirements 7.1, 7.2, 7.5**

- [x] 4. Implement Result Formatter





- [x] 4.1 Create ResultFormatter class with output methods

  - Implement CLI formatting with colors and grouping
  - Implement JSON formatting
  - Add grouping methods (by severity, category, file)
  - Generate summary statistics
  - _Requirements: 1.2, 10.5_

- [x] 4.2 Write property test for severity ordering


  - **Property 2: Severity ordering in results**
  - **Validates: Requirements 1.2**

- [x] 4.3 Write property test for output format validity


  - **Property 24: Output format validity**
  - **Validates: Requirements 10.5**

- [x] 4.4 Write property test for severity count accuracy


  - **Property 4: Severity count accuracy**
  - **Validates: Requirements 1.4**

- [x] 4.5 Write property test for category count accuracy


  - **Property 11: Category count accuracy**
  - **Validates: Requirements 3.4**

- [x] 5. Create built-in security rules




- [x] 5.1 Implement hardcoded credentials detection rule


  - Detect patterns for passwords, API keys, secrets
  - Assign CRITICAL severity
  - Provide fix suggestions
  - _Requirements: 4.1_

- [x] 5.2 Implement SQL injection detection rule


  - Detect unsafe SQL query construction
  - Assign CRITICAL severity
  - _Requirements: 4.2_

- [x] 5.3 Implement exposed secrets detection rule


  - Detect environment variables and tokens in code
  - Assign CRITICAL severity
  - _Requirements: 4.3_

- [x] 5.4 Implement unsafe crypto detection rule


  - Detect weak algorithms and practices
  - Assign HIGH severity
  - _Requirements: 4.4_

- [x] 5.5 Write unit tests for security rules


  - Test each security rule with valid and malicious code examples
  - Verify correct severity assignment
  - Verify fix suggestions are provided
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5.6 Write property test for violation completeness


  - **Property 12: Violation completeness**
  - **Validates: Requirements 1.5, 3.2, 4.5, 5.1, 5.5, 10.1, 10.3, 10.4**

- [x] 5.7 Write property test for code snippet inclusion


  - **Property 13: Code snippet inclusion**
  - **Validates: Requirements 10.2**

- [x] 6. Migrate existing audit rules to new system




- [x] 6.1 Convert ghost detection to rule


  - Refactor `auditGhosts()` into `GHOST_MISSING_TEST` rule
  - Maintain existing detection logic
  - Add proper metadata and fix suggestions
  - _Requirements: 1.1, 5.1_

- [x] 6.2 Convert curse detection to multiple rules


  - Split `auditCurses()` into separate rules for naming, file size, mixed layers
  - Create `CURSE_NAMING_*` rules for different file types
  - Create `CURSE_MONOLITHIC_FILE` rule with context-aware thresholds
  - Create `CURSE_MIXED_FRONTEND_BACKEND` rule
  - _Requirements: 1.1, 5.1_

- [x] 6.3 Convert zombie detection to rule


  - Refactor `auditZombies()` into `ZOMBIE_OUTSIDE_SRC` rule
  - Maintain framework-aware detection
  - _Requirements: 1.1, 5.1_

- [x] 6.4 Write property test for valid severity assignment


  - **Property 1: Valid severity assignment**
  - **Validates: Requirements 1.1**

- [x] 6.5 Write property test for valid category assignment


  - **Property 9: Valid category assignment**
  - **Validates: Requirements 3.1**

- [x] 7. Implement configuration system




- [x] 7.1 Create configuration loader


  - Load from `.repoforge/rules.json`
  - Support global and project-level configs
  - Implement configuration precedence
  - Validate configuration values
  - _Requirements: 6.1, 8.1, 8.4_

- [x] 7.2 Add CLI flag support for configuration


  - Support `--min-severity` flag
  - Support `--fail-on-severity` flag
  - Support `--disable-rule` flag
  - CLI flags override file configuration
  - _Requirements: 6.1, 8.1_

- [x] 7.3 Write property test for invalid disabled rule warning


  - **Property 21: Invalid disabled rule warning**
  - **Validates: Requirements 8.5**

- [x] 7.4 Write unit test for configuration loading


  - Test loading from file
  - Test configuration precedence
  - Test default values when no config exists
  - _Requirements: 6.3, 8.4_

- [x] 8. Implement framework-aware features





- [x] 8.1 Add severity adjustment by context


  - Implement `adjustSeverity` function support in rules
  - Pass project profile to adjustment functions
  - _Requirements: 7.3_

- [x] 8.2 Create React-specific rules


  - Implement `REACT001_ASYNC_USEEFFECT` rule
  - Implement `REACT002_SERVER_IN_CLIENT` rule
  - Mark rules with `frameworks: ['react', 'next']`
  - _Requirements: 7.1_


- [x] 8.3 Create Node.js backend-specific rules

  - Implement `NODE001_MISSING_INPUT_VALIDATION` rule
  - Implement `NODE002_INCONSISTENT_STATUS_CODES` rule
  - Mark rules with `frameworks: ['express', 'fastify', 'nest']`
  - _Requirements: 7.2_


- [x] 8.4 Write property test for severity adjustment

  - **Property 18: Severity adjustment by context**
  - **Validates: Requirements 7.3**


- [x] 8.5 Write unit test for language-agnostic default

  - Test that projects without frameworks get language-agnostic rules only
  - _Requirements: 7.4_

- [-] 9. Integrate with existing audit system


- [x] 9.1 Update smartAuditor to use Rule Engine


  - Replace direct `auditRepo()` calls with RuleExecutor
  - Map old Issue type to new Violation type
  - Maintain backward compatibility with existing API
  - _Requirements: 1.1, 1.2_

- [x] 9.2 Update CLI commands to use Rule Engine


  - Modify `repoforge audit` to use new system
  - Add `--min-severity` and `--fail-on-severity` flags
  - Update output formatting
  - _Requirements: 6.1, 6.2, 10.5_

- [x] 9.3 Update MCP server to use Rule Engine


  - Modify `repoforge_audit_repo` tool to use new system
  - Modify `repoforge_audit_summary` tool to use new system
  - Return violations with full metadata
  - _Requirements: 1.2, 10.5_

- [x] 9.4 Write property test for CI/CD exit code


  - **Property 16: CI/CD exit code**
  - **Validates: Requirements 6.2**

- [x] 9.5 Write unit tests for threshold examples



  - Test default behavior (all violations reported)
  - Test CRITICAL threshold (only CRITICAL fails)
  - Test SUGGESTION threshold (all violations reported)
  - _Requirements: 6.3, 6.4, 6.5_

- [x] 10. Add file filtering and performance optimizations






- [x] 10.1 Implement binary file detection and exclusion

  - Detect binary files by extension and content
  - Skip node_modules directories
  - Skip build output directories (dist, build, .next, etc.)
  - _Requirements: 9.5_


- [x] 10.2 Add parallel processing support

  - Use worker threads or async processing for file-level parallelism
  - Implement configurable concurrency limit
  - _Requirements: 9.1_


- [x] 10.3 Write property test for binary exclusion

  - **Property 23: Binary and node_modules exclusion**
  - **Validates: Requirements 9.5**


- [x] 10.4 Write unit tests for performance features

  - Test parallel execution completes faster than serial
  - Test large file handling doesn't cause memory issues
  - _Requirements: 9.1, 9.2_

- [x] 11. Implement additional violation metadata features




- [x] 11.1 Add critical flagging


  - Set `immediateAttention` flag for CRITICAL violations
  - Highlight in CLI output
  - _Requirements: 1.3_

- [x] 11.2 Add category filtering


  - Implement filtering violations by category
  - Support in CLI with `--category` flag
  - _Requirements: 3.3_

- [x] 11.3 Add disabled rule indication


  - Mark disabled rules when listing all rules
  - Show in `repoforge rules list` command
  - _Requirements: 8.3_

- [x] 11.4 Write property test for critical flagging


  - **Property 3: Critical flagging**
  - **Validates: Requirements 1.3**

- [x] 11.5 Write property test for category filtering


  - **Property 10: Category filtering**
  - **Validates: Requirements 3.3**

- [x] 11.6 Write property test for disabled rule indication


  - **Property 20: Disabled rule indication**
  - **Validates: Requirements 8.3**

- [x] 11.7 Write property test for fix suggestion or guidance


  - **Property 14: Fix suggestion or guidance**
  - **Validates: Requirements 5.4**

- [x] 12. Create documentation and examples




- [x] 12.1 Write rule authoring guide


  - Document how to create custom rules
  - Provide examples for each rule category
  - Explain severity assignment guidelines
  - _Requirements: 2.1_


- [x] 12.2 Create configuration examples

  - Provide sample `.repoforge/rules.json` files
  - Document all configuration options
  - Show common use cases (CI/CD, team standards, etc.)
  - _Requirements: 6.1, 8.1_

- [x] 12.3 Update main README with Rule Engine features


  - Document new CLI flags
  - Explain severity levels
  - Show example outputs
  - _Requirements: 1.1, 6.1_

- [x] 13. Final checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
