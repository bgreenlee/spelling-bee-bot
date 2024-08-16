import { SlackAPIClient } from "deno-slack-api/types.ts";
import { DATASTORE_NAME } from "../datastores/auth.ts";
import {
  calculateScore,
  fetchGameData,
  fetchPuzzle,
  isPangram,
} from "../lib/spelling_bee.ts";
import { STORE_AUTH_URL } from "../lib/config.ts";

export async function postWords(
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
  // console.log("**** got result:", result);
  const items = result["items"];
  if (items.length == 0) {
    await client.chat.postEphemeral({
      user: user_id,
      channel: channel,
      text:
        `I couldn't find an auth token for you. Click <${STORE_AUTH_URL}|here> to set one.`,
    });
    return;
  }

  // fetch the words
  let response = await fetchGameData();
  if (!response.ok) {
    await client.chat.postEphemeral({
      user: user_id,
      channel: channel,
      text:
        `There was an error fetching the game data: ${response.statusText} (${response.status})`,
    });
    return;
  }
  const gameData = await response.json();
  const puzzleId = gameData.today.id;

  const authToken = items[0]["nyt_token"];

  response = await fetchPuzzle(authToken, puzzleId);
  // console.log("***** response:", response);
  if (!response.ok) {
    if (response.status === 403) {
      await client.chat.postEphemeral({
        user: user_id,
        channel: channel,
        text: "Your auth token is invalid. Try `reset` to set a new one.",
      });
    } else {
      await client.chat.postEphemeral({
        user: user_id,
        channel: channel,
        text:
          `There was an error fetching the game data: ${response.statusText} (${response.status})`,
      });
    }
    return;
  }

  const data = await response.json();
  const words = data.states[0].game_data.answers;
  const score = calculateScore(words);
  words.sort();
  const formattedWords = words.map((word: string) => {
    // capitalize first letter
    const capWord = word.charAt(0).toUpperCase() + word.slice(1);
    // highlight pangrams
    if (isPangram(word)) {
      return `*${capWord}*`;
    }
    return capWord;
  });

  await client.chat.postMessage({
    channel: channel,
    text: `Your score is ${score}...`,
  });

  // find the message to post to
  let messageTs = null;
  const messagesResp = await client.conversations.history({
    channel: channel,
  });
  if (messagesResp.ok) {
    for (const message of messagesResp["messages"]) {
      if (message.bot_id && message.text.indexOf("Your score is") === 0) {
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
