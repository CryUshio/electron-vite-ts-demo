<template>
  <div>
    <div>Vue</div>
    <el-row class="mb-4">
      <el-button type="primary" @click="switchRoute('home')">Home</el-button>
      <el-button type="primary" @click="switchRoute('contact')">Contact</el-button>
    </el-row>
    <el-divider />
    <router-view v-slot="{ Component }">
      <component :is="Component" />
      <!-- <keep-alive>
      </keep-alive> -->
    </router-view>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
const router = useRouter();

function switchRoute(name: string) {
  router.replace({ name });
}
</script>

<style lang="less">
#app {
  text-align: center;
  margin-top: 20px;
}
</style>
