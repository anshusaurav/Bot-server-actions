const { createServer } = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const CronJob = require("cron").CronJob;
const fetch = require("node-fetch");
const { WebClient } = require("@slack/web-api");
const token = process.env.SLACK_BOT_TOKEN;
const web = new WebClient(token);
const { v4: uuidv4 } = require("uuid");
const { createMessageAdapter } = require("@slack/interactive-messages");
const { createEventAdapter } = require("@slack/events-api");
const { blocks, modalBlock } = require("./slackBlocks");
const {
  HASURA_FETCH_STANDUP_OPERATION,
  HASURA_INSERT_OPERATION,
  HASURA_INSERT_SUBOPERATION,
  HASURA_DELETE_OPERATION,
  HASURA_DELETE_SUBOPERATION,
  HASURA_CRONQUERY_OPERATION,
  HASURA_UPDATE_OPERATION,
  HASURA_INSERT_STANDUPRUN_OPERATION,
  HASURA_DELETE_STANDUPRUN_OPERATION,
  HASRUA_INSERT_RESPONSE_OPERATION
} = require("./queries");
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
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
const slackInteractions = createMessageAdapter(
  process.env.SLACK_SIGNING_SECRET
);

app.use("/slack/events", slackEvents.expressMiddleware());
app.use("/slack/actions", slackInteractions.expressMiddleware());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

slackInteractions.action({ actionId: "open_modal_button" }, async payload => {
  // console.log(payload);
  let arr = payload.actions[0].block_id.split("||");
  const [standup_id, standup_run_id] = arr;
  // console.log(standup_id, standup_run_id);
  try {
    let res1 = await executeOperation(
      { standup_id },
      HASURA_FETCH_STANDUP_OPERATION
    );
    const { name, message } = res1.data.standup[0];
    // console.log(payload)
    let res2 = await web.views.open({
      trigger_id: payload.trigger_id,
      view: modalBlock({
        standup: standup_id,
        name,
        message,
        standup_run: standup_run_id
      })
    });
  } catch (e) {
    console.log("Error: ", e);
  }
  return {
    text: "Processing..."
  };
});

slackInteractions.viewSubmission("answer_modal_submit", async payload => {
  const blockData = payload.view.state.values;

  // console.log(payload.view.state.values, payload.user.id);
  console.log("HEre");
  const keyArr = Object.keys(blockData);
  let arr = keyArr[0].split("||");
  console.log(arr);
  const [standup_id, standup_run_id] = arr;

  const body = blockData[keyArr[0]].answer_input_element.value;
  let slackuser_id = payload.user.id;
  console.log(standup_id, standup_run_id, payload.user.id, body);
  try {
    let res1 = await executeOperation(
      { standup_id, standup_run_id, slackuser_id, body },
      HASRUA_INSERT_RESPONSE_OPERATION
    );
    console.log(res1);
    if (res1.errors) {
      return {
        response_action: "errors",
        errors: {
          [keyArr[0]]:
            "The input must have have some answer for the question."
        }
      };
    }
    return {
      response_action: "clear"
    };
    // console.log(payload)
  } catch (e) {
    console.log("Error: ", e);
  }
  return {
    text: "Processing..."
  };
  // const nameInput = blockData.values.example_input_block.example_input_element.value;
  // if (nameInput.length < 2) {
  //   return {
  //     "response_action": "errors",
  //     "errors": {
  //       "example_input_block": "The input must have more than one letter."
  //     }
  //   }
  // }
  // return {
  //   response_action: "clear"
  // }
});

slackEvents.on("message", event => {
  // console.log(event);
});

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
      const stamp = timeStamp();
      console.log(
        `Time: ${stamp} Standup :{name: ${name}, channel: ${channel},  message: ${message}`
      );
      executeOperation(
        { standup_id: res1.data.insert_standup_one.id },
        HASURA_INSERT_STANDUPRUN_OPERATION
      ).then(insertRes => {
        web.conversations.members({ channel }).then(response => {
          let requests = response.members.map(member =>
            web.chat.postMessage({
              blocks: blocks({
                name,
                message,
                member,
                standup: res1.data.insert_standup_one.id,
                standup_run: insertRes.data.insert_standup_run_one.id
              }),
              channel: member
            })
          );
          Promise.all(requests).then(res =>
            res.forEach(resp => console.log("ya"))
          );
        });
      });
    },
    null,
    true
  );
  return res.json({
    ...res1.data.insert_standup_one
  });
});

// Request Handler
app.post("/deleteStandup", async (req, res) => {
  const { standup_id } = req.body.input;

  const res4 = await executeOperation(
    { standup_id },
    HASURA_DELETE_STANDUPRUN_OPERATION
  ); //HASURA_DELETE_STANDUPRUN_OPERATION
  if (res4.errors) {
    return res.status(400).json(res4.errors[0]);
  }
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

// Request Handler
app.post("/updateStandup", async (req, res) => {
  const { standup_id, channel, cron_text, message, name } = req.body.input;

  const res3 = await executeOperation(
    { standup_id, channel, cron_text, message, name },
    HASURA_UPDATE_OPERATION
  );
  if (res3.errors) {
    return res.status(400).json(res3.errors[0]);
  }

  const res1 = await executeOperation(
    { standup_id },
    HASURA_CRONQUERY_OPERATION
  );
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

  let res4 = await executeOperation({ standup_id }, HASURA_INSERT_SUBOPERATION);

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
      console.log(
        `Time: ${stamp} Standup :{name: ${name}, channel: ${channel},  message: ${message}`
      );
      executeOperation({ standup_id }, HASURA_INSERT_STANDUPRUN_OPERATION).then(
        insertRes => {
          web.conversations.members({ channel }).then(response => {
            let requests = response.members.map(member =>
              web.chat.postMessage({
                blocks: blocks({
                  name,
                  message,
                  member,
                  standup: standup_id,
                  standup_run: insertRes.data.insert_standup_run_one.id
                }),
                channel: member
              })
            );
            Promise.all(requests).then(res =>
              res.forEach(resp => console.log("ya"))
            );
          });
        }
      );
    },
    null,
    true
  );

  return res.json({
    ...res3.data.update_standup_by_pk
  });
});

app.listen(PORT, function () {
  console.log("Server is listening on port " + PORT);
});
