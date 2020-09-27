const blocks = (context) => {
  return [
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `Hey :wave: another standup time \n*${context.name}* \n *${context.message}*`
      }
    },
    {
      type: "divider"
    },
    {
      type: "actions",
      block_id: "7681-8632816381263-864218tudgs|8121",
      elements: [
        {
          type: "button",
          action_id:"open_modal_button",
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

module.exports = blocks;
