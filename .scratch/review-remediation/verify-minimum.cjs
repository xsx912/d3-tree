const { spawnSync } = require('node:child_process')
const path = require('node:path')

const pnpmCli = process.argv[2]
if (!pnpmCli || process.version !== 'v22.20.0') throw new Error('需要 Node 22.20.0 与 pnpm CLI 路径')
const env = { ...process.env, CI: 'true' }
const pathKey = Object.keys(env).find(key => key.toLowerCase() === 'path') || 'Path'
env[pathKey] = `${path.dirname(process.execPath)}${path.delimiter}${env[pathKey] || ''}`
console.log(`最低版本验证：${process.version}`)
for (const args of [['install', '--frozen-lockfile'], ['lint'], ['typecheck'], ['test'], ['build']]) {
  const result = spawnSync(process.execPath, [pnpmCli, ...args], { cwd: path.resolve(__dirname, '../..'), env, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status || 1)
}
