# mex-transfer-web

React 19 + Vite 6 + TypeScript backoffice for the CoDi ticket checkout. It talks only to `mex-transfer-api`.

Three views:

1. Events and ticket types, including occupancy.
2. Orders and buyers: name, phone, quantity, amount, status, reference, CoDi tracking key, and access code.
3. Door check-in. Enter the access code. The first scan admits the holder and shows the quantity. A second scan is rejected.

The screen labels stay in Spanish.

## Run

```bash
npm install
npm run dev
```

The dev server is `http://localhost:5173`. That origin is the API CORS default.

```bash
npm run build
```

## Configuration

`VITE_CORE_API_URL` is the `mex-transfer-api` base URL. It defaults to `http://localhost:8080`.

```bash
VITE_CORE_API_URL=http://localhost:8081 npm run dev
```

The browser does not send `INTERNAL_API_TOKEN`. Leave that token empty on the API while using this UI locally, or the create, cancel, and renew calls are rejected.
