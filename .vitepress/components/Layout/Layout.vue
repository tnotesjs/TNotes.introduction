<template>
  <Layout>
    <template v-if="showNotFound" #not-found>
      <div class="not-found-container">
        <h1>404</h1>
        <p>Page not found</p>
        <!-- <div class="debug-info">
          <p>Current path: {{ decodedCurrentPath }}</p>
          <p>Matched ID: {{ matchedId }}</p>
          <p>Redirect path: {{ redirectPath }}</p>
        </div> -->
      </div>
    </template>
    <template #doc-top>
      <!-- <pre>vscodesNoteDir: {{ vscodeNotesDir }}</pre> -->
      <!-- <pre>vpData.page.value: {{ vpData.page.value }}</pre>
            <pre>currentNoteConfig: {{ currentNoteConfig }}</pre> -->
      <!-- <button @click="copyRawFile" title="Copy raw file">raw</button> -->
      <!-- <pre>{{ tocData }}</pre> -->
      <ImagePreview />
      <Swiper />
    </template>
    <!-- <template #doc-bottom>doc-bottom</template> -->
    <template #doc-before>
      <div :class="$style.docBeforeContainer">
        <div :class="$style.leftArea">
          <div :class="$style.toggleSidebarBox">
            <ToggleSidebar />
          </div>
          <div :class="$style.vscodeBox" v-show="vscodeNotesDir">
            <a
              :href="vscodeNotesDir"
              aria-label="open in vscode"
              title="open in vscode"
              target="_blank"
            >
              <img :src="icon__vscode" alt="open in vscode" />
            </a>
          </div>
          <div :class="$style.contentToggleBox">
            <ToggleFullContent />
          </div>
          <div :class="$style.githubBox" v-show="isHomeReadme">
            <a
              :href="`https://github.com/tnotesjs/${vpData.page.value.title.toLowerCase()}/blob/main/README.md`"
              :aria-label="`tnotesjs github - ${vpData.page.value.title.toLowerCase()} 笔记仓库链接`"
              :title="`tnotesjs github - ${vpData.page.value.title.toLowerCase()} 笔记仓库链接`"
              target="_blank"
              rel="noopener"
            >
              <img :src="icon__github" alt="github icon" />
            </a>
          </div>
          <!-- <div :class="$style.copyBox" v-show="isHomeReadme">
            <span :class="$style.tip" v-show="isCopied">Copied!</span>
            <button
              :class="$style.copyRawFile"
              @click="copyRawFile"
              title="Copy raw file"
            >
              <img :class="$style.icon" :src="m2mm" alt="icon__clipboard" />
            </button>
          </div> -->
        </div>
        <div :class="$style.rightArea">
          <!-- 单个图标，点击打开 modal，只在有笔记数据的页面显示 -->
          <div
            :class="$style.aboutBtn"
            v-show="currentNoteId && created_at && updated_at"
          >
            <button
              :class="$style.aboutIconButton"
              @click="openTimeModal"
              aria-haspopup="dialog"
              :aria-expanded="timeModalOpen.toString()"
              title="关于这篇笔记"
              type="button"
            >
              !
            </button>
          </div>

          <span title="已完成笔记数量" v-show="isHomeReadme"
            >✅ 已完成：{{ doneNotesLen }}</span
          >
        </div>
      </div>

      <AboutModal
        v-model="timeModalOpen"
        @close="onTimeModalClose"
        :title="modalTitle"
      >
        <template #title>
          {{ modalTitle }}
        </template>

        <div
          :class="$style.timeModalContent"
          role="group"
          aria-label="笔记提交信息"
        >
          <div :class="$style.timeLine" title="首次提交时间">
            <div :class="$style.timeLabel"><strong>⌛️ 首次提交</strong></div>
            <div :class="$style.timeValue">{{ formatDate(created_at) }}</div>
          </div>

          <div :class="$style.timeLine" title="最近提交时间">
            <div :class="$style.timeLabel"><strong>⌛️ 最近提交</strong></div>
            <div :class="$style.timeValue">{{ formatDate(updated_at) }}</div>
          </div>
        </div>
      </AboutModal>
    </template>
    <template #doc-footer-before>
      <!-- <div class="footer-time-info">
        <p title="首次提交时间">首次提交时间：{{ formatDate(created_at) }}</p>
        <p title="最近提交时间">最近提交时间：{{ formatDate(updated_at) }}</p>
      </div> -->
    </template>
    <template #doc-after>
      <!-- {{ REPO_NAME + '.' + currentNoteId }} -->
      <Discussions v-if="isDiscussionsVisible" :id="currentNoteConfig.id" />
    </template>
    <!-- <template #doc-bottom>
            <Discussions id="TNotes.template.0003" />
        </template> -->

    <template #aside-top>
      <!-- aside-top -->
      <!-- {{ vpData.page.value.title }} -->
    </template>
    <template #aside-outline-before>
      <span
        @click="scrollToTop"
        style="cursor: pointer; height: 1em; width: 1em"
        title="回到顶部"
      >
        <img :src="icon__totop" alt="to top" />
      </span>
    </template>

    <!-- <template #sidebar-nav-before>sidebar-nav-before</template> -->
    <!-- <template #sidebar-nav-after>sidebar-nav-after</template> -->

    <!-- <template #aside-outline-after>aside-outline-after</template> -->
    <!-- <template #aside-bottom>aside-bottom</template> -->
    <!-- <template #aside-ads-before>aside-ads-before</template> -->
    <!-- <template #aside-ads-after>aside-ads-after</template> -->
    <!-- <template #layout-top>layout-top</template> -->
    <!-- <template #layout-bottom>layout-bottom</template> -->
    <!-- <template #nav-bar-title-before>nav-bar-title-before</template> -->
    <!-- <template #nav-bar-title-after>nav-bar-title-after</template> -->
    <!-- <template #nav-bar-content-before>nav-bar-content-before</template> -->
    <!-- <template #nav-bar-content-after>nav-bar-content-after</template> -->

    <!-- !NOTE 不清楚下面的插槽所对应的位置 -->
    <!-- <template #nav-screen-content-before>nav-screen-content-before</template> -->
    <!-- <template #nav-screen-content-after>nav-screen-content-after</template> -->
  </Layout>
