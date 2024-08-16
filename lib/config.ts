export let SLACK_ENV = "";

try {
  SLACK_ENV = Deno.env.get("SLACK_ENV") || "local"; // get an error if we read this in production
} catch {
  SLACK_ENV = "deployed";
}

export const STORE_AUTH_URL = SLACK_ENV === "local"
  ? "https://slack.com/shortcuts/Ft04N2S8EMDY/577bec46b867e18003fafe573f8015e5"
  : "https://slack.com/shortcuts/Ft04NTFRR200/75386d12c12ef1d9bb9626f97bbe12ec";

console.log("SLACK_ENV", SLACK_ENV);
