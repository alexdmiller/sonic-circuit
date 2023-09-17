### To run

```
python3 -m http.server
```

Go to localhost:8000/ in browser.

### Controls

Warning: not user friendly.

- **Command + click:** add new node
- **Command + drag:** add edge between nodes
- **Option + drag up/down:** change node note
- **Shift + drag**: move node
- **~ + drag**: change node mode
- **Click + delete**: remove node

### Modes of nodes

- **multicast**: broadcasts out to all edges simultaneously
- **round-robin**: broadcasts out to each edge in turn
- **random**: not yet implemented but you can see where this is going
