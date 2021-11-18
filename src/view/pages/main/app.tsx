import { defineComponent, onMounted, ref, withModifiers } from 'vue';

import './app.less';

export default defineComponent({
  setup: () => {
    const count = ref(0);

    const inc = () => {
      count.value++;
    };

    onMounted(() => {
      setInterval(() => {
        inc();
      }, 1000);
    });

    return () => (
      <section>
        <header>main page</header>
        <section onClick={withModifiers(inc, ['self'])}>
          <p>This is a vue3.0 and vite test program, page name: main</p>
          <p>Now it runs at electron.</p>
          <p>count: {count.value}</p>
        </section>
      </section>
    );
  },
});
