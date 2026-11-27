<#
.SYNOPSIS
  用本机 Git 凭据管理器（GCM）里已保存的 GitHub 凭据，为当前仓库创建 GitHub Release。

.DESCRIPTION
  适用于「tag 已经推送、Releases 页还是空、本机又没有 gh CLI」的场景。

  这个脚本专门修掉 Windows 上自动发 Release 时踩过的两个坑：
    1. `git credential fill` 在 PowerShell 管道里输出 CRLF 行尾，取出来的
       password 尾部带一个 `\r`，直接塞进 Authorization 头会得到 401。
       所以这里按 `\r` 或 `\n` 拆行并对 token 做 Trim()。
    2. 每次 pwsh 调用都是新进程，`$global:`/`$env:` 变量不会跨调用继承；
       取凭据和发请求必须在同一次执行里完成。本脚本天然满足。

  前置条件：本机对该仓库至少成功执行过一次 `git push`，让 GCM 保存了凭据；
  目标 tag 已经存在（脚本只创建 Release，不创建 tag）。

.PARAMETER Tag
  已存在的 tag，例如 v1.4.2（必填）。

.PARAMETER Title
  Release 标题；缺省等于 Tag。

.PARAMETER BodyFile
  Release 正文（Markdown）文件路径；缺省为空正文。

.PARAMETER Repo
  `owner/repo`；缺省从 origin remote 自动推断。

.PARAMETER Draft
  创建为草稿。

.PARAMETER Prerelease
  标记为预发布。

.PARAMETER DryRun
  只打印将要使用的仓库/tag/token 长度/正文长度，不发请求，用于自检。

.EXAMPLE
  .\scripts\create-release.ps1 -Tag v1.4.2 -Title "1.4.2 — 插件页面/弹窗通用兜底" -BodyFile .\release-notes.md
#>
param(
  [Parameter(Mandatory = $true)][string]$Tag,
  [string]$Title,
  [string]$BodyFile,
  [string]$Repo,
  [switch]$Draft,
  [switch]$Prerelease,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

if (-not $Title) { $Title = $Tag }

# 1) 推断仓库（缺省取 origin）
if (-not $Repo) {
  $remote = (git remote get-url origin 2>$null)
  if (-not $remote) { throw '无法从 origin remote 推断仓库，请用 -Repo owner/repo 指定' }
  if ($remote -match 'github\.com[:/](?<owner>[^/]+)/(?<repo>[^/.]+?)(?:\.git)?$') {
    $Repo = "$($Matches['owner'])/$($Matches['repo'])"
  } else {
    throw "无法解析 origin remote: $remote"
  }
}

# 2) 取凭据：按 CRLF/LF 拆行并 Trim，修掉 Windows 的 \r 污染
$probe = "protocol=https`nhost=github.com`n`n"
$cred = ($probe | git credential fill 2>$null)
$lines = ($cred -split "`r?`n") | Where-Object { $_ -ne '' }
$pass = ((($lines | Where-Object { $_ -match '^password=' } | Select-Object -First 1) -replace '^password=', '')).Trim()
if (-not $pass) {
  throw 'git credential fill 未返回 password；请先对该仓库成功执行一次 git push，让凭据管理器保存 GitHub 凭据'
}

# 3) 正文
$bodyText = ''
if ($BodyFile) {
  if (-not (Test-Path -LiteralPath $BodyFile)) { throw "BodyFile 不存在: $BodyFile" }
  $bodyText = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $BodyFile))
}

if ($DryRun) {
  Write-Host 'DRY RUN（未发送请求）'
  Write-Host "  Repo       = $Repo"
  Write-Host "  Tag        = $Tag"
  Write-Host "  Title      = $Title"
  Write-Host "  Draft      = $([bool]$Draft)"
  Write-Host "  Prerelease = $([bool]$Prerelease)"
  Write-Host "  token 长度 = $($pass.Length)"
  Write-Host "  body 长度  = $($bodyText.Length)"
  exit 0
}

# 4) 创建 Release（UTF-8 编码正文，避免中文乱码）
$payload = @{
  tag_name   = $Tag
  name       = $Title
  body       = $bodyText
  draft      = [bool]$Draft
  prerelease = [bool]$Prerelease
} | ConvertTo-Json -Depth 5
$bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)

try {
  $resp = Invoke-RestMethod `
    -Uri "https://api.github.com/repos/$Repo/releases" `
    -Method Post `
    -Headers @{
      Authorization = "Bearer $pass"
      Accept        = 'application/vnd.github+json'
      'User-Agent'  = 'dsh-create-release'
    } `
    -ContentType 'application/json' `
    -Body $bytes `
    -TimeoutSec 60

  Write-Host ("Release 已创建: " + $resp.html_url)
  Write-Output $resp.html_url
} catch {
  Write-Host ("创建失败: " + $_.Exception.Message)
  if ($_.ErrorDetails) { Write-Host $_.ErrorDetails.Message }
  Write-Host '排错：401 = token 为空/带 \\r/无权限；403 = 凭据权限不足；422 = tag 不存在或该 tag 已有 Release。'
  exit 1
}
