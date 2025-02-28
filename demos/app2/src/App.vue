<template>
  <div class="main">
    <MainBar></MainBar>
    <Container></Container>
  </div>
  <TreeContainer></TreeContainer>
</template>

<script setup lang="ts">
// import { ESObjectsManager } from "earthsdk3";
import { ESObjectsManager } from '@sdkSrc/ESObjectManager';
import Container from './package/Container.vue';
import MainBar from './package/MainBar.vue';
import TreeContainer from './package/TreeContainer.vue';

import { provide } from 'vue';
const props = withDefaults(defineProps<{ objm: ESObjectsManager; }>(), {});
provide('objm', props.objm);
</script>
<style scoped>
.main {
  width: 100%;
  height: 100%;
}
</style>