</template>

<script setup>
import Discussions from '../Discussions/Discussions.vue'
import ImagePreview from './ImagePreview.vue'
import Swiper from './Swiper.vue'
import ToggleFullContent from './ToggleFullContent.vue'
import ToggleSidebar from './ToggleSidebar.vue'

import icon__github from '/icon__github.svg'
import icon__totop from '/icon__totop.svg'
import icon__vscode from '/icon__vscode.svg'
import m2mm from '/m2mm.png'

import { useData, useRoute, useRouter } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { computed, onMounted, ref, watch, onUnmounted } from 'vue'

import { data as allNotesConfig } from '../notesConfig.data.ts'
import { data as tocData } from './toc.data.ts'

import { formatDate, scrollToTop } from '../utils.ts'

import { NOTES_DIR_KEY, TOC_MD } from '../constants.ts'

import AboutModal from './AboutModal.vue' // <- 新增 modal 组件导入

const { Layout } = DefaultTheme
const vpData = useData()
const router = useRouter()
const route = useRoute()

// 提取当前笔记的 ID（前 4 个数字）
const currentNoteId = computed(() => {
  const match = vpData.page.value.relativePath.match(/notes\/(\d{4})\./)
  return match ? match[1] : null
})

// 根据当前笔记 ID 获取配置数据
const currentNoteConfig = computed(() => {
  return currentNoteId.value && allNotesConfig[currentNoteId.value]
    ? allNotesConfig[currentNoteId.value]
    : {
        bilibili: [],
        done: false,
        enableDiscussions: false, // 默认值
      }
})
const isDiscussionsVisible = computed(
  () => currentNoteConfig.value.enableDiscussions
)
const updated_at = computed(() => currentNoteConfig.value.updated_at)
const created_at = computed(() => currentNoteConfig.value.created_at)

