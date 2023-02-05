import { Trigger } from "deno-slack-api/types.ts";

const postWordsTrigger: Trigger = {
  type: "event",
  name: "App mentioned response",
  description: "Triggers when the app is mentioned",
  workflow: "#/workflows/post_words",
  event: {
    event_type: "slack#/events/app_mentioned",
    channel_ids: ["C04MN819L4T", "C01V1BP35U1"],
  },
  inputs: {
    channel: {
      value: "{{data.channel_id}}",
    },
    triggered_user: {
      value: "{{data.user_id}}",
    },
    text: {
      value: "{{data.text}}",
    },
    timestamp: {
      value: "{{event_id}}",
    },
  },
};

export default postWordsTrigger;
