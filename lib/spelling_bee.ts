// Spelling Bee Utility Functions

export const isPangram = (word: string): boolean => (new Set(word)).size == 7;

export function calculateScore(words: string[]): number {
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

// Fetch the game data from the NYT Spelling Bee page
export async function fetchGameData(): Promise<Response> {
  const response = await fetch(
    "https://www.nytimes.com/puzzles/spelling-bee",
  );
  if (!response.ok) {
    return response;
  }

  const body = await response.text();
  const match = body.match(
    />window\.gameData = (\{.*?})<\/script>/,
  );

  if (!match) {
    return new Response(null, {
      status: 400, // not entirely appropriate, but close enough
      statusText: `Error parsing game data. Raw input: ${body}`,
    });
  }

  return Response.json(JSON.parse(match[1]));
}

export function fetchPuzzle(
  authToken: string,
  puzzleId: string,
): Promise<Response> {
  return fetch(
    `https://www.nytimes.com/svc/games/state/spelling_bee/latests?puzzle_ids=${puzzleId}`,
    {
      headers: {
        "Cookie": `NYT-S=${authToken}`,
      },
    },
  );
}
