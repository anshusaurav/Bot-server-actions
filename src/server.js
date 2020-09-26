const { createServer } = require('http');
const express = require("express");
const bodyParser = require("body-parser");
const CronJob = require("cron").CronJob;
const fetch = require("node-fetch");
const { WebClient } = require("@slack/web-api");
const token = process.env.SLACK_BOT_TOKEN;
const web = new WebClient(token);
const { v4: uuidv4 } = require("uuid");
const slackEvents = require('./../slackEvents');
const crons = {};
const PORT = process.env.PORT || 3000;
// C01B8HWFN49 bot-test false 7
// C01C1690AU8 bot-test2 false 1
const timeStamp = () => {
  var date = new Date();
  var seconds = ("0" + date.getSeconds()).slice(-2);
  var minutes = ("0" + date.getMinutes()).slice(-2);
  var hour = ("0" + date.getHours()).slice(-2);
  return `${hour}:${minutes}:${seconds}`;
};

const app = express();
app.use('/slack/events', slackEvents.requestListener());
app.use(bodyParser.json());

const server = createServer(app);

slackEvents.on('message', event => {
  console.log(event);
});

const HASURA_INSERT_OPERATION = `
mutation insertStandup($name: String!, $cron_text: String!, $channel: String!, $message: String! ) {
  insert_standup_one(
    object: {
      name: $name
      cron_text: $cron_text
      channel:$channel
      message: $message
    }) {
    id
    name
    message
    cron_text
    channel
  }
}
`;

const HASURA_INSERT_SUBOPERATION = `
mutation insertCronjob($standup_id: uuid!){
  insert_cronjob_one(object: {standup_id:$standup_id}){
    id,
    standup_id
  }
}
`;

const executeOperation = async (variables, operation) => {
  const headers = {
    "x-hasura-admin-secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET
  };

  const fetchResponse = await fetch(
    "https://hopeful-squirrel-40.hasura.app/v1/graphql",
    {
      method: "POST",
      body: JSON.stringify({
        query: operation,
        variables
      }),
      headers
    }
  );
  const data = await fetchResponse.json();
  return data;
};
// Request Handler
app.post("/insertStandup", async (req, res) => {
  const { name, cron_text, channel, message } = req.body.input;
  let res1 = await executeOperation(
    {
      name,
      cron_text,
      channel,
      message
    },
    HASURA_INSERT_OPERATION
  );
  if (res1.errors) {
    return res.status(400).json(res1.errors[0]);
  }

  let res2 = await executeOperation(
    {
      standup_id: res1.data.insert_standup_one.id
    },
    HASURA_INSERT_SUBOPERATION
  );

  if (res2.errors) {
    return res.status(400).json(res2.errors[0]);
  }
  console.log("Cronjob added with id:" + res2.data.insert_cronjob_one.id);
  // success
  crons[res2.data.insert_cronjob_one.id] = new CronJob(
    cron_text,
    () => {
      const uuid = uuidv4();
      const stamp = timeStamp();
      console.log(`Time: ${stamp} Standup :{name: ${name}, channel: ${channel},  message: ${message}`);
      web.conversations.members({ channel }).then(response => {
        let requests = response.members.map(member =>
          web.chat.postMessage({
            text: `Time: ${stamp}||Standup Name: ${name} ||Message: ${message}`,
            channel: member,
            as_user: true
          })
        );
        Promise.all(requests).then(res =>
          res.forEach(resp => console.log(resp))
        );
      });

    },
    null,
    true
  );
  return res.json({
    ...res1.data.insert_standup_one
  });
});

const HASURA_DELETE_OPERATION = ` 
mutation deleteStandup($standup_id: uuid!) { 
  delete_standup(where: {id: {_eq: $standup_id}}){
    affected_rows
  }
}
`;

const HASURA_DELETE_SUBOPERATION = `  
mutation deleteCronjob($standup_id: uuid!){ 
  delete_cronjob(where: {standup_id: {_eq: $standup_id}}){
    affected_rows
  }
}
`;

