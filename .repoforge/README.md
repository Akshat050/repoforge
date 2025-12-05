# RepoForge State Directory

This directory contains RepoForge's state and configuration files.

## What's Stored Here

### `state.json`
Tracks RepoForge's context memory and audit history:
- Previous audit results
- File change tracking
- Issue resolution status
- Project metadata

## Purpose

RepoForge uses this directory to:
1. **Remember Context**: Maintain awareness of previous audits and changes
2. **Track Progress**: Monitor which issues have been addressed
3. **Optimize Performance**: Skip unchanged files in incremental audits
4. **Provide Insights**: Compare current state with historical data

## Configuration Files

Users can also place configuration files here:
- `rules.json` - Custom rule engine configuration
  - Severity thresholds
  - Disabled rules
  - Custom rules
  - Framework-specific settings

Example `rules.json`:
```json
{
  "minSeverity": "MEDIUM",
  "failOnSeverity": "HIGH",
  "disabledRules": ["STYLE001_NAMING_CONVENTION"],
  "parallel": true
}
```

## Should This Be Committed?

**Recommended Approach:**
- ✅ Commit `.repoforge/README.md` (this file)
- ✅ Commit `.repoforge/rules.json` (if you have team-wide rules)
- ⚠️ Consider `.repoforge/state.json` - depends on your use case:
  - **Include**: If you want to share audit history with team
  - **Exclude**: If state is personal/machine-specific

## Gitignore Example

If you want to exclude state but keep config:
```gitignore
# Exclude state but keep config
.repoforge/state.json

# Keep everything else in .repoforge/
!.repoforge/rules.json
!.repoforge/README.md
```

## Learn More

See [docs/CONFIGURATION_EXAMPLES.md](../docs/CONFIGURATION_EXAMPLES.md) for detailed configuration options.
