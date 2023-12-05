<template>
  <div class="es-container">
    <div class="menu">
      <div
        v-for="item in typeList"
        @click="push(item)"
        :draggable="true"
        @dragstart="addType = item"
      >
        {{ item }}
      </div>
    </div>
    <div class="content">
      <div class="btn-box">
        <div class="btn">
          <div class="btn-item">网格<input type="text" v-model="grid" /></div>
          <div class="btn-item" @click.stop="quash('撤销')">撤销</div>
          <div class="btn-item" @click.stop="quash('重做')">重做</div>
          <div class="btn-item" @click="inducts">导入</div>
          <div class="btn-item" @click="show">导出</div>
          <div class="btn-item" @click.stop="handleMakeGroup">组合</div>
          <div class="btn-item" @click.stop="handleDismantle">拆除</div>
        </div>
        <div class="toDooring" @click="toDooring">体验DooringSaas零代码搭建平台</div>
      </div>
      <div
        class="es-editor"
        @mousedown="onEditorMouseDown"
        @dragover.prevent
        @drop="drop"
      >
        <Drager
          v-for="(item, index) in data"
          v-bind="item"
          rotatable
          boundary
          :snapToGrid="grid != 0"
          :gridX="grid"
          :gridY="grid"
          @change="onChange($event, item)"
          @drag-start="onDragstart(index)"
          @drag="onDrag"
          @drag-end="dragEnd"
          @click.stop="check(index)"
          @dblclick.stop="setValue(index, item.type)"
          @mousedown.stop
        >
          <template v-if="Array.isArray(item.value)">
            <div v-for="i in item.value">
              <div
                v-if="i.type == 'text'"
                class="item"
                :style="{
                  width: i.width + 'px',
                  height: i.height + 'px',
                  top: i.top + 'px',
                  left: i.left + 'px',
                }"
              >
                {{ i.value }}
              </div>
              <div
                v-else-if="i.type == 'audio'"
                class="item"
                :style="{
                  width: i.width + 'px',
                  height: i.height + 'px',
                  top: i.top + 'px',
                  left: i.left + 'px',
                }"
              >
                <audio
                  :src="i.value"
                  controls
                  :style="{ width: i.width - 10 + 'px', height: i.height + 'px' }"
                ></audio>
              </div>
              <video
                v-else-if="i.type == 'video'"
                class="item"
                :style="{
                  width: i.width + 'px',
                  height: i.height + 'px',
                  top: i.top + 'px',
                  left: i.left + 'px',
                }"
                :src="i.value"
                controls
              ></video>
              <img
                v-else-if="i.type == 'image'"
                class="item"
                :style="{
                  width: i.width + 'px',
                  height: i.height + 'px',
                  top: i.top + 'px',
                  left: i.left + 'px',
                }"
                :src="i.value"
                alt=""
              />
            </div>
          </template>
          <template v-else>
            <div v-if="item.type == 'text'">{{ item.value }}</div>
            <textarea
              v-else-if="item.type == 'input'"
              autofocus
              type="text"
              :style="{ width: item.width + 'px', height: item.height + 'px' }"
              v-model="item.value"
              @blur="setValue(index, item.type, true)"
            />
            <div v-else-if="item.type == 'audio'">
              <div
                style="
                  position: absolute;
                  width: 100%;
                  height: 100%;
                  left: 0;
                  top: 0;
                  z-index: 2;
                "
              ></div>
              <audio
                :src="item.value"
                controls
                :style="{ width: item.width - 10 + 'px', height: item.height + 'px' }"
              ></audio>
            </div>
            <video
              v-else-if="item.type == 'video'"
              :src="item.value"
              controls
              :style="{ width: item.width + 'px', height: item.height + 'px' }"
            ></video>
            <img
              v-else-if="item.type == 'image'"
              :style="{ width: item.width + 'px', height: item.height + 'px' }"
              :src="item.value"
              alt=""
            />
          </template>
        </Drager>
        <GridRect />
        <Area ref="areaRef" @move="onAreaMove" @up="onAreaUp" />
        <div
          v-show="markLine.left"
          class="es-markline-left"
          :style="{ left: markLine.left + 'px' }"
        ></div>
        <div
          v-show="markLine.top"
          class="es-markline-top"
          :style="{ top: markLine.top + 'px' }"
        ></div>
      </div>
    </div>
  </div>
  <a-modal
    title="导出"
    v-model:visible="visible"
    :width="800"
    unmount-on-close
    :modal-style="{ background: 'black' }"
  >
    <Editor :code="jsonData" ref="editorRef" />
    <template #footer>
      <a-button type="outline" @click="visible = !visible">取消</a-button>
      <a-button type="primary" @click="update">保存编辑</a-button>
      <a-button type="primary" @click="download">导出JSON</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import GridRect from './components/GridRect.vue'
