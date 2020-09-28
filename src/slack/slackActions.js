const {
    HASURA_FETCH_STANDUP_OPERATION,
    HASURA_FIND_RESPONSE_OPERATION,
    HASURA_UPDATE_RESPONSE_OPERATION,
    HASRUA_INSERT_RESPONSE_OPERATION
} = require("./../graphql/queries");
const { executeOperation } = require("./../graphql/helpers");
const { WebClient } = require("@slack/web-api");
const token = process.env.SLACK_BOT_TOKEN;
const web = new WebClient(token);
const { modalBlock } = require("./slackBlocks");


const openModal = async payload => {
    let arr = payload.actions[0].block_id.split("||");
    let slackuser_id = payload.user.id;
    const [standup_id, standup_run_id] = arr;

    try {
        let res1 = await executeOperation(
            { standup_id },
            HASURA_FETCH_STANDUP_OPERATION
        );
        if (res1.errors) {
            return {
                response_action: "errors",
                errors: {
                    [payload.actions[0].block_id]:
                        "I can't seem to find this standup in our Database."
                }
            };
        }
        const { name, message } = res1.data.standup[0];
        let res2 = await executeOperation(
            { standup_id, standup_run_id, slackuser_id },
            HASURA_FIND_RESPONSE_OPERATION
        );

        if (res2.errors) {
            return {
                response_action: "errors",
                errors: {
                    [payload.actions[0].block_id]:
                        "I can't seem to find this response in our Database."
                }
            };
        }

        let response_body = "",
            response_id = "";

        if (res2.data.response.length) {
            response_body = res2.data.response[0].body;
            response_id = res2.data.response[0].id;
        }

        let res3 = await web.views.open({
            trigger_id: payload.trigger_id,
            view: modalBlock({
                standup: standup_id,
                name,
                message,
                standup_run: standup_run_id,
                response_body,
                response: response_id
            })
        });
    } catch (e) {
        console.log("Error: ", e);
    }
    return {
        text: "Processing..."
    };
};

const submitModal = async (payload) => {
    const blockData = payload.view.state.values;
    const keyArr = Object.keys(blockData);
    let arr = keyArr[0].split("||");
    const [standup_id, standup_run_id, response_id] = arr;
    const body = blockData[keyArr[0]].answer_input_element.value;
    let slackuser_id = payload.user.id;

    try {
        console.log("response present");
        if (response_id) {
            let res1 = await executeOperation(
                { standup_id, standup_run_id, slackuser_id, body },
                HASURA_UPDATE_RESPONSE_OPERATION
            );
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
        } else {
            let res2 = await executeOperation(
                { standup_id, standup_run_id, slackuser_id, body },
                HASRUA_INSERT_RESPONSE_OPERATION
            );
            if (res2.errors) {
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
        }
    } catch (e) {
        console.log("Error: ", e);
    }
    return {
        text: "Processing..."
    };
};
module.exports = { openModal, submitModal }