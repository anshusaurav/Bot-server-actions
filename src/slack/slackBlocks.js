const blocks = context => {
  const greetings = [
    "Bonjour",
    "Salut",
    "Al Salaam aliykhum",
    "Namaste",
    "What's up",
    "Hello",
    "Hey",
    "Hola",
    "Hi",
    "Ahoy",
    "Salaam",
    "Namaskar",
    "Shalom"
  ];
  return [
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${greetings[Math.floor(Math.random() * greetings.length)]
          }!! :wave: *${context.username}*! another standup time \n*${context.name
          }* \n ${context.message}`
      }
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

const modalBlockPostAnswer = context => ({
  type: "modal",
  callback_id: "answer_modal_submit",
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
      block_id: `${context.standup}||${context.standup_run}${context.response.length ? "||" + context.response : ""
        }`,
      element: {
        action_id: "answer_input_element",
        type: "plain_text_input",
        multiline: true,
        initial_value: `${context.response_body}`,
        placeholder: {
          type: "plain_text",
          text: "Please answer here"
        }
      },
      label: {
        type: "plain_text",
        text: "Answer here",
        emoji: true
      }
    }
  ]
});

const modalBlockViewAnswer = context => ({
  type: "modal",
  callback_id: "answer_modal_submit",
  title: {
    type: "plain_text",
    text: `${context.name}`,
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
      type: "section",
      text: {
        type: "mrkdwn",
        text: `>${context.response_body.length ? context.response_body : '_No answer submitted_'}`,
        // emoji: true
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "image",
          "image_url": "https://api.slack.com/img/blocks/bkb_template_images/notificationsWarningIcon.png",
          "alt_text": "notifications warning icon"
        },
        {
          "type": "mrkdwn",
          "text": "This standup run is complete, You can't change or post new answers"
        }
      ]
    },
  ]
});

const startMessage = () => [
  {
    type: "section",
    text: { type: "mrkdwn", text: ":dog: Hello!!" }
  }
];
module.exports = {
  blocks,
  modalBlockPostAnswer,
  modalBlockViewAnswer,
  startMessage
};
