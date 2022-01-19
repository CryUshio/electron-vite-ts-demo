import { defineComponent, onMounted, ref, withModifiers } from 'vue';

import './app.less';

export default defineComponent({
  setup: () => {
    const times = ref(0);

    const inc = () => {
      times.value++;
    };

    return () => (
      <section>
        <header>performace</header>
        <section onClick={withModifiers(inc, ['self'])}>
          <el-button type="primary">Primary</el-button>
          <p>times: {times.value}</p>
        </section>
      </section>
    );
  },
});
