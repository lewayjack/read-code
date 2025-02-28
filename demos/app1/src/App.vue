<template>
  <Container></Container>
</template>

<script setup lang="ts">
// import { ESObjectsManager } from "earthsdk3";

import { ESObjectsManager } from '@sdkSrc/ESObjectManager';
import Container from './components/Container.vue';
import { provide } from 'vue';
const props = withDefaults(defineProps<{ objm: ESObjectsManager; }>(), {});
provide('objm', props.objm);
</script>
