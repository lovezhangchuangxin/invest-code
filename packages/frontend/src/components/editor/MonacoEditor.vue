<template>
  <slot></slot>
  <div class="editor-container" ref="container"></div>
</template>

<script setup lang="ts">
import { KeyCode, KeyMod, editor } from 'monaco-editor'
import {
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  toRefs,
  watchEffect,
} from 'vue'
import './worker'

export interface EditorProps {
  // 代码
  modelValue: string
  // 主题
  theme?: string
  lang: 'javascript'
  fontFamily?: string
  fontSize?: number
}

const container = ref<HTMLElement | null>(null)
const codeEditorRef = shallowRef<editor.IStandaloneCodeEditor | null>(null)
const props = defineProps<EditorProps>()
const { modelValue: code, theme, fontFamily, fontSize, lang } = toRefs(props)
const emit = defineEmits<{
  'update:modelValue': [value: string]
  save: [value: string]
}>()

onMounted(() => {
  const codeEditor = editor.create(container.value as HTMLElement, {
    value: code.value || '// code here...',
    language: lang.value || 'javascript',
    theme: theme.value || '',
    fontFamily: fontFamily.value || 'ui-monospace',
    fontSize: fontSize.value || 16,
    automaticLayout: true,
    tabCompletion: 'on',
    tabSize: 4,
    scrollbar: {
      verticalScrollbarSize: 10,
    },
  })
  codeEditorRef.value = codeEditor

  // ctrl+s 保存时自动格式化全部代码
  codeEditor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyS, async () => {
    codeEditor
      .getAction('editor.action.formatDocument')
      ?.run()
      .then(() => {
        emit('save', codeEditor.getValue())
      })
  })

  codeEditor.onDidChangeModelContent(() => {
    emit('update:modelValue', codeEditor.getValue())
  })

  watchEffect(() => {
    codeEditor.updateOptions({
      theme: theme.value || '',
      fontFamily: fontFamily.value || 'ui-monospace',
      fontSize: fontSize.value || 16,
      automaticLayout: true,
      tabCompletion: 'on',
      tabSize: 4,
    })
  })
})

onBeforeUnmount(() => {
  editor.getModels().forEach((model) => {
    model.dispose()
  })
})

defineExpose({
  setValue(code: string) {
    codeEditorRef.value?.setValue(code)
  },
})
</script>

<style scoped>
.editor-container {
  width: 100%;
  height: 100%;
}
</style>
<style>
.selected-line {
  background-color: #f0f0f0;
}
</style>
