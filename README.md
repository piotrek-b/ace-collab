# Ace Collab

### Prerequisites

Make sure that you have installed:
- *NodeJS* (v8.10.0)
- *npm* (v3.5.2)

### Usage

1. Install `ace-collab` as a dependency using `npm`:

```
npm install ace-collab
```

#### Editor

1. Import `Editor` from `ace-collab`:

```javascript
import Editor from 'ace-collab'
```

2. Initialize new `Editor` instance:
```javascript
const editorConfig = {
  anchorDOM: document.querySelector('#editor'),
  mode: 'ace/mode/csharp',
  theme: 'ace/theme/monokai',
}

const editor = new Editor(editorConfig)
```

3. Initialize new collab session by using `init` method:
```javascript
const serverConfig = {
  docId: '', // Provide empty if want to create new session, provide value if want to join existing one
  host: '127.0.0.1',
  port: '3333',
  username: 'John Doe',
  ssl: false,
}
const readOnly = false // if set to true, only admin will be able to modify the code
const open = false // if set to true, users can join without admin's permission

editor.init(serverConfig, { readOnly, open });
```


#### Server

1. Import and run `startServer` function from `ace-collab`:
```javascript
import startServer from 'ace-collab/lib/server'

const serverConfig = {
  allowedOrigins: [], // Provide empty if want to allow entrance for every host, provide string values if want to allow only few
  host: '0.0.0.0',
  port: 3333,
}

startServer(serverConfig)
```
