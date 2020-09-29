const HASURA_FETCH_STANDUP_OPERATION = `query getStandup($standup_id: uuid!){
  standup(where: {id: {_eq: $standup_id}}){
    id
    name
    message
  }
}
`;

const HASURA_INSERT_OPERATION = `
mutation insertStandup($creator_slack_id:String!, $name: String!, $cron_text: String!, $channel: String!, $message: String! ) {
insert_standup_one(
  object: {
    creator_slack_id: $creator_slack_id
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
  creator_slack_id
  created_at
  updated_at
}
}
`;

const HASURA_INSERT_SUBOPERATION = `
mutation insertCronjob($standup_id: uuid!){
insert_cronjob_one(object: {standup_id:$standup_id}){
  id,
  standup_id,
  created_at,
  updated_at
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
  standup_id,
  created_at,
  updated_at
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

const HASRUA_INSERT_RESPONSE_OPERATION = `
mutation insertResponse($standup_id: uuid!, $standup_run_id: uuid!, $slackuser_id: String!, $body: String! ) {
insert_response_one(object: {standup_id: $standup_id, standup_run_id: $standup_run_id, slackuser_id: $slackuser_id, body: $body}){
  id,
  standup_id
  standup_run_id
  slackuser_id
  body
  created_at
  updated_at
}
}
`;
const HASURA_FIND_RESPONSE_OPERATION = `
query findResponseByUserStandup($standup_id: uuid!, $standup_run_id: uuid!, $slackuser_id: String!) {
response(where: {slackuser_id: {_eq: $slackuser_id}, standup_id: {_eq: $standup_id}, standup_run_id: {_eq: $standup_run_id}}){
id
standup_id
standup_run_id
slackuser_id
body
}
}`;

const HASURA_UPDATE_RESPONSE_OPERATION = `
mutation updateResponseByUser($standup_id: uuid!, $standup_run_id: uuid!, $slackuser_id: String!, $body: String!) {
update_response(where: {standup_id: {_eq: $standup_id}, slackuser_id: {_eq: $slackuser_id}, standup_run_id: {_eq: $standup_run_id}}, _set: {body: $body}){
returning{
  id
  standup_id
  standup_run_id
  slackuser_id
  body
  created_at
  updated_at
}
}
}`;

const HASURA_DISBLE_PASTRUNS_OPERATION = `
mutation disablePastRuns($standup_id: uuid!) {
update_standup_run(where: {standup_id: {_eq: $standup_id}}, _set: {active: false}){
affected_rows
}
}
`
const HASURA_FIND_RUN_OPERATION = `
query getStandUpRun($standup_run_id: uuid!) {
standup_run_by_pk(id: $standup_run_id){
id
standup_id
active
created_at
updated_at
}
}
`

module.exports = {
  HASURA_FETCH_STANDUP_OPERATION,
  HASURA_INSERT_OPERATION,
  HASURA_INSERT_SUBOPERATION,
  HASURA_DELETE_OPERATION,
  HASURA_DELETE_SUBOPERATION,
  HASURA_CRONQUERY_OPERATION,
  HASURA_UPDATE_OPERATION,
  HASURA_INSERT_STANDUPRUN_OPERATION,
  HASURA_DELETE_STANDUPRUN_OPERATION,
  HASRUA_INSERT_RESPONSE_OPERATION,
  HASURA_FIND_RESPONSE_OPERATION,
  HASURA_UPDATE_RESPONSE_OPERATION,
  HASURA_DISBLE_PASTRUNS_OPERATION,
  HASURA_FIND_RUN_OPERATION
};
