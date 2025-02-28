<template>
  <div id="container" ref="container">

  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue';
import { getobjm } from '../scripts/getobjm';
import { ESUeViewer } from "earthsdk3-ue";
const objm = getobjm();
const container = ref<HTMLDivElement>()


nextTick(() => {
  if (!container.value) return;
  const opt = {
    type: 'ESUeViewer',
    container: container.value,
    options: { projectTest: 'earthsdk' }
  }
  const viewer = objm.createViewer(opt) as ESUeViewer;
  viewer.debug = true;
  viewer.statusUpdateInterval = 0;
  // objm.createCesiumViewer(container.value);
  // objm.createUeViewer(container.value, 'http://114.242.26.126:30001/', 'ysp_dp');

  const don = objm.viewerSwitchEvent.don((type) => {
    console.log(type);
    if (!container.value) return;
    if (type === 'ue') {
      objm.switchViewer(opt);
      // objm.createUeViewer(container.value, 'http://114.242.26.126:30001/', 'earthsdk3');
    } else {
      objm.switchToCesiumViewer(container.value);
    }
  })

  // const don1 = objm.activeViewerChanged.don((e) => {
  //   const { activeViewer } = objm;
  //   if (!activeViewer || !(activeViewer instanceof ESUeViewer)) return;
  //   activeViewer.d(activeViewer.clickEvent.don(async (e) => {

  //     const viewerContainer = activeViewer.container;
  //     if (!viewerContainer) return;
  //     //width,height
  //     const width = viewerContainer.clientWidth;
  //     const height = viewerContainer.clientHeight;
  //     console.log('clickEvent', e.screenPosition, width, height);
  //     const res1 = await activeViewer.uePick(e.screenPosition, undefined, undefined, width, height);
  //     const res2 = await activeViewer.pick(e.screenPosition);
  //     console.log('uePick', res1);
  //     console.log('pick', res2);
  //   }))
  // })

  onBeforeUnmount(() => {
    don();
  })
  // const sceneobject = objm.createSceneObjectFromClass(ESGeoPolygon);
  // sceneobject.points = [[-108.0, 25.0, 100000], [-100.0, 25.0, 100000], [-100.0, 30.0, 100000], [-108.0, 30.0, 300000]];

})

</script>
<style scoped>
#container {
  width: 100%;
  height: calc(100% - 40px);
  /* background-color: #64927370; */
}
</style>
