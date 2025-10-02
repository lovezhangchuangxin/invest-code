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
  </div>
</template>

<script setup lang="ts">
import { ref, toRefs, watchEffect } from 'vue'
import MonacoEditor, { type EditorProps } from './MonacoEditor.vue'

export interface CodeEditorProps extends EditorProps {}

const props = defineProps<CodeEditorProps>()
// 注意：model 绑定的数据比较特殊，不要用 toRefs 转换
const { theme, fontFamily, fontSize } = toRefs(props)
const editorRef = ref<InstanceType<typeof MonacoEditor>>()
const code = ref(props.modelValue)
const lang = ref(props.lang)
const emit = defineEmits<{
  'update:modelValue': [string]
  'update:lang': [string]
  save: [string]
}>()

watchEffect(() => {
  emit('update:modelValue', code.value)
  emit('update:lang', lang.value)
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
}
</style>
