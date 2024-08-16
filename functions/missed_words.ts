import { SlackAPIClient } from "deno-slack-api/types.ts";
import { DATASTORE_NAME } from "../datastores/auth.ts";
import { fetchGameData, fetchPuzzle, isPangram } from "../lib/spelling_bee.ts";
import { STORE_AUTH_URL } from "../lib/config.ts";

// post the words you missed from yesterday
export async function missedWords(
  client: SlackAPIClient,
  user_id: string,
  channel: string,
  _timestamp: string,
) {
  // Querying datastore for stored token
  const result = await client.apps.datastore.query({
    datastore: DATASTORE_NAME,
    expression: "user_id = :user_id",
    expression_values: { ":user_id": user_id },
  });
  // console.log("got result:", result);
  const items = result["items"];
  if (items.length == 0) {
    await client.chat.postEphemeral({
      user: user_id,
      channel: channel,
      text:
        `I couldn't find an auth token for you. Click <${STORE_AUTH_URL}|here> to set one.`,
    });
  } else {
    let response = await fetchGameData();
    if (!response.ok) {
      return await {
        error: `Error fetching game: ${response.statusText}`,
        outputs: {},
      };
    }

    const gameData = await response.json();
    const puzzleId = gameData.yesterday.id;
    const answers = gameData.yesterday.answers;

    // fetch the words
    const authToken = items[0]["nyt_token"];
    response = await fetchPuzzle(authToken, puzzleId);
    if (!response.ok) {
      if (response.status === 403) {
        await client.chat.postEphemeral({
          user: user_id,
          channel: channel,
          text: "Your auth token is invalid. Try `reset` to set a new one.",
        });
      } else {
        console.log(
          "Error fetching game data:",
          response.statusText,
          response.status,
        );
      }
      return;
    }

    const data = await response.json();
    const words = data.states[0].game_data.answers;

    // figure out missing words
    const missedWords = [];
    for (const answer of answers) {
      if (!words.includes(answer)) {
        missedWords.push(answer);
      }
    }

    missedWords.sort();
    const formattedWords = missedWords.map((word: string) => {
      // capitalize first letter
      const capWord = word.charAt(0).toUpperCase() + word.slice(1);
      // highlight pangrams
      if (isPangram(word)) {
        return `*${capWord}*`;
      }
      return capWord;
    });

    if (missedWords.length === 0) {
      await client.chat.postMessage({
        channel: channel,
        text: `You didn't miss any words yesterday! :queen-bee:`,
      });
    } else {
      await client.chat.postMessage({
        channel: channel,
        text: `Here are the words you missed yesterday...`,
      });

      // find the message to post to
      let messageTs = null;
      const messagesResp = await client.conversations.history({
        channel: channel,
      });
      if (messagesResp.ok) {
        for (const message of messagesResp["messages"]) {
          if (
            message.bot_id && message.text.indexOf("Here are the words") === 0
          ) {
            messageTs = message.ts;
            break;
          }
        }
      } else {
        console.log("Error fetching message history:", messagesResp.error);
      }

      await client.chat.postMessage({
        channel: channel,
        thread_ts: messageTs,
        text: formattedWords.join("\n"),
      });
    }
  }
}
