<template>
  <div>
    <canvas id="c" width="2000" height="2000" style="border: 1px solid #ccc"></canvas>
  </div>
</template>

<script setup>
import { fabric } from 'fabric';
import { ref, onMounted } from 'vue';

const mCanvas = ref();

onMounted(() => {
  console.log('라이프 훅 실행');
  initHTML();
  setListener();
})

function initHTML() {
  const canvas = new fabric.Canvas('c', {
    selection: false,
  });
  mCanvas.value = canvas
}

function setListener() {
  const canvas = mCanvas.value;
  let line, isDown;
  console.log('이벤트 리스터 설정2');
  canvas.on('mouse:down', (o) => {
    console.log('마우스 누름 이벤트 설정')
    isDown = true
    const pointer = canvas.getPointer(o.e);
    const point = [pointer.x, pointer.y, pointer.x, pointer.y];
    line = new fabric.Line(point, {
      id: `wall-${Date.now()}`,
      stroke: '#5865f2',
      strokeWidth: 5,
      fill: 'rgba(0, 0, 0, 128)',
      originX: 'center',
      originY: 'center',
    })

    canvas.add(line);
  })
  canvas.on('mouse:move', (o) => {
    if (!isDown) return;
    console.log('마우스 움직임 이벤트 설정')

    const pointer = canvas.getPointer(o.e);
    line.set({
      x2: pointer.x,
      y2: pointer.y,
    })
    canvas.renderAll();
  })
  canvas.on('mouse:up', () => {
    isDown = false;
  })
}
</script>
