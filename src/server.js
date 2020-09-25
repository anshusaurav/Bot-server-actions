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
    let res1 = await executeInsertion({
        name,
        cron_text,
        channel,
        message
    });
    if (res1.errors) {
        return res.status(400).json(res1.errors[0]);
    }
    console.log(res1.data);
    // success
    let res2 = await executeSubInsertion({
        standup_id: res1.data.insert_standup_one.id
    });
    if (res2.errors) {
        return res.status(400).json(res2.errors[0]);
    }
    console.log(res2.data);
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

const executeDeletion = async variables => {
    const headers = { "x-hasura-admin-secret": "qwerty" };

    const fetchResponse = await fetch(
        "https://hopeful-squirrel-40.hasura.app/v1/graphql",
        {
            method: "POST",
            body: JSON.stringify({
                query: HASURA_DELETE_OPERATION,
                variables
            }),
            headers
        }
    );
    const data = await fetchResponse.json();
    console.log("DEBUG: ", data);
    return data;
};

const executeSubDeletion = async variables => {
    const headers = { "x-hasura-admin-secret": "qwerty" };

    const fetchResponse = await fetch(
        "https://hopeful-squirrel-40.hasura.app/v1/graphql",
        {
            method: "POST",
            body: JSON.stringify({
                query: HASURA_DELETE_SUBOPERATION,
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
    const { standup_id } = req.body.input;

    const res2 = await executeSubDeletion(
        { standup_id }
    );
    console.log("cronjob deleted: ", res2.data);
    if (res2.errors) {
        return res.status(400).json(res2.errors[0]);
    }
    const res1 = await executeDeletion({ standup_id });
    console.log('datastandup', res1.data, res1.errors);
    if (res1.errors) {
        return res.status(400).json(res1.errors[0]);
    }
    console.log(res1.data);
    // success

    return res.json({
        ...res1.data.delete_standup
    });
});

app.listen(PORT, () => {
    console.log("Server started");
});
