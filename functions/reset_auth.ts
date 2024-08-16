import { SlackAPIClient } from "deno-slack-api/types.ts";
import { DATASTORE_NAME } from "../datastores/auth.ts";
import { STORE_AUTH_URL } from "../lib/config.ts";

export async function resetAuth(
  client: SlackAPIClient,
  user_id: string,
  channel: string,
) {
  // query the datastore by user_id so we can retreive the id of the token to delete
  const result = await client.apps.datastore.query({
    datastore: DATASTORE_NAME,
    expression: "user_id = :user_id",
    expression_values: { ":user_id": user_id },
  });

  const items = result["items"];
  if (items.length == 0) {
    await client.chat.postEphemeral({
      user: user_id,
      channel: channel,
      text:
        `I couldn't find an auth token for you. Click <${STORE_AUTH_URL}|here> to set one.`,
    });
  } else {
    // delete all the tokens for this user
    const ids = items.map((item) => item.id);
    // delete the token using the id we got from the query
    const response = await client.apps.datastore.bulkDelete({
      datastore: DATASTORE_NAME,
      ids: ids,
    });

    if (response.ok) {
      await client.chat.postEphemeral({
        user: user_id,
        channel: channel,
        text:
          `I couldn't find an auth token for you. Click <${STORE_AUTH_URL}|here> to set one.`,
      });
    } else {
      await client.chat.postEphemeral({
        user: user_id,
        channel: channel,
        text: "There was an error deleting your auth token: " + response.error,
      });
    }
  }
}
