import { Component, createElement, createRef, Fragment } from "preact";

export interface State {
  lists: List[];
  active: number;
  menuActive?: boolean;
}

export interface List {
  name: string;
  items: string[];
}

export class TodoList extends Component<{}, State> {
  newList = createRef<HTMLInputElement>();
  newItem = createRef<HTMLInputElement>();
  activeItems = createRef<HTMLUListElement>();

  constructor() {
    super();

    const states = localStorage.getItem("lists.state");
    try {
      this.state = JSON.parse(states ?? "{invalid}");
    } catch {
      console.warn("Failed to get lists, saving to lists.state.old");
      localStorage.setItem("lists.state.old", states ?? "");
      this.state = { lists: [], active: -1 };
    }
  }

  setState(state: Partial<State>) {
    super.setState(state, () => {
      localStorage.setItem("lists.state", JSON.stringify(this.state));
    });
  }

  addNewList() {
    const name = this.newList.current?.value;
    if (!name) return;

    this.setState({
      lists: [
        ...this.state.lists,
        {
          name,
          items: [],
        },
      ],
      active: this.state.lists.length,
    });
  }

  deleteActiveList() {
    if (confirm("Are you sure?")) {
      this.setState({
        lists: [
          ...this.state.lists.slice(0, this.state.active),
          ...this.state.lists.slice(this.state.active + 1),
        ],
        active: Math.min(this.state.lists.length - 2, this.state.active - 1),
      });
    }
  }

  renderActiveList() {
    if (this.state.active === -1) {
      return <p>No active list</p>;
    }

    const active = this.state.lists[this.state.active];

    const update = (event?: Event) => {
      const e = event as KeyboardEvent | undefined;

      const items = Array.from(
        this.activeItems.current!.querySelectorAll("input"),
        (el) => el.value
      ).filter(Boolean);
      this.setState({
        lists: [
          ...this.state.lists.slice(0, this.state.active),
          { name: active.name, items },
          ...this.state.lists.slice(this.state.active + 1),
        ],
      });
    };

    const enter = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        this.newItem.current?.focus();
      } else if (event.key == "ArrowDown") {
        (event.target as any).parentElement?.nextElementSibling?.lastElementChild?.focus();
      } else if (event.key == "ArrowUp") {
        (event.target as any).parentElement?.previousElementSibling?.lastElementChild?.focus();
      }
    };

    const markCompleted = (idx: number) => {
      (this.activeItems.current!.children[idx]
        .lastElementChild as HTMLInputElement).value = "";
      update();
    };

    const items = active.items.map((value, idx) => {
      return (
        <li key={idx}>
          <button onClick={() => markCompleted(idx)}>✓</button>
          <input
            class="list-item"
            value={value}
            onInput={update}
            onKeyUp={enter}
          />
        </li>
      );
    });
    items.push(
      <li key={active.items.length}>
        <span />
        <input
          class="list-item"
          placeholder="New"
          ref={this.newItem}
          onInput={update}
          onKeyUp={enter}
        />
      </li>
    );

    return (
      <>
        <h3>{active.name}</h3>
        <ul ref={this.activeItems}>{items}</ul>
        <button onClick={() => this.deleteActiveList()}>Delete</button>
      </>
    );
  }

  renderLists() {
    return (
      <ul>
        {this.state.lists.map((list, idx) => {
          return (
            <li
              key={idx}
              onClick={() => this.setState({ active: idx })}
              class={idx === this.state.active ? "active" : ""}
            >
              {list.name}
            </li>
          );
        })}
      </ul>
    );
  }

  render() {
    return (
      <main class={this.state.menuActive ? "menu" : ""}>
        <nav>
          <button
            aria-label="Menu"
            onClick={() =>
              this.setState({ menuActive: !this.state.menuActive })
            }
          >
            ☰
          </button>
        </nav>
        <div class="lists">
          {this.renderLists()}
          <input ref={this.newList} />
          <button onClick={() => this.addNewList()}>New List</button>
        </div>
        <div class="active-list">{this.renderActiveList()}</div>
      </main>
    );
  }
}
