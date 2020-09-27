const HASURA_FETCH_STANDUP_OPERATION = `query getStandup($standup_id: uuid!){
    standup(where: {id: {_eq: $standup_id}}){
      id
      name
      message
    }
  }
  `;

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

const HASURA_INSERT_STANDUPRUN_OPERATION = `
mutation insertSandupRun($standup_id: uuid!) {
  insert_standup_run_one(object: {standup_id: $standup_id}){
    id
    standup_id
    created_at
  }
}
`;

const HASURA_DELETE_STANDUPRUN_OPERATION = `
mutation deleteStandupRun($standup_id: uuid!) {
  delete_standup_run(where: {standup_id: {_eq: $standup_id}}){
    affected_rows
  }
}
`;

module.exports = {
    HASURA_FETCH_STANDUP_OPERATION,
    HASURA_INSERT_OPERATION,
    HASURA_INSERT_SUBOPERATION,
    HASURA_DELETE_OPERATION,
    HASURA_DELETE_SUBOPERATION,
    HASURA_CRONQUERY_OPERATION,
    HASURA_UPDATE_OPERATION,
    HASURA_INSERT_STANDUPRUN_OPERATION,
    HASURA_DELETE_STANDUPRUN_OPERATION
};
