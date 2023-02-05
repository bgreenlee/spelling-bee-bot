import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { StoreAuthFunction } from "../functions/store_auth.ts";

export const StoreAuthWorkflow = DefineWorkflow({
  callback_id: "store_auth_workflow",
  title: "Store Auth",
  description: "Stores your NYT auth token.",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channel: {
        type: Schema.slack.types.channel_id,
      },
    },
    required: ["interactivity"],
  },
});

export const SetupWorkflowForm = StoreAuthWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "NYT Auth Cookie",
    submit_label: "Submit",
    description:
      "1. Open <https://www.nytimes.com/puzzles/spelling-bee|Spelling Bee>.\n" +
      "2. Open the browser console (on the Mac: ⌥⌘C in Safari, ⌥⌘J in Chrome) and enter:\n" +
      "```window.prompt('Your cookie:', document.cookie.split('; ').find(c => c.startsWith('NYT-S')).split('=')[1])```\n" +
      "3. Copy the displayed token and paste it below.",
    interactivity: StoreAuthWorkflow.inputs.interactivity,
    fields: {
      required: ["authInput"],
      elements: [
        {
          name: "authInput",
          title: "Your NYT-S cookie value:",
          type: Schema.types.string,
          long: true,
        },
      ],
    },
  },
);

StoreAuthWorkflow.addStep(Schema.slack.functions.SendEphemeralMessage, {
  channel_id: StoreAuthWorkflow.inputs.channel, //"C04MN819L4T", //SetupWorkflowForm.outputs.fields.channel,
  user_id: StoreAuthWorkflow.inputs.interactivity.interactor.id,
  message: `Your auth token was successfully stored! :white_check_mark:`,
});

StoreAuthWorkflow.addStep(StoreAuthFunction, {
  nyt_token: SetupWorkflowForm.outputs.fields.authInput,
  user_id: StoreAuthWorkflow.inputs.interactivity.interactor.id,
});

export default StoreAuthWorkflow;
