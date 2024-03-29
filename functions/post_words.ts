import { SlackAPI, SlackFunction } from "deno-slack-sdk/mod.ts";
import { SlackAPIClient } from "deno-slack-api/types.ts";
import { DATASTORE_NAME } from "../datastores/auth.ts";
import { DefineFunction, Schema } from "deno-slack-sdk/mod.ts";

export const PostWordsFunction = DefineFunction({
  callback_id: "post_words_function",
  title: "Post Words",
  description: "Posts the user's Spelling Bee words",
  source_file: "functions/post_words.ts",
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

const isPangram = (word: string): boolean => (new Set(word)).size == 7;

function calculateScore(words: string[]): number {
  return words.reduce((acc, word) => {
    if (word.length == 4) {
      return acc + 1;
    }
    if (isPangram(word)) {
      return acc + word.length + 7;
    }
    return acc + word.length;
  }, 0);
}

async function postWords(
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
    await client.chat.postMessage({
      channel: channel,
      text:
        // "I couldn't find an auth token for you. Click <https://slack.com/shortcuts/Ft04N2S8EMDY/577bec46b867e18003fafe573f8015e5|here> to set one.",
        "I couldn't find an auth token for you. Click <https://slack.com/shortcuts/Ft04NTFRR200/75386d12c12ef1d9bb9626f97bbe12ec|here> to set one.",
    });
  } else {
    // fetch the words
    const auth_token = items[0]["nyt_token"];
    const response = await fetch(
      `https://www.nytimes.com/svc/games/state/spelling_bee/latest`,
      {
        headers: {
          "nyt-s": auth_token,
        },
      },
    );
    if (!response.ok) {
      console.log("Error fetching game data:", response.statusText);
      return;
    }

    const data = await response.json();
    const words = data["game_data"]["answers"];
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

    // if (!resp.ok) {
    //   console.log("post resp:", resp);
    // }
  }
}

// post the words you missed from yesterday
async function missedWords(
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
    await client.chat.postMessage({
      channel: channel,
      text:
        // "I couldn't find an auth token for you. Click <https://slack.com/shortcuts/Ft04N2S8EMDY/577bec46b867e18003fafe573f8015e5|here> to set one.",
        "I couldn't find an auth token for you. Click <https://slack.com/shortcuts/Ft04NTFRR200/75386d12c12ef1d9bb9626f97bbe12ec|here> to set one.",
    });
  } else {
    // fetch yesterday's word list (& game id)
    let response = await fetch(
      "https://www.nytimes.com/puzzles/spelling-bee",
    );
    if (!response.ok) {
      return await {
        error: `Error fetching game: ${response.statusText}`,
        outputs: {},
      };
    }

    const body = await response.text();
    const match = body.match(
      />window\.gameData = (\{.*?})<\/script>/,
    );
    if (!match) {
      return await {
        error: `Error parsing game data. Raw input: ${body}`,
        outputs: {},
      };
    }

    const gameData = JSON.parse(match[1]).yesterday;
    const gameId = gameData.id;
    const answers = gameData.answers;

    // fetch the words
    const auth_token = items[0]["nyt_token"];
    response = await fetch(
      `https://www.nytimes.com/svc/games/state/spelling_bee/latest?puzzle_id=${gameId}`,
      {
        headers: {
          "nyt-s": auth_token,
        },
      },
    );
    if (!response.ok) {
      console.log("Error fetching game data:", response.statusText);
      return;
    }

    const data = await response.json();
    const words = data.game_data.answers;

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

export default SlackFunction(
  PostWordsFunction,
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
      case "help":
      default:
        await client.chat.postMessage({
          channel: inputs.channel,
          text:
            "Here's what I know how to do:\n  *words* - post your words\n  *help* - this message",
        });
        break;
    }

    return await {
      outputs: {},
    };
  },
);
