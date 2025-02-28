<template>
  <div class="w-full h-full bg-bgc flex flex-row items-center justify-between flex-wrap">
    <div class="w-full h-30 flex flex-row justify-start items-center fixed top-3 left-3 z-10">
      <botton @click="syncOther(1)">同步1</botton>
      <botton @click="syncOther(2)">同步2</botton>
      <botton @click="syncOther(3)">同步3</botton>
      <botton @click="syncOther(4)">同步4</botton>

      <botton @click="exitSync(1)">1解除同步</botton>
      <botton @click="exitSync(2)">2解除同步</botton>
      <botton @click="exitSync(3)">3解除同步</botton>
      <botton @click="exitSync(4)">4解除同步</botton>
    </div>

    <div class="container" ref="container1">
    </div>
    <div class="container" ref="container2">
    </div>
    <div class="container" ref="container3">
    </div>
    <div class="container" ref="container4">
    </div>
  </div>

</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { getobjm } from '../scripts/getobjm';
import { ESViewer } from "earthsdk3";
const objm = getobjm();
const container1 = ref<HTMLDivElement>();
const container2 = ref<HTMLDivElement>();
const container3 = ref<HTMLDivElement>();
const container4 = ref<HTMLDivElement>();

let viewer1: ESViewer, viewer2: ESViewer, viewer3: ESViewer, viewer4: ESViewer;

const syncOther = (index: number) => {
  if (index === 1) {
    objm.activeViewer = viewer1;
  } else if (index === 2) {
    objm.activeViewer = viewer2;
  } else if (index === 3) {
    objm.activeViewer = viewer3;
  } else if (index === 4) {
    objm.activeViewer = viewer4;
  }
  objm.syncOtherViewersToActived = true;
}

//退出同步
const exitSync = (index: number) => {
  if (index === 1) {
    viewer1.syncOtherViewer(undefined);
  } else if (index === 2) {
    viewer2.syncOtherViewer(undefined);
  } else if (index === 3) {
    viewer3.syncOtherViewer(undefined);
  } else if (index === 4) {
    viewer4.syncOtherViewer(undefined);
  }
}


nextTick(() => {
  if (!container1.value || !container2.value || !container3.value || !container4.value) return;
  viewer1 = objm.createCesiumViewer(container1.value);
  //@ts-ignore
  window.g_viewer1 = viewer1;
  viewer2 = objm.createCesiumViewer(container2.value);
  //@ts-ignore
  window.g_viewer2 = viewer2;
  viewer3 = objm.createCesiumViewer(container3.value);
  //@ts-ignore
  window.g_viewer3 = viewer3;
  viewer4 = objm.createUeViewer(container4.value, 'http://114.242.26.126:30001/', 'earthsdk');
  //@ts-ignore
  window.g_viewer4 = viewer4;
})


</script>
<style scoped>
.container {
  width: 50%;
  height: 50%;
  box-sizing: border-box;
  border: 1px solid #01fa7d;
  position: relative;
}

botton {
  width: 100px;
  height: 30px;
  margin-right: 10px;
  background-color: #01fa7d;
  border: 1px solid #01fa7d;
  border-radius: 5px;
  cursor: pointer;
  color: #fff;
  font-size: 14px;
  text-align: center;
  line-height: 30px;
  transition: all 0.3s ease-in-out;
}
</style>