import Drager, { type DragData } from 'es-drager'
import Area from './components/Area.vue';
import Editor from "./components/Editor.vue";
import { uuid } from 'xijs';
const visible = ref(false);
const editorRef = ref()
const currentIndex = ref(-1);// 正在被拖拽的元素
const areaSelected = ref(false);// 是否有选中的元素
const addType = ref();//记录拖拽添加的类型
const jsonData = computed(() => {
  return JSON.stringify({
    grid: grid.value,
    data: data.value
  }, null, 2)
});
// 添加拖拽的位置
const addDistance = ref({
  left: 0,
  top: 0
})
const typeList = reactive(['文本', '图片', '音频', '视频'])
// 记录移动的距离
const extraDragData = ref({
  prevLeft: 0,
  prevTop: 0
})
const grid = ref(10);// 网格大小
// 画布上的元素
const data = ref<any[]>([
  {
    id: 1,
    type: 'text',
    value: '枯桑知天风，海水知天寒。',
    width: 100,
    height: 100,
    left: 100,
    top: 100,
    angle: 0,
  }
])
const isupd = ref(true);//是否允许记录历史状态
const record = ref<any[]>([]);// 历史状态
const current = ref();// 当前历史历史记录的位置，-1为不查看历史记录
const areaRef = ref();// 选区
// 以下是参考线的变量
const lines = ref({ x: [], y: [] });
// 辅助线的位置
const markLine = ref({
  left: null,
  top: null
})
const temp = ref<any>();// 临时存放历史记录
// 深度监听画布上的元素信息
watch(() => data.value, (newV) => {
  temp.value = JSON.parse(JSON.stringify(newV))
}, { deep: true });
// 监听元素数组长度变化
watch(() => data.value.length, () => {
  recording()
});
// 选中不是很灵，控制一下
function check(index:number){
  data.value.forEach(v=>v.selected=false);
  data.value[index].selected=true;
}
// 鼠标按下编辑器区域事件
function onEditorMouseDown(e: MouseEvent) {
  data.value.forEach((item: any) => {
    // 先取消选中原本选中的目标
    item.selected = false;
  })
  areaRef.value.onMouseDown(e)
}
// 框选完成遍历元素数组
function onAreaMove(areaData: DragData) {
  data.value.forEach((item: any) => {
    const containLeft = areaData.left < item.left && areaData.left + areaData.width >= item.left + item.width
    // 包含top
    const containTop = areaData.top < item.top && areaData.top + areaData.height >= item.top + item.height;
    if (containLeft && containTop) {
      item.selected = true;
    } else {
      item.selected = false
    }
  })
}
// 移动
function onChange(dragData: DragData, item: any) {
  Object.keys(dragData).forEach((key) => {
    item[key as keyof DragData] = dragData[key as keyof DragData]
  })
}
// 开始拖拽
function onDragstart(index: number) {
  const current = data.value[index];
  // 记录开始拖拽时按下的数据，为了计算多个选中时移动的距离
  extraDragData.value.prevLeft = current.left!
  extraDragData.value.prevTop = current.top!
  currentIndex.value = index;

  // 计算参考线并获取参考线信息
  lines.value = calcLines()
}

