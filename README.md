# send-slack-invite
 
Small webhook that uses the Slack SCIM API and Puppeteer to invite a user to a Slack workspace.

Disclaimer: this could stop working at literally any time!

## Why?

Slack doesn't provide a simple way to programmatically invite users to a workspace [unless you're on an Enterprise plan](https://api.slack.com/methods/admin.users.invite) 🙃. There used to be an undocumented API, but it [no longer works except with legacy tokens](https://stackoverflow.com/questions/30955818/slack-api-team-invitation) (unavailable to all new apps).

This leaves us with [SCIM](https://api.slack.com/scim#scim-api-endpoints__users), intended for use with SSO and external identity management. **The SCIM API is unfortunately only available to Pro workspaces.** 

When you provision a user with SCIM, it doesn't send the usual invite email. This tool provides an endpoint to create a user using SCIM and then request a new invite email be sent through Slack's password reset page. When you request a password reset for a user provisioned through SCIM*, Slack notices that the user hasn't accepted the invite yet and sends a new one.

<img width="525" alt="screenshot 2021-03-10 at 12 21 45AM" src="https://user-images.githubusercontent.com/1895116/110581176-052e3c80-8138-11eb-85fd-0715586ce7b3.png">

\* The user must be provisioned with a password in order for this to work.

## Usage

Make sure to [read the notes about generating tokens](https://api.slack.com/scim#accessing-the-scim-api__particulars-of-permissions) for use with SCIM.

Example request:

```
POST /user
```
```json
{
  "name": "User McExample",
  "email": "user@example.com"
}
```

Successful response:

```json
{
  "user": { ... },
  "invited": true
}
```

If the `invited` property is missing from the response, a user with the email already exists and we have skipped requesting an invite email.

There are a few reasons why user creation can fail, mostly related to the required `username` field (which Slack no longer displays). We default to passing in the email (the API will strip everything after the `@`) and try to [catch and fix](https://github.com/bedstuystrong/resend-slack-invite/blob/main/slack.js#L57) a few common username errors. 

## Authentication

*TODO this could be more secure*

Set the `TOKEN` environment variable to a randomly generated secret. Use this as a [Bearer token](https://learning.postman.com/docs/sending-requests/authorization/#bearer-token) in the `Authorization` header of the request. Consider also not exposing the service to the web and keeping it inside your cloud network's firewall.

## Development

```
cp sample.env .env
docker container run -it --rm -v $(pwd):/usr/src/app -p 3000:3000 --cap-add=SYS_ADMIN zenika/alpine-chrome:with-puppeteer node index.js
```

## Deployment

cloud run: 512mb
