Hosted at [https://alex.miller.garden/sonic-circuit](https://alex.miller.garden/sonic-circuit).

### To run

```
python3 -m http.server
```

Go to localhost:8000/ in browser.

### Controls

Warning: not user friendly.

- Command + click: add new node
- Command + drag: add edge between nodes
- Double click: trigger a signal on a node
- Click + drag: move node
- Option + drag up/down: change node note
- `~` + drag: change node mode
- Click + delete: remove node

### Modes of nodes

- **multicast**: broadcasts out to all edges simultaneously
- **round-robin**: broadcasts out to each edge in turn
- **random**: not yet implemented but you can see where this is going
