import { SlackFunction } from "deno-slack-sdk/mod.ts";
import { SlackAPI } from "deno-slack-api/mod.ts";
import { DATASTORE_NAME } from "../datastores/auth.ts";
import { DefineFunction, Schema } from "deno-slack-sdk/mod.ts";

export const StoreAuthFunction = DefineFunction({
  callback_id: "store_auth_function",
  title: "Store Auth",
  description: "Takes a auth token and stores it in the datastore",
  source_file: "functions/store_auth.ts",
  input_parameters: {
    properties: {
      nyt_token: {
        type: Schema.types.string,
        description: "The NYT-S auth token",
      },
      user_id: {
        type: Schema.slack.types.user_id,
        description: "The user ID of the person who this token belongs to.",
      },
    },
    required: ["nyt_token"],
  },
});

export default SlackFunction(
  StoreAuthFunction,
  async ({ inputs, token }) => {
    const client = SlackAPI(token, {});

    const uuid = crypto.randomUUID();

    const putResponse = await client.apps.datastore.put({
      datastore: DATASTORE_NAME,
      item: {
        id: uuid,
        nyt_token: inputs.nyt_token,
        user_id: inputs.user_id,
      },
    });

    if (!putResponse.ok) {
      return await {
        error: putResponse.error,
        outputs: {},
      };
    } else {
      return await {
        outputs: {},
      };
    }
  },
);
