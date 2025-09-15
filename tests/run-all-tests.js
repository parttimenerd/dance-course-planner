#!/usr/bin/env node

/**
 * Automated test runner for the Declarative Constraint Solver
 * Runs both basic and comprehensive test suites
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🚀 Automated Test Runner for Declarative Constraint Solver\n')

const testFiles = [
  'test-declarative-solver.js',
  'test-comprehensive-solver.js',
  'test-comprehensive-enumeration.js',
  'test-advanced-stress.js',
  'test-solution-enumeration.js',
  'test-output-structure.js',
  'test-hinting-solver.js',
  'test-single-course-gap.js'
]

let totalTests = 0
let passedSuites = 0
let allPassed = true

for (const testFile of testFiles) {
  const testPath = join(__dirname, testFile)
  if (!existsSync(testPath)) {
    console.log(`❌ Test file not found: ${testPath}`)
    allPassed = false
    continue
  }

  console.log(`📋 Running ${testFile}...`)
  console.log('=' .repeat(60))
  
  try {
    const output = execSync(`node ${testPath}`, { 
      encoding: 'utf8',
      stdio: 'inherit'
    })
    passedSuites++
    console.log(`✅ ${testFile} completed successfully\n`)
  } catch (error) {
    console.log(`❌ ${testFile} failed with exit code ${error.status}\n`)
    allPassed = false
  }
  
  totalTests++
}

console.log('=' .repeat(60))
console.log('📊 Final Test Summary:')
console.log(`  🧪 Test suites run: ${totalTests}`)
console.log(`  ✅ Passed: ${passedSuites}`)
console.log(`  ❌ Failed: ${totalTests - passedSuites}`)
console.log(`  📈 Success Rate: ${Math.round(passedSuites / totalTests * 100)}%`)

if (allPassed) {
  console.log('\n🎉 All test suites passed! The Declarative Constraint Solver is ready for production.')
  process.exit(0)
} else {
  console.log('\n⚠️  Some test suites failed. Please review the implementation.')
  process.exit(1)
}
