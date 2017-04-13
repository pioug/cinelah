import { h, render, Component } from 'preact';

class Cinelah extends Component {
  render() {
    return (
      <main>
        <nav>
          <span class="logotype">Cine</span>
        </nav>
        <section>
          <input type="search" class="search" spellcheck="false" />
        </section>
      </main>
    );
  }
}

render(<Cinelah />, document.body);