// 拖拽中
function onDrag(dragData: DragData) {
  // 参考线代码
  markLine.value.top = null;
  markLine.value.left = null;
  for (let i = 0; i < lines.value.y.length; i++) {
    const { top, showTop } = lines.value.y[i]
    if (Math.abs(top - dragData.top) < 5) {
      markLine.value.top = showTop
      break
    }
  }

  for (let i = 0; i < lines.value.x.length; i++) {
    const { left, showLeft } = lines.value.x[i]

    if (Math.abs(left - dragData.left) < 5) {
      markLine.value.left = showLeft
      break
    }
  }

  // 计算拖拽横向和纵向距离
  const disX = dragData.left - extraDragData.value.prevLeft
  const disY = dragData.top - extraDragData.value.prevTop
  // 如果选中了多个
  data.value.forEach((item: any, index: number) => {
    if (item.selected && currentIndex.value !== index) {
      // 将选中并且不是当前拖拽主题的元素，同时进行移动
      item.left! += disX
      item.top! += disY
    }
  })
  extraDragData.value.prevLeft = dragData.left
  extraDragData.value.prevTop = dragData.top
}

// 拖拽结束
function dragEnd() {
  isupd.value = true;
  markLine.value = {
    top: null,
    left: null
  }
  recording()
}

// 拖进画布的回调
function drop(e: any) {
  addDistance.value = {
    top: e.layerY,
    left: e.layerX
  }
  push(addType.value);
}
// 松开区域选择
function onAreaUp() {
  areaSelected.value = data.value.some((item: any) => item.selected)
  // 如果区域有选中元素
  if (areaSelected.value) {
    setTimeout(() => {
      document.addEventListener('click', () => {
        areaSelected.value = false
      }, { once: true })
    })
  }
}
// 计算辅助线的位置
function calcLines() {
  const lines: any = { x: [], y: [] }
  // 当前拖拽元素大小
  const { width, height } = data.value[currentIndex.value!] as any
  // 循环遍历画布所有元素，将除当前拖拽元素外所有其它元素生成辅助线的位置保存，每个元素x和y都会有5种
  data.value.forEach((block, i: number) => {
    if (currentIndex.value! === i) return
    const { top: ATop, left: ALeft, width: AWidth, height: AHeight } = block as any

    lines.x.push({ showLeft: ALeft, left: ALeft })
    lines.x.push({ showLeft: ALeft + AWidth, left: ALeft + AWidth })
    lines.x.push({ showLeft: ALeft + AWidth / 2, left: ALeft + AWidth / 2 - width / 2 })
    lines.x.push({ showLeft: ALeft + AWidth, left: ALeft + AWidth - width })
    lines.x.push({ showLeft: ALeft, left: ALeft - width })

    lines.y.push({ showTop: ATop, top: ATop })
    lines.y.push({ showTop: ATop, top: ATop - height })
    lines.y.push({ showTop: ATop + AHeight / 2, top: ATop + AHeight / 2 - height / 2 })
    lines.y.push({ showTop: ATop + AHeight, top: ATop + AHeight })
    lines.y.push({ showTop: ATop + AHeight, top: ATop + AHeight - height })
  })
  return lines
}

// 比较两个对象数组是否相等
function isObjectArraysEqual(arr1: any[], arr2: any[]) {
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    const obj1 = arr1[i];
    const obj2 = arr2[i];

    // 比较对象的属性值是否相等
    if (!isObjectsEqual(obj1, obj2)) {
      return false;
    }
  }

  return true;
}