const HASURA_CRONQUERY_OPERATION = `
query getCronJob($standup_id: uuid!){
cronjob(where: {standup_id: {_eq: $standup_id}}) {
    id
  }
}
`;
// Request Handler
app.post("/deleteStandup", async (req, res) => {
  const { standup_id } = req.body.input;

  const res3 = await executeOperation(
    { standup_id },
    HASURA_CRONQUERY_OPERATION
  );
  // console.log(res3);
  if (res3.errors) {
    return res.status(400).json(res3.errors[0]);
  }

  // console.log(res3.data);
  if (res3.data.cronjob.length > 0) {
    crons[res3.data.cronjob[0].id].stop();
    console.log("Cronjob removed with id:" + res3.data.cronjob[0].id);
  }
  const res2 = await executeOperation(
    { standup_id },
    HASURA_DELETE_SUBOPERATION
  );

  if (res2.errors) {
    return res.status(400).json(res2.errors[0]);
  }

  const res1 = await executeOperation({ standup_id }, HASURA_DELETE_OPERATION);

  if (res1.errors) {
    return res.status(400).json(res1.errors[0]);
  }
  // success
  return res.json({
    ...res1.data.delete_standup
  });
});

const HASURA_UPDATE_OPERATION = `
mutation updateStandup($standup_id:uuid!, $channel: String!, $cron_text: String!, $message: String!, $name: String!  ) {
  update_standup_by_pk(pk_columns: {id: $standup_id}, _set: {channel: $channel, cron_text: $cron_text, message: $message, name: $name}) {
    id
    channel
    cron_text
    message
    name
    updated_at
  }
}
`;
// Request Handler
app.post("/updateStandup", async (req, res) => {
  const { standup_id, channel, cron_text, message, name } = req.body.input;

  const res3 = await executeOperation(
    { standup_id, channel, cron_text, message, name },
    HASURA_UPDATE_OPERATION
  );
  // console.log(res3);
  if (res3.errors) {
    return res.status(400).json(res3.errors[0]);
  }

  const res1 = await executeOperation(
    { standup_id },
    HASURA_CRONQUERY_OPERATION
  );
  // console.log(res1);
  if (res1.errors) {
    return res.status(400).json(res1.errors[0]);
  }

  console.log(res1.data);
  if (res1.data.cronjob.length > 0) {
    crons[res1.data.cronjob[0].id].stop();
    console.log("Cronjob removed with id:" + res1.data.cronjob[0].id);
  }
  const res2 = await executeOperation(
    { standup_id },
    HASURA_DELETE_SUBOPERATION
  );

  if (res2.errors) {
    return res.status(400).json(res2.errors[0]);
  }

  let res4 = await executeOperation(
    {
      standup_id
    },
    HASURA_INSERT_SUBOPERATION
  );

  if (res4.errors) {
    return res.status(400).json(res4.errors[0]);
  }
  console.log("Cronjob added with id:" + res4.data.insert_cronjob_one.id);
  // success
  crons[res4.data.insert_cronjob_one.id] = new CronJob(
    cron_text,
    () => {
      const uuid = uuidv4();
      const stamp = timeStamp();
      console.log(`Time: ${stamp} Standup :{name: ${name}, channel: ${channel},  message: ${message}`);
      web.conversations.members({ channel }).then(response => {
        let requests = response.members.map(member =>
          web.chat.postMessage({
            text: `Time: ${stamp}||Standup Name: ${name} ||Message: ${message}`,
            channel: member,
            as_user: true
          })
        );
        Promise.all(requests).then(res =>
          res.forEach(resp => console.log(resp))
        );
      });
    },
    null,
    true
  );

  return res.json({
    ...res3.data.update_standup_by_pk
  });
});
server.listen(PORT, () => {
  console.log("Server started");
});

