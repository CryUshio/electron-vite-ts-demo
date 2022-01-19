<template>
  <el-row :gutter="20">
    <el-col :span="8">
      <el-input v-model.number="size" placeholder="输入传输体大小">
        <template #append>KB</template>
      </el-input>
    </el-col>
    <el-col :span="8">
      <el-input v-model.number="concurrent" placeholder="输入传输体大小">
        <template #append>并发</template>
      </el-input>
    </el-col>
    <el-col :span="8">
      <el-radio-group v-model="sendMethod">
        <el-radio-button label="ipc" />
        <el-radio-button label="ipcEmit" />
        <el-radio-button label="ws" />
      </el-radio-group>
    </el-col>
  </el-row>
  <p>
    <el-button type="primary" @click="getFiles">Test Invoke</el-button>
    <el-button type="primary" @click="readFile">Test Event On</el-button>
    <el-button type="primary" @click="resetTable">Clean</el-button>
  </p>
  <el-row :gutter="20" style="margin-bottom: 15px">
    <el-col :span="8">
      <el-input v-model="dps" disabled>
        <template #prepend>kbps</template>
        <template #append>kb/s</template>
      </el-input>
    </el-col>
    <el-col :span="8">
      <el-input v-model="downloadCostAvg" disabled>
        <template #prepend>下行平均耗时</template>
        <template #append>ms</template>
      </el-input>
    </el-col>
  </el-row>
  <el-row>
    <el-table :data="tableData" height="320" border stripe style="width: 100%">
      <el-table-column prop="size" label="数据大小" width="100" />
      <el-table-column prop="concurrent" label="并发数" width="100" />
      <el-table-column prop="uploadCostAvg" label="上行平均耗时(ms)" align="right" />
      <el-table-column prop="downloadCostAvg" label="下行平均耗时(ms)" align="right" />
      <el-table-column prop="totalCostAvg" label="全程平均耗时(ms)" align="right" />
      <el-table-column prop="totalCost" label="总耗时(ms)" align="right" />
    </el-table>
  </el-row>
</template>
<script lang="ts" setup>
import ipc from '../../../renderer/api/ipc';
import ipcEmit from '../../../renderer/api/ipc-emit';
import ws from '../../../renderer/api/ws';
import { onMounted, ref } from 'vue';
import { EventChannel } from '../../../common/const';

interface ITableData {
  size: number;
  concurrent: number;
  uploadCostAvg: number;
  downloadCostAvg: number;
  totalCostAvg: number;
  totalCost: number;
}

const requestMethod = {
  ipc,
  ipcEmit,
  ws,
};

const concurrent = ref(10);
const size = ref(1);
const sendMethod = ref<keyof typeof requestMethod>('ipc');

const dps = ref(0);
const downloadCostAvg = ref(NaN);
const totalCost = ref(0);
const tableData = ref<ITableData[]>([]);
const listenFileReadCount = ref(0);

onMounted(() => {
  let startTime = 0;
  ipc.onFileRead(({ downloadCost }) => {
    if (listenFileReadCount.value === 0) {
      startTime = Date.now() - downloadCost;
    }

    downloadCostAvg.value = avg(downloadCostAvg.value, downloadCost, listenFileReadCount.value);
    listenFileReadCount.value++;

    if (concurrent.value === listenFileReadCount.value) {
      tableData.value.push({
        size: size.value,
        concurrent: concurrent.value,
        uploadCostAvg: 0,
        totalCostAvg: downloadCostAvg.value,
        downloadCostAvg: downloadCostAvg.value,
        totalCost: Date.now() - startTime,
      });
    }
  });
  ws.onFileRead(({ downloadCost }) => {
    downloadCostAvg.value = avg(downloadCostAvg.value, downloadCost, listenFileReadCount.value);
    listenFileReadCount.value++;
  });
});

function getFiles() {
  reset();

  const method = requestMethod[sendMethod.value];
  const startTime = Date.now();
  window.ipcRenderer.removeAllListeners(EventChannel.GET_FILE_EMIT);

  Promise.all(new Array(concurrent.value).fill(0).map(() => method.getFile(size.value))).then(
    (res) => {
      const summary = res.reduce(
        (o, { uploadCost, downloadCost, handleCost }) => {
          return {
            uploadTotal: o.uploadTotal + uploadCost,
            downloadTotal: o.downloadTotal + downloadCost,
            total: o.total + uploadCost + downloadCost + handleCost,
          };
        },
        { uploadTotal: 0, downloadTotal: 0, total: 0 },
      );

      const uploadCostAvg = summary.uploadTotal / concurrent.value;
      const downloadCostAvg = summary.downloadTotal / concurrent.value;
      const totalCostAvg = summary.total / concurrent.value;

      tableData.value.push({
        size: size.value,
        concurrent: concurrent.value,
        uploadCostAvg,
        downloadCostAvg,
        totalCostAvg,
        totalCost: Date.now() - startTime,
      });

      dps.value = Number(((size.value * concurrent.value) / (totalCost.value / 1000)).toFixed(2));
    },
  );
}

function readFile() {
  reset();

  const method = sendMethod.value === 'ipc' ? ipc : ws;

  method.startFileRead(size.value, concurrent.value);
}

function reset() {
  downloadCostAvg.value = 0;
  dps.value = 0;
  totalCost.value = 0;
  listenFileReadCount.value = 0;
}

function resetTable() {
  tableData.value = [];
}

function avg(old: number, num: number, count: number) {
  return Number((isNaN(old) ? num : (old * count + num) / (count + 1)).toFixed(2));
}

function isNaN(n: number) {
  return String(n) === 'NaN';
}
</script>
<style lang="less">
.el-input__inner {
  text-align: right;
}
</style>