const vscodeNotesDir = ref('')

const updateVscodeNoteDir = () => {
  if (typeof window !== 'undefined') {
    const notesDir = localStorage.getItem(NOTES_DIR_KEY)
    vscodeNotesDir.value = notesDir
      ? `vscode://file/${notesDir}/${vpData.page.value.relativePath}`
      : ''
  }
}

onMounted(() => {
  updateVscodeNoteDir()
})
watch(
  () => vpData.page.value.relativePath,
  () => {
    updateVscodeNoteDir()
  }
)

const isHomeReadme = computed(() => vpData.page.value.filePath === TOC_MD)
const doneNotesLen = computed(() => tocData?.doneNotesLen)
const isCopied = ref(false)
const copyRawFile = () => {
  if (!tocData) return
  navigator.clipboard.writeText(tocData.fileContent)
  isCopied.value = true
  setTimeout(() => (isCopied.value = false), 1000)

  const targetWindow = window.open('https://tdahuyou.github.io/m2mm/', '_blank')
  setTimeout(() => {
    targetWindow.postMessage(
      {
        senderID: '__TNotes__',
        message: tocData.fileContent,
      },
      '*'
    )
  }, 1000)
}

// #region - 404 redirect
// 控制是否显示 404 内容
const showNotFound = ref(false)
const currentPath = ref('')
const matchedId = ref('')
const redirectPath = ref('')

// 重定向检查函数
function checkRedirect() {
  if (typeof window === 'undefined') return false

  currentPath.value = window.location.pathname
  // 匹配路径格式：/TNotes.*/notes/四个数字{任意内容}/README
  const match = currentPath.value.match(
    /\/TNotes[^/]+\/notes\/(\d{4})[^/]*(?:\/.*)?$/
  )

  if (match) {
    matchedId.value = match[1]
    const targetNote = allNotesConfig[matchedId.value]
    redirectPath.value = targetNote ? targetNote.redirect : ''

    if (targetNote && targetNote.redirect) {
      const base = vpData.site.value.base
      // 构建目标路径（包含基础路径）
      const targetPath = `${base}${targetNote.redirect}`

      // 避免重定向死循环
      if (currentPath.value !== targetPath) {
        console.log(`Redirecting from ${currentPath.value} to ${targetPath}`)

        // 使用完整的页面跳转（强制刷新）
        window.location.href = targetPath
        return true
      }
    }
  }
  return false
}

const decodedCurrentPath = computed(() => {
  try {
    return decodeURIComponent(currentPath.value)
  } catch (e) {
    console.error('Failed to decode URI:', e)
    return currentPath.value
  }
})

// 在组件挂载时检查重定向
onMounted(() => {
  // 延迟执行以确保路由状态稳定
  setTimeout(() => {
    // 如果是 404 页面，尝试重定向
    if (vpData.page.value.isNotFound) {
      const redirected = checkRedirect()

      // 如果重定向失败，显示原始 404 内容
      if (!redirected) {
        showNotFound.value = true
      }
    }
  }, 1000)
})

// 监听路由变化
watch(
  () => route.path,
  () => {
    // 延迟检查以确保路由更新完成
    setTimeout(() => {
      if (vpData.page.value.isNotFound) {
        const redirected = checkRedirect()
        if (!redirected) {
          showNotFound.value = true
        }
      }
    }, 1000)
  }
)
// #endregion

// modal 控制
const timeModalOpen = ref(false)
const modalTitle = computed(() => {
  return '关于这篇笔记'
})

function openTimeModal() {
  timeModalOpen.value = true
}
function onTimeModalClose() {
  timeModalOpen.value = false
}
</script>

<style module src="./Layout.module.scss"></style>
