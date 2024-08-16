import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { CommandHandlerFunction } from "../functions/command_handler.ts";

export const CommandHandlerWorkflow = DefineWorkflow({
  callback_id: "spelling_bee_bot_command_handler",
  title: "Spelling Bee Bot Command Handler",
  description: "Spelling Bee Bot Command Handler",
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

CommandHandlerWorkflow.addStep(CommandHandlerFunction, {
  channel: CommandHandlerWorkflow.inputs.channel,
  triggered_user: CommandHandlerWorkflow.inputs.triggered_user,
  text: CommandHandlerWorkflow.inputs.text,
  timestamp: CommandHandlerWorkflow.inputs.timestamp,
});
