import React, { Component } from 'react';

import './app.less';

export default class Main extends Component {
  render() {
    return (
      <section>
        <header>main page</header>
        <section>
          <p>This is a react and vite test program, page name: main</p>
          <p>Now it runs at electron.</p>
        </section>
      </section>
    );
  }
}