// 比较两个对象是否相等
function isObjectsEqual(obj1: any, obj2: any) {
  delete obj1.selected;
  delete obj2.selected;
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}
// 组合
function handleMakeGroup() {
  const selected = data.value.filter(item => item.selected && item.type != 'combination');
  if (selected.length > 1) {
    let value: any[] = JSON.parse(JSON.stringify(selected));
    const Unchecked = data.value.filter(item => !item.selected);
    const top = selected.sort((x, y) => x.top - y.top)[0].top;
    const left = selected.sort((x, y) => x.left - y.left)[0].left;
    const widthArr:number[]=[];
    const heightArr:number[]=[]
    selected.forEach(v=>{
      widthArr.push(v.left+v.width-left);
      heightArr.push(v.top+v.height-top)
    })
    const width=widthArr.sort((x,y)=>y-x)[0];
    const height=heightArr.sort((x,y)=>y-x)[0];
    value = value.map(v => ({
      ...v,
      top: v.top - top,
      left: v.left - left
    }))
    const obj = {
      id: uuid(),
      top,
      left,
      width,
      height,
      selected: true,
      value,
      type: 'combination',
      angle: 0
    }
    data.value = [...Unchecked, obj]
  }
}
// 拆除
function handleDismantle(){
  const selected = data.value.filter(item => item.selected && item.type == 'combination');
  if(selected.length>0){
    let obj:any=[]
    selected.forEach(v=>{
      const items=v.value.map((item:any)=>({...item,top:item.top+v.top,left:v.left+item.left,selected:false}))
      obj.push(...items);
    })
    const Unchecked = data.value.filter(item => !item.selected);
    data.value = [...Unchecked, ...obj]
  }
}
// 记录状态
function recording() {
  if (temp.value?.length && isupd.value) {
    if (!isObjectArraysEqual(temp.value, record.value[record.value.length - 1])) {
      record.value.push(temp.value);
      temp.value = []
      return;
    }
  }
}
// 撤销重做
function quash(type: string) {
  isupd.value = false;
  if (record.value.length != 1) {
    if (type == '撤销' && current.value != 0) {
      current.value = current.value == null ? record.value.length - 1 - 1 : current.value - 1;
      data.value = record.value[current.value];
    } else if (type == '重做' && current.value < record.value.length - 1 && current.value != null) {
      current.value += 1;
      data.value = record.value[current.value];
    }
  }
}
// 选择文件
function selectedFile({ type, message, index }: { type: string, message: Function, index?: number }) {
  const size: any = {
    'image': {
      width: 100,
      height: 100,
      angle: 0
    },
    'audio': {
      width: 300,
      height: 50,
      angle: 0
    },
    'video': {
      width: 300,
      height: 200,
      angle: 0
    },
  }
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = type == 'json' ? '.json' : type + '/*';
  // 添加change事件监听器
  fileInput.addEventListener('change', (event: any) => {
    const files = event.target.files;
    if (files.length > 0) {
      // 获取选中的文件
      const selectedFile = files[0];
      message({ size: size[type], type, file: selectedFile, index })
    }
  });
  // 手动触发文件选择对话框
  fileInput.click();
}

