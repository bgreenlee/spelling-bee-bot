# Spelling Bee Bot

## Developing

`slack run` to run locally, and then interact with @Spelling Bee Bot (Local).

## Deploying

`slack deploy`

## Miscellaneous

* View items in the database: `slack datastore query '{"datastore": "auth"}`
* If nothing is happening when you send commands, you probably need to reset the triggers: `slack triggers create`
* If you are getting multiple responses to one request, you probably have duplicate triggers. Use `slack triggers delete` to interactively delete triggers.

