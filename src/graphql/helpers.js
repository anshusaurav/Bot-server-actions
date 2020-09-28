
const fetch = require("node-fetch")

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

const timeStamp = () => {
    var date = new Date();
    var seconds = ("0" + date.getSeconds()).slice(-2);
    var minutes = ("0" + date.getMinutes()).slice(-2);
    var hour = ("0" + date.getHours()).slice(-2);
    return `${hour}:${minutes}:${seconds}`;
};

module.exports = { executeOperation, timeStamp }