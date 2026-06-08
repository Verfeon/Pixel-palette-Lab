<#
.SYNOPSIS
  PreToolUse hook: blocks git commit/push if `npm run build` fails.
.DESCRIPTION
  Receives hook context on stdin (JSON). If the tool is run_in_terminal
  and the command looks like a git commit/push, runs the build first.
  Returns JSON with permissionDecision = "deny" + a reason if build fails,
  otherwise "allow".
#>

# Read stdin (works in both PowerShell 5.1 and PowerShell Core)
$inputJson = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($inputJson)) {
  $inputJson = $input | Out-String
}

try {
  $ctx = $inputJson | ConvertFrom-Json
} catch {
  Write-Host '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
  exit 0
}

# Determine the project root (two levels up from .github/scripts/)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path "$scriptDir/../.."

# Check if this tool use is related to git commit/push
$toolUse = $ctx.toolUse
$command = ""

if ($toolUse.name -eq "run_in_terminal" -and $toolUse.input.command) {
  $command = $toolUse.input.command
} elseif ($toolUse.name -eq "run_in_terminal" -and $toolUse.input -is [string]) {
  $command = $toolUse.input
}

# Patterns that indicate a version control operation
$vcPatterns = @('git\s+commit', 'git\s+push', 'git\s+merge', 'git\s+rebase', 'git\s+tag', 'git\s+pull')
$isVcOp = $false
foreach ($pattern in $vcPatterns) {
  if ($command -match $pattern) {
    $isVcOp = $true
    break
  }
}

if (-not $isVcOp) {
  Write-Host '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
  exit 0
}

# Run the build
Push-Location $projectRoot
$buildOutput = & npm run build 2>&1 | Out-String
$exitCode = $LASTEXITCODE
Pop-Location

if ($exitCode -ne 0) {
  $reason = "Build failed - cannot commit with errors.`n--- Build output ---`n$buildOutput`n---"
  $escapedReason = $reason.Replace('\', '\\').Replace('"', '\"').Replace("`n", '\n').Replace("`r", '')
  Write-Host "{`"hookSpecificOutput`":{`"hookEventName`":`"PreToolUse`",`"permissionDecision`":`"deny`",`"permissionDecisionReason`":`"$escapedReason`"}}"
  exit 2
} else {
  Write-Host '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow","permissionDecisionReason":"Build passed"}}'
  exit 0
}
