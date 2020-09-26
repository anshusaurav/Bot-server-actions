
const { createEventAdapter } = require('@slack/events-api');
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;

const slackEvents = createEventAdapter(slackSigningSecret);

module.exports = slackEvents;