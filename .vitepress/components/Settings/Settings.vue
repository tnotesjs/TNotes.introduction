<template>
  <div :class="$style.settingsWrapper">
    <!-- 本地路径配置 -->
    <section :class="$style.section">
      <div :class="$style.sectionHeader">
        <h2 :class="$style.sectionTitle">
          <span :class="$style.icon">📁</span>
          本地知识库路径
        </h2>
        <span :class="$style.badge" v-if="path">已配置</span>
        <span :class="[$style.badge, $style.badgeWarning]" v-else>未配置</span>
      </div>

      <div :class="$style.formGroup">
        <label for="notesPath" :class="$style.formLabel">
          知识库绝对路径
        </label>
        <div :class="$style.inputWrapper">
          <input
            id="notesPath"
            v-model="path"
            type="text"
            placeholder="例如: /Users/username/Documents/notes"
            :class="$style.formInput"
            @input="handlePathChange"
          />
          <button
            v-if="path"
            @click="clearPath"
            :class="$style.clearBtn"
            title="清空路径"
          >
            ✕
          </button>
        </div>
        <p :class="$style.formHint">
          💡 配置后可在侧边栏快速用 VS Code 打开笔记
        </p>
      </div>

      <div :class="$style.infoBox">
        <p :class="$style.infoTitle">📋 使用说明</p>
        <ul :class="$style.infoList">
          <li>适用于 PC 桌面环境（Windows / macOS / Linux）</li>
          <li>需要本地安装 VS Code 编辑器</li>
          <li>路径示例：<code>/Users/yourname/projects/notes</code></li>
        </ul>
      </div>
    </section>

    <!-- 保存按钮 -->
    <div :class="$style.actionBar">
      <button
        @click="save"
        :class="[$style.saveBtn, { [$style.disabled]: !hasChanges }]"
        :disabled="!hasChanges"
      >
        <span :class="$style.btnIcon">💾</span>
        {{ saveText }}
      </button>
      <button v-if="hasChanges" @click="reset" :class="$style.resetBtn">
        <span :class="$style.btnIcon">↩️</span>
        重置
      </button>
    </div>

    <!-- 保存成功提示 -->
    <Transition name="toast">
      <div v-if="showSuccessToast" :class="$style.toast">
        <span :class="$style.toastIcon">✅</span>
        配置已保存成功！
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NOTES_DIR_KEY } from '../constants'

// ===================================
// #region 响应式数据
// ===================================
const path = ref('')
const originalPath = ref('')
const showSuccessToast = ref(false)
// #endregion

// ===================================
// #region 计算属性
// ===================================
const hasChanges = computed(() => path.value !== originalPath.value)

const saveText = computed(() => {
  if (!hasChanges.value) return '无更改'
  return '保存配置'
})
// #endregion

// ===================================
// #region 生命周期
// ===================================
onMounted(() => {
  if (typeof window !== 'undefined') {
    const savedPath = localStorage.getItem(NOTES_DIR_KEY) || ''
    path.value = savedPath
    originalPath.value = savedPath
  }
})
// #endregion

// ===================================
// #region 事件处理
// ===================================
function handlePathChange() {
  // 可以在这里添加路径格式验证
}

function clearPath() {
  path.value = ''
}

function save() {
  if (!hasChanges.value) return

  try {
    localStorage.setItem(NOTES_DIR_KEY, path.value)
    originalPath.value = path.value

    // 显示成功提示
    showSuccessToast.value = true
    setTimeout(() => {
      showSuccessToast.value = false
    }, 3000)
  } catch (error) {
    console.error('保存配置失败:', error)
    alert('保存失败，请检查浏览器设置')
  }
}

function reset() {
  path.value = originalPath.value
}
// #endregion
</script>

<style module src="./Settings.module.scss"></style>
