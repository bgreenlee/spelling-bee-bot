import { Trigger } from "deno-slack-api/types.ts";

const storeAuthTrigger: Trigger = {
  type: "shortcut",
  name: "Store your NYT-S Auth Token",
  description: "Stores a user's NYT-S auth token.",
  workflow: "#/workflows/store_auth_workflow",
  inputs: {
    interactivity: {
      value: "{{data.interactivity}}",
    },
    channel: {
      value: "{{data.channel_id}}",
    },
  },
};

export default storeAuthTrigger;
