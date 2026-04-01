import orchestrator from "tests/orchestrator";

// eslint-disable-next-line no-undef
beforeAll(async () => {
  await orchestrator.waitForAllServices();
}, 60000);
