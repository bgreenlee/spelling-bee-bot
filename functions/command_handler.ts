import { SlackAPI, SlackFunction } from "deno-slack-sdk/mod.ts";
import { DefineFunction, Schema } from "deno-slack-sdk/mod.ts";
import { postWords } from "./post_words.ts";
import { missedWords } from "./missed_words.ts";
import { resetAuth } from "./reset_auth.ts";
import { SLACK_ENV, STORE_AUTH_URL } from "../lib/config.ts";

export const CommandHandlerFunction = DefineFunction({
  callback_id: "command_handler_function",
  title: "Command Handler",
  description: "Handles Spelling Bee Bot commands",
  source_file: "functions/command_handler.ts",
  input_parameters: {
    properties: {
      channel: {
        type: Schema.slack.types.channel_id,
        description: "Channel where the event was triggered",
      },
      triggered_user: {
        type: Schema.slack.types.user_id,
        description: "User that triggered the event",
      },
      text: {
        type: Schema.types.string,
        description: "The message the user sent",
      },
      timestamp: {
        type: Schema.types.string,
        description: "The time the event was triggered",
      },
    },
    required: ["channel", "triggered_user", "text", "timestamp"],
  },
});

export default SlackFunction(
  CommandHandlerFunction,
  async ({ inputs, token }) => {
    const client = SlackAPI(token, {});

    // extract the command
    const command = inputs.text.substring(inputs.text.indexOf(">") + 2).trim();
    switch (command.toLowerCase()) {
      case "words":
        await postWords(
          client,
          inputs.triggered_user,
          inputs.channel,
          inputs.timestamp,
        );
        break;
      case "missed":
      case "missing":
        await missedWords(
          client,
          inputs.triggered_user,
          inputs.channel,
          inputs.timestamp,
        );
        break;
      case "reset":
        await resetAuth(client, inputs.triggered_user, inputs.channel);
        break;
      case "debug":
        await client.chat.postEphemeral({
          user: inputs.triggered_user,
          channel: inputs.channel,
          text: `
SLACK_ENV: ${SLACK_ENV}
STORE_AUTH_URL: ${STORE_AUTH_URL}
`,
        });
        break;
      case "help":
      default:
        await client.chat.postMessage({
          channel: inputs.channel,
          text: `
Here's what I know how to do:
*words* - post your words
*missed* - show the words you missed from yesterday
*reset* - reset your auth token
*help* - this message
`,
        });
        break;
    }

    return await {
      outputs: {},
    };
  },
);
