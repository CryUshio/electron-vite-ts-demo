import { defineComponent } from "vue";

import './app.less';

export default defineComponent({
  setup: () => {
    return () => (
      <section>
        <header>config page</header>
        <section>
          <p>This is a vue3.0 and vite test program, page: config</p>
        </section>
      </section>
    );
  }
})
