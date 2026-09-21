import { setupServer } from 'msw/node'

// No handlers yet: Phase 1 only wires MSW into the test setup so future
// features (Phase 8+) can register request handlers per feature without
// re-plumbing this file.
export const server = setupServer()
