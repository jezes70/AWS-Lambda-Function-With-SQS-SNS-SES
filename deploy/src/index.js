const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} = require("@aws-sdk/client-sqs");
const dotenv = require("dotenv");
const { REGION } = process.env;

dotenv.config();

const sns = new SNSClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
});

const smsQueueUrl = process.env.SMS_QUEUE_URL;

const sqs = new SQSClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
});

exports.handler = async (event, context) => {
  try {
    const queueUrl = process.env.AWS_QUEUE_URL;
    const receiveParams = {
      QueueUrl: smsQueueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 10,
    };

    const response = await sqs
      .send(new ReceiveMessageCommand(receiveParams))
      .promise();

    if (response.Messages && response.Messages.length > 0) {
      const message = response.Messages[0];
      const messageBody = JSON.parse(message.Body);

      const smsTemplate = generateSMSTemplate(messageBody);

      await publishSmsToPhoneNumber("+1234567890", smsTemplate);

      await sqs.send(
        new DeleteMessageCommand({
          QueueUrl: smsQueueUrl,
          ReceiptHandle: message.ReceiptHandle,
        })
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Messages processed successfully." }),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "No messages found." }),
      };
    }
  } catch (error) {
    console.error("Lambda function error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error." }),
    };
  }
};

function generateSMSTemplate(messageBody) {
  const { name, content } = messageBody;

  const smsTemplate = `Hello ${name}! Here's the message content: ${content}.`;

  return smsTemplate;
}

async function publishSmsToPhoneNumber(phoneNumber, message) {
  try {
    const snsParams = {
      PhoneNumber: phoneNumber,
      Message: message,
    };

    await sns.send(new PublishCommand(snsParams));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "SMS sent successfully." }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error sending SMS." }),
    };
  }
}

module.exports = {
  generateSMSTemplate,
  publishSmsToPhoneNumber,
};
