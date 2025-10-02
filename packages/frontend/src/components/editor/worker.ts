import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
// import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
// import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
// import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    // if (label === 'json') {
    //   return new JsonWorker()
    // }
    // if (label === 'css' || label === 'scss' || label === 'less') {
    //   return new CssWorker()
    // }
    // if (label === 'html' || label === 'handlebars' || label === 'razor') {
    //   return new HtmlWorker()
    // }
    if (label === 'typescript' || label === 'javascript') {
      return new TsWorker()
    }
    return new EditorWorker()
  },
}

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)

// 添加自定义的 TypeScript 类型定义
const typeDeclarations = import('./game.txt?raw')
typeDeclarations.then((module) => {
  monaco.languages.typescript.javascriptDefaults.addExtraLib(
    module.default,
    'ts:custom/types',
  )
})
