#!/usr/bin/env node

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

class TestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, errors: [] },
      integration: { passed: 0, failed: 0, errors: [] },
      e2e: { passed: 0, failed: 0, errors: [] }
    }
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'pipe',
        shell: true,
        ...options
      })

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
        if (options.verbose) process.stdout.write(data)
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
        if (options.verbose) process.stderr.write(data)
      })

      child.on('close', (code) => {
        resolve({ code, stdout, stderr })
      })

      child.on('error', (error) => {
        reject(error)
      })
    })
  }

  async runUnitTests() {
    console.log('🧪 Running Unit Tests...\n')
    
    try {
      const result = await this.runCommand('npm', ['run', 'test:unit'], { verbose: true })
      
      if (result.code === 0) {
        console.log('✅ Unit tests passed')
        this.results.unit.passed++
      } else {
        console.log('❌ Unit tests failed')
        this.results.unit.failed++
        this.results.unit.errors.push(result.stderr)
      }
    } catch (error) {
      console.log('❌ Unit tests error:', error.message)
      this.results.unit.failed++
      this.results.unit.errors.push(error.message)
    }
  }

  async runIntegrationTests() {
    console.log('\n🔗 Running Integration Tests...\n')
    
    try {
      const result = await this.runCommand('npm', ['run', 'test:integration'], { verbose: true })
      
      if (result.code === 0) {
        console.log('✅ Integration tests passed')
        this.results.integration.passed++
      } else {
        console.log('❌ Integration tests failed')
        this.results.integration.failed++
        this.results.integration.errors.push(result.stderr)
      }
    } catch (error) {
      console.log('❌ Integration tests error:', error.message)
      this.results.integration.failed++
      this.results.integration.errors.push(error.message)
    }
  }

  async runE2ETests() {
    console.log('\n🌐 Running E2E Tests...\n')
    
    try {
      // Start the dev server for E2E tests
      console.log('Starting development server...')
      const serverProcess = spawn('npm', ['run', 'dev', '--', '--port', '3001'], {
        stdio: 'pipe',
        detached: true
      })

      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 10000))

      try {
        const result = await this.runCommand('npx', ['playwright', 'test'], { verbose: true })
        
        if (result.code === 0) {
          console.log('✅ E2E tests passed')
          this.results.e2e.passed++
        } else {
          console.log('❌ E2E tests failed')
          this.results.e2e.failed++
          this.results.e2e.errors.push(result.stderr)
        }
      } finally {
        // Kill the server
        process.kill(-serverProcess.pid)
      }
    } catch (error) {
      console.log('❌ E2E tests error:', error.message)
      this.results.e2e.failed++
      this.results.e2e.errors.push(error.message)
    }
  }

  async runLintAndTypeCheck() {
    console.log('\n🔍 Running Lint and Type Checks...\n')
    
    try {
      const lintResult = await this.runCommand('npm', ['run', 'lint'])
      if (lintResult.code !== 0) {
        console.log('⚠️  Linting issues found')
        console.log(lintResult.stdout)
      } else {
        console.log('✅ Linting passed')
      }

      // Type check if TypeScript is configured
      if (fs.existsSync('tsconfig.json')) {
        const typeResult = await this.runCommand('npx', ['tsc', '--noEmit'])
        if (typeResult.code !== 0) {
          console.log('⚠️  Type check issues found')
          console.log(typeResult.stdout)
        } else {
          console.log('✅ Type checking passed')
        }
      }
    } catch (error) {
      console.log('❌ Lint/Type check error:', error.message)
    }
  }

  generateReport() {
    console.log('\n📊 TEST SUMMARY REPORT\n')
    console.log('=' .repeat(50))
    
    const totalPassed = this.results.unit.passed + this.results.integration.passed + this.results.e2e.passed
    const totalFailed = this.results.unit.failed + this.results.integration.failed + this.results.e2e.failed
    
    console.log(`Unit Tests:        ${this.results.unit.passed} passed, ${this.results.unit.failed} failed`)
    console.log(`Integration Tests: ${this.results.integration.passed} passed, ${this.results.integration.failed} failed`)
    console.log(`E2E Tests:         ${this.results.e2e.passed} passed, ${this.results.e2e.failed} failed`)
    console.log('-'.repeat(50))
    console.log(`TOTAL:             ${totalPassed} passed, ${totalFailed} failed`)
    
    if (totalFailed > 0) {
      console.log('\n❌ FAILURES:')
      
      if (this.results.unit.errors.length > 0) {
        console.log('\nUnit Test Errors:')
        this.results.unit.errors.forEach(error => console.log(`  - ${error}`))
      }
      
      if (this.results.integration.errors.length > 0) {
        console.log('\nIntegration Test Errors:')
        this.results.integration.errors.forEach(error => console.log(`  - ${error}`))
      }
      
      if (this.results.e2e.errors.length > 0) {
        console.log('\nE2E Test Errors:')
        this.results.e2e.errors.forEach(error => console.log(`  - ${error}`))
      }
    }
    
    console.log('\n' + '='.repeat(50))
    
    if (totalFailed === 0) {
      console.log('🎉 ALL TESTS PASSED!')
      return 0
    } else {
      console.log('💥 SOME TESTS FAILED!')
      return 1
    }
  }

  async runBugSpecificTests() {
    console.log('\n🐛 Running Bug-Specific Tests...\n')
    
    // Test for the specific bugs mentioned
    console.log('Testing for auto-answer bug...')
    try {
      const result = await this.runCommand('npx', ['jest', '--testNamePattern=auto-answer'])
      if (result.code === 0) {
        console.log('✅ Auto-answer bug tests passed')
      } else {
        console.log('❌ Auto-answer bug detected!')
      }
    } catch (error) {
      console.log('❌ Bug test error:', error.message)
    }
    
    console.log('\nTesting for immediate wrong answer bug...')
    try {
      const result = await this.runCommand('npx', ['jest', '--testNamePattern=immediate.*wrong'])
      if (result.code === 0) {
        console.log('✅ Immediate wrong answer bug tests passed')
      } else {
        console.log('❌ Immediate wrong answer bug detected!')
      }
    } catch (error) {
      console.log('❌ Bug test error:', error.message)
    }
  }

  async runAll() {
    console.log('🚀 Starting Comprehensive Test Suite\n')
    console.log('This will test for the specific bugs you mentioned:\n')
    console.log('1. Auto-answer in practice phase')
    console.log('2. Immediate wrong answer in testing phase')
    console.log('3. State management issues')
    console.log('4. Timer and event race conditions')
    console.log('\n' + '='.repeat(50))

    await this.runLintAndTypeCheck()
    await this.runUnitTests()
    await this.runIntegrationTests()
    await this.runBugSpecificTests()
    await this.runE2ETests()
    
    const exitCode = this.generateReport()
    process.exit(exitCode)
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2)
  const runner = new TestRunner()
  
  if (args.length === 0) {
    runner.runAll()
  } else {
    switch (args[0]) {
      case 'unit':
        runner.runUnitTests().then(() => runner.generateReport())
        break
      case 'integration':
        runner.runIntegrationTests().then(() => runner.generateReport())
        break
      case 'e2e':
        runner.runE2ETests().then(() => runner.generateReport())
        break
      case 'bugs':
        runner.runBugSpecificTests().then(() => runner.generateReport())
        break
      default:
        console.log('Usage: node test-runner.js [unit|integration|e2e|bugs]')
        process.exit(1)
    }
  }
}

module.exports = TestRunner