// 插入文件
function insert({ file, index }: any) {
  // 创建 FileReader 对象
  const reader = new FileReader();
  reader.onloadend = function () {
    data.value[index].value = reader.result;
    // 将它变成异步，在watch后执行
    setTimeout(() => {
      recording()
    }, 0)
  };
  // 读取文件并触发 onloadend 事件
  reader.readAsDataURL(file);
}
function reset() {
  addDistance.value = {
    top: 0,
    left: 0
  }
}
// 添加
function push(type: string) {
  isupd.value = true;
  switch (type) {
    case '文本':
      data.value.push({
        id: uuid(),
        type: 'text',
        value: '输入文本',
        width: 200,
        height: 50,
        angle: 0,
        ...addDistance.value
      })
      reset()
      break;
    case '图片':
      data.value.push({
        id: uuid(),
        type: 'image',
        value: 'https://turntip.cn/uploads/sucai/11_189dd429f23.webp',
        width: 100,
        height: 100,
        angle: 0,
        ...addDistance.value
      })
      reset()
      break;
    case '音频':
      data.value.push({
        id: uuid(),
        type: 'audio',
        value: 'https://turntip.cn/uploads/sucai/Just Relax_189bfc7d990.mp3',
        width: 300,
        height: 50,
        angle: 0,
        ...addDistance.value
      })
      reset()
      break;
    case '视频':
      data.value.push({
        id: uuid(),
        type: 'video',
        value: 'https://turntip.cn/uploads/sucai/职场_18b88d7f046.mp4',
        width: 300,
        height: 200,
        angle: 0,
        ...addDistance.value
      })
      reset()
    default:
      break;
  }
}
// 修改内容
function setValue(index: number, type: string, blur = false) {
  isupd.value = true;
  if (type == 'text' || type == 'input') {
    if (blur) {
      data.value[index].type = 'text';
      recording()
    } else {
      data.value[index].type = 'input'
    }
  } else {
    selectedFile({ type, message: insert, index });
  }
}
// 打开导出弹窗
function show() {
  visible.value = !visible.value;
}
// 下载json文件
function download() {
  const content = editorRef.value.save();
  const jsonData = JSON.stringify(content);
  const downloadLink = document.createElement('a');
  downloadLink.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonData));
  downloadLink.setAttribute('download', 'data.json');
  downloadLink.click();
  visible.value = !visible.value;
}
function update() {
  const content = editorRef.value.save();
  data.value = content.data;
  grid.value = content.grid;
  visible.value = !visible.value;
}
// 导入
function inducts() {
  selectedFile({
    type: 'json', message: ({ file }: any) => {
      const reader = new FileReader();
      reader.onload = function (e: any) {
        const content = JSON.parse(e.target.result);
        if (content.data && content.grid) {
          data.value = content.data;
          grid.value = content.grid;
        }
      };
      reader.readAsText(file);
    }
  })
}
function toDooring() {
  window.open('https://dooring.vip')
}
// 将最开始的状态记录下来
onMounted(() => {
  record.value.push(JSON.parse(JSON.stringify(data.value)))
})
</script>

<style lang="scss" scoped>
.es-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  display: flex;
  background: rgb(26, 26, 26);

  .menu {
    width: 200px;
    height: 200px;
    padding: 0 20px;
    box-sizing: border-box;
    padding: 20px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;

    > div {
      width: 45%;
      height: 40px;
      text-align: center;
      line-height: 40px;
      cursor: pointer;
      border: 1px solid #363637;
      border-radius: 10px;
      color: #f7f7f7;
    }
  }

  .content {
    flex: 1;

    .es-editor {
      width: 100%;
      height: 100%;
      position: relative;
      color: gray;

      .es-markline-left,
      .es-markline-top {
        position: absolute;
        border: 1px dashed rgb(58, 122, 254);
      }

      .es-markline-left {
        height: 100%;
        width: 1px;
        top: 0;
      }

      .es-markline-top {
        width: 100%;
        height: 1px;
        left: 0;
      }

      ::v-deep(audio) {
        margin: 0 auto;
        display: block;
      }

      textarea {
        background: transparent;
        border: none;
        color: gray;
        resize: none;
      }

      .item {
        border: 1px solid rgb(58, 122, 254);
        position: absolute;
      }
    }

    .btn-box {
      top: 20px;
      position: absolute;
      right: 20px;
      z-index: 9;
      display: flex;

      .btn {
        height: 50px;
        margin-right: 100px;
        display: flex;
        justify-content: space-between;

        background: white;
        left: calc(100% / 2 - 600px / 2);
        border-radius: 10px;

        .btn-item {
          text-align: center;
          margin: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;

          input {
            width: 30px;
            height: 20px;
            border: none;
            margin-left: 10px;
            background: #e6e3e3;
            text-align: center;
            line-height: 20px;
          }
        }
      }

      .toDooring {
        margin-left: 20px;
        min-width: 220px;
        height: 30px;
        align-items: center;
        display: flex;
        background: #06c;
        color: white;
        padding: 20px;
        cursor: pointer;
        border-radius: 6px;
      }
    }
  }
}
</style>
<style>
.arco-modal-header,
.arco-modal-footer {
  border: none !important;
}

.arco-modal-title {
  color: white !important;
}
</style>
