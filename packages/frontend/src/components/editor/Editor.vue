<template>
  <div class="code-editor">
    <MonacoEditor
      ref="editorRef"
      v-model="code"
      v-bind="{
        theme,
        lang,
        fontFamily,
        fontSize,
      }"
      @save="saveCode"
    />
    <div v-if="isMobile" class="mobile-save-button" @click="saveCode">
      <span>保存</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, toRefs, watchEffect, onMounted } from 'vue'
import MonacoEditor, { type EditorProps } from './MonacoEditor.vue'
import { isMobileDevice } from '@/utils'

export interface CodeEditorProps extends EditorProps {}

const props = defineProps<CodeEditorProps>()
// 注意：model 绑定的数据比较特殊，不要用 toRefs 转换
const { theme, fontFamily, fontSize } = toRefs(props)
const editorRef = ref<InstanceType<typeof MonacoEditor>>()
const code = ref(props.modelValue)
const lang = ref(props.lang)
const isMobile = ref(false)
const emit = defineEmits<{
  'update:modelValue': [string]
  'update:lang': [string]
  save: [string]
}>()

watchEffect(() => {
  emit('update:modelValue', code.value)
  emit('update:lang', lang.value)
})

onMounted(() => {
  isMobile.value = isMobileDevice()
})

const saveCode = () => {
  emit('save', code.value)
}

defineExpose({
  setCode(newCode: string) {
    editorRef.value?.setValue(newCode)
  },
})
</script>

<style scoped>
.code-editor {
  height: 100%;
  position: relative;
}

.mobile-save-button {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  z-index: 10;
  font-size: 14px;
  font-weight: bold;
}

.mobile-save-button:hover {
  background-color: #359c6d;
}
</style>