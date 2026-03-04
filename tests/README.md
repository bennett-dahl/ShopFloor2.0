# Test suite

Run all tests:

```bash
npm run test
```

Watch mode:

```bash
npm run test:watch
```

Coverage:

```bash
npm run test:coverage
```

## MongoDB for tests

By default, tests use **mongodb-memory-server** (in-memory MongoDB). If it fails to start (e.g. on Windows or in CI), set a real MongoDB URI so tests use it instead:

```bash
# Windows (PowerShell)
$env:TEST_MONGODB_URI="mongodb://localhost:27017/shopfloor_test"; npm run test

# Linux / macOS
TEST_MONGODB_URI=mongodb://localhost:27017/shopfloor_test npm run test
```

Use a separate database (e.g. `shopfloor_test`) so tests do not touch dev data.
