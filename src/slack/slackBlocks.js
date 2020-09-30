const { randomGreeting, trimTitle } = require("./../graphql/helpers");
const blocks = context => {
  return [
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${randomGreeting()}!! :wave: *${context.username
          }*! another standup time \n*${context.name}* \n ${context.message}`
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

const modalBlockPostAnswer = context => {
  return {
    type: "modal",
    callback_id: "answer_modal_submit",
    title: {
      type: "plain_text",
      text: `${trimTitle(context.name, 24)}`,
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
  };
};

const modalBlockViewAnswer = context => {
  return {
    type: "modal",
    callback_id: "answer_modal_submit",
    title: {
      type: "plain_text",
      text: `${trimTitle(context.name, 24)}`,
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
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Response Submitted"
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `>${context.response_body.length
              ? context.response_body
              : "_No answer submitted_"
            }`
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "image",
            image_url:
              "https://api.slack.com/img/blocks/bkb_template_images/notificationsWarningIcon.png",
            alt_text: "notifications warning icon"
          },
          {
            type: "mrkdwn",
            text:
              "This standup run is complete, You can't change or post new answers"
          }
        ]
      }
    ]
  };
};

const standupCreateBlock = context => {
  return [
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${randomGreeting()}!!  ${context.creator_slack_id
          } :wave: I'm pupbot, Your standup *${context.name
          }* is now active, well done!
        \n I have informed all participants and will will send them a DM with the questions.\t`
      }
    },
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${context.name}*\nCron: ${context.cron_text} \nChannel: ${context.channel}\n`
      },
      accessory: {
        type: "image",
        image_url:
          "https://api.slack.com/img/blocks/bkb_template_images/notifications.png",
        alt_text: "calendar thumbnail"
      }
    },
    {
      type: "divider"
    }
  ];
};

const standupNotifyBlock = context => {
  return [
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${randomGreeting()}!! ${context.username
          }:wave: I'm geekbot, @${context.creator_slack_id
          } has created the standup *${context.name
          }* in Slack and I am here to help get you started.\n I will send you a DM at assigned time ${context.cron_text
          } \n`
      }
    },
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${context.name}* \nCron: ${context.cron_text} \nChannel: ${context.channel}\n`
      },
      accessory: {
        type: "image",
        image_url:
          "https://api.slack.com/img/blocks/bkb_template_images/notifications.png",
        alt_text: "calendar thumbnail"
      }
    },
    {
      type: "divider"
    }
  ];
};



const channelNotifyBlock = context => {
  return [
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Hi there :wave: I'm pupbot, and I will be facilitating *${context.name
          }* created by *@${context.creator_slack_id
          }* in Slack.\n I will send you a DM at assigned time ${context.cron_text
          } \n`
      },
      accessory: {
        type: "image",
        image_url:
          "https://api.slack.com/img/blocks/bkb_template_images/notifications.png",
        alt_text: "calendar thumbnail"
      }
    },
    {
      type: "divider"
    },

  ];
};
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
  startMessage,
  standupCreateBlock,
  standupNotifyBlock,
  channelNotifyBlock
};
