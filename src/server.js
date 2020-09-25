const express = require("express");
const bodyParser = require("body-parser");
const CronJob = require("cron").CronJob;
const fetch = require("node-fetch");
const { v4: uuidv4 } = require("uuid");
const crons = {};

const timeStamp = () => {
  var date = new Date();
  var seconds = ("0" + date.getSeconds()).slice(-2);
  var minutes = ("0" + date.getMinutes()).slice(-2);
  var hour = ("0" + date.getHours()).slice(-2);
  return `${hour}:${minutes}:${seconds}`;
};

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 3000;

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
      console.log(
        "Time: " + stamp,
        "Standup: {name: " +
        name +
        ", channel: " +
        channel +
        ", message: " +
        message +
        "}"
      );
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
  if (res3.errors) {
    return res.status(400).json(res3.errors[0]);
  }
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

app.listen(PORT, () => {
  console.log("Server started");
});
