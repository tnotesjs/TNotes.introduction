/**
 * 测试配置补全功能
 */
import fs from 'fs'
import { validateAndCompleteConfig } from '../config/defaultConfig.js'

const testConfigPath = '.tnotes.test.json'

console.log('🧪 测试配置补全功能\n')

// 读取测试配置
const testConfig = JSON.parse(fs.readFileSync(testConfigPath, 'utf-8'))

console.log('📝 原始配置字段：')
console.log(Object.keys(testConfig).join(', '))
console.log(`\n原始配置字段数量: ${Object.keys(testConfig).length}`)

// 验证并补全
const { config: completedConfig, modified } =
  validateAndCompleteConfig(testConfig)

console.log('\n✅ 补全后配置字段：')
console.log(Object.keys(completedConfig).join(', '))
console.log(`\n补全后配置字段数量: ${Object.keys(completedConfig).length}`)

console.log(
  `\n${modified ? '✅ 配置已修改（补全了缺失字段）' : '⚠️ 配置未修改'}`
)

// 输出新增的字段
const addedFields = Object.keys(completedConfig).filter(
  (key) => !(key in testConfig)
)
if (addedFields.length > 0) {
  console.log('\n🆕 新增字段：')
  addedFields.forEach((field) => {
    console.log(
      `  - ${field}:`,
      JSON.stringify(
        completedConfig[field as keyof typeof completedConfig]
      ).slice(0, 50)
    )
  })
}

// 写入完整配置到新文件
const outputPath = '.tnotes.completed.json'
fs.writeFileSync(outputPath, JSON.stringify(completedConfig, null, 2), 'utf-8')
console.log(`\n💾 完整配置已写入: ${outputPath}`)
