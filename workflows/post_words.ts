import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { PostWordsFunction } from "../functions/post_words.ts";

export const PostWordsWorkflow = DefineWorkflow({
  callback_id: "post_words",
  title: "Post your Spelling Bee words",
  description: "Posts your Spelling Bee words to the channel.",
  input_parameters: {
    properties: {
      channel: {
        type: Schema.slack.types.channel_id,
      },
      triggered_user: {
        type: Schema.slack.types.user_id,
      },
      text: {
        type: Schema.types.string,
      },
      timestamp: {
        type: Schema.types.string,
      },
    },
    required: ["channel", "triggered_user", "text", "timestamp"],
  },
});

PostWordsWorkflow.addStep(PostWordsFunction, {
  channel: PostWordsWorkflow.inputs.channel,
  triggered_user: PostWordsWorkflow.inputs.triggered_user,
  text: PostWordsWorkflow.inputs.text,
  timestamp: PostWordsWorkflow.inputs.timestamp,
});
