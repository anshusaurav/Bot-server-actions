const express = require("express");
const bodyParser = require("body-parser");
const CronJob = require("cron").CronJob;
const fetch = require("node-fetch");
const { v4: uuidv4 } = require("uuid");
// const ApolloClient = require('apollo-boost').default;

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

// mutation {
//   insertStandup(cron_text: "0/5 * * * * *", name:"CSS Updates", channel: "1771262G28", message:"Whats Box Model"){
//     name
//     id
//     cron_text
//     message
//     channel
//   }
// }

const HASURA_OPERATION = `
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

// mutation {
//   insert_cronjob_one(object: {standup_id: "67a94ca8-263c-4a8f-b811-ca19acdf0e94"}){
//     id,
//     standup_id
//   }
// }

const HASURA_SUBOPERATION = `
mutation insertCronjob($standup_id: uuid!){
  insert_cronjob_one(object: {standup_id:$standup_id}){
    id,
    standup_id
  }
}
`;

//
// query{
//   standup{
//     name,
//     id,
//     cron_text
//   }
// }

const executeInsertion = async variables => {
    const headers = { "x-hasura-admin-secret": "qwerty" };

    const fetchResponse = await fetch(
        "https://hopeful-squirrel-40.hasura.app/v1/graphql",
        {
            method: "POST",
            body: JSON.stringify({
                query: HASURA_OPERATION,
                variables
            }),
            headers
        }
    );
    const data = await fetchResponse.json();
    // console.log("DEBUG: ", data);
    return data;
};

const executeSubInsertion = async variables => {
    const headers = { "x-hasura-admin-secret": "qwerty" };

    const fetchResponse = await fetch(
        "https://hopeful-squirrel-40.hasura.app/v1/graphql",
        {
            method: "POST",
            body: JSON.stringify({
                query: HASURA_SUBOPERATION,
                variables
            }),
            headers
        }
    );
    const data = await fetchResponse.json();
    // console.log("DEBUG: ", data);
    return data;
};

// Request Handler
app.post("/insertStandup", async (req, res) => {
    const { name, cron_text, channel, message } = req.body.input;
    const { data, errors } = await executeInsertion({
        name,
        cron_text,
        channel,
        message
    });
    if (errors) {
        return res.status(400).json(errors[0]);
    }
    console.log(data);
    // success
    const { dataCron, errorsCron } = await executeSubInsertion({
        standup_id: data.insert_standup_one.id
    });
    console.log("cronjob added: ", dataCron);
    return res.json({
        ...data.insert_standup_one
    });
});

const HASURA_DELETE_OPERATION = ` 
mutation deleteStandup($standup_id: String!) { String!
  delete_standup(where: {id: {_eq: $standup_id}}){
    affected_rows
  }
}
`;

const executeDeletion = async variables => {
    const headers = { "x-hasura-admin-secret": "qwerty" };

    const fetchResponse = await fetch(
        "https://hopeful-squirrel-40.hasura.app/v1/graphql",
        {
            method: "POST",
            body: JSON.stringify({
                query: HASURA_OPERATION,
                variables
            }),
            headers
        }
    );
    const data = await fetchResponse.json();
    console.log("DEBUG: ", data);
    return data;
};
// Request Handler
app.post("/deleteStandup", async (req, res) => {
    console.log("HERE", req.body.input);
    const { standup_id } = req.body.input;
    console.log(standup_id);
    const { data, errors } = await executeDeletion({ standup_id: uuidv4.fromString(standup_id) });
    console.log(data);
    if (errors) {
        return res.status(400).json(errors[0]);
    }
    console.log(data);
    // success
    // const {dataCron, errorsCron} = await executeSubInsertion (
    //   { standup_id: data.insert_standup_one.id}
    // );
    // console.log("cronjob added: ", dataCron);
    return res.json({
        ...data
    });
});

app.listen(PORT, () => {
    console.log("Server started");
});
