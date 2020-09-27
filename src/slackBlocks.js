const blocks = context => {
  return [
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Hey :wave: another standup time \n*${context.name}* \n ${context.message}`
      }
    },
    {
      type: "divider"
    },
    {
      type: "actions",
      block_id: `${context.standup}||${context.standup_run}`,
      elements: [
        {
          type: "button",
          action_id: "open_modal_button",
          text: {
            type: "plain_text",
            text: "Answer Questions",
            emoji: true
          },
          style: "primary",
          value: "click_me_123"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Dismiss",
            emoji: true
          },
          value: "click_me_123"
        }
      ]
    },
    {
      type: "divider"
    }
  ];
};

const modalBlock = context => ({
  type: "modal",
  callback_id: "example_modal_submit",
  title: {
    type: "plain_text",
    text: `${context.name}`,
    emoji: true
  },
  submit: {
    type: "plain_text",
    text: "Submit",
    emoji: true
  },
  close: {
    type: "plain_text",
    text: "Cancel",
    emoji: true
  },
  blocks: [
    {
      type: "section",
      text: {
        type: "plain_text",
        text: `${context.message}`,
        emoji: true
      }
    },
    {
      type: "input",
      block_id: "example_input_block",
      element: {
        action_id: "example_input_element",
        type: "plain_text_input"
      },
      label: {
        type: "plain_text",
        text: "Answer here",
        emoji: true
      }
    }
  ]
});
module.exports = { blocks, modalBlock };
