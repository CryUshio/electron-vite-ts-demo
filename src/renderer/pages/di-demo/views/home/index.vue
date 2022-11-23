<template>
  <div>
    <p>Home Page</p>
    <el-row justify="center">
      <el-button type="primary" @click="bind">bind</el-button>
      <!-- <el-button type="danger" @click="dispose">dispose</el-button> -->
      <el-button @click="getSize">getSize</el-button>
      <el-button type="warning" @click="invoke">invoke</el-button>
    </el-row>
  </div>
</template>

<script lang="ts" src="./index.ts"></script>

<style lang="less"></style>
