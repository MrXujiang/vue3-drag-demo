<template>
    <div ref="editor" class="editor-box"></div>
</template>
<script setup lang="ts">
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

import { ref, onMounted } from "vue";
const props = defineProps(['width', 'height', 'editorOptions', 'code']);
const editor = ref<any>(null);
self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === 'json') {
            return new jsonWorker()
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return new cssWorker()
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return new htmlWorker()
        }
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker()
        }
        return new editorWorker()
    }
}

let monacoEditor: any;
function init() {
    // 初始化编辑器，确保dom已经渲染
    monacoEditor = monaco.editor.create(editor.value, {
        //编辑器初始显示代码
        value: props.code,
        language: 'json',
        // 语言支持自行查阅demo
        automaticLayout: true,//自动布局
        theme: 'vs-dark',
        //官方白带三种主题vS, hc-black, or vs-dark
    });
}
function save() {
    let content = JSON.parse(monacoEditor.getValue());
    content = {
        data: Array.isArray(content.data) ? content.data : [],
        grid: Object.prototype.toString.call(content.grid) == '[object Number]' ? content.grid : 10
    }
    return content;

}

defineExpose({ save })
onMounted(() => {
    init();
})
</script>
<style lang="scss" scoped>
.editor-box {
    width: 100%;
    height: 500px;
}
</style>
