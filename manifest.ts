import { Manifest } from "deno-slack-sdk/mod.ts";
import { AuthDatastore } from "./datastores/auth.ts";
import { StoreAuthWorkflow } from "./workflows/store_auth.ts";
import { CommandHandlerWorkflow } from "./workflows/command_handler.ts";

export default Manifest({
  name: "Spelling Bee Bot",
  description: "NYT Spelling Bee Helper Bot",
  icon: "assets/icon.png",
  workflows: [StoreAuthWorkflow, CommandHandlerWorkflow],
  outgoingDomains: ["www.nytimes.com", "edge.games.nyti.nyt.net", "esm.sh"],
  datastores: [AuthDatastore],
  botScopes: [
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
    "channels:read",
    "channels:history",
    "triggers:write",
    "app_mentions:read",
  ],
});
