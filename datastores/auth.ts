import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export const DATASTORE_NAME = "auth";

export const AuthDatastore = DefineDatastore({
  name: DATASTORE_NAME,
  primary_key: "id",
  attributes: {
    id: {
      type: Schema.types.string,
    },
    nyt_token: {
      type: Schema.types.string,
    },
    user_id: {
      type: Schema.slack.types.user_id,
    },
  },
});
