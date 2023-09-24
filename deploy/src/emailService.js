const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const dotenv = require("dotenv");
dotenv.config();
const { REGION } = process.env;

const ses = new SESClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
});

const emailQueueUrl = process.env.EMAIL_QUEUE_URL;

exports.handler = async (event, context) => {
  try {
    const queueUrl = process.env.AWS_QUEUE_URL;
    const receiveParams = {
      QueueUrl: emailQueueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 10,
    };

    const response = await sqs.send(new ReceiveMessageCommand(receiveParams));

    if (response.Messages && response.Messages.length > 0) {
      const message = response.Messages[0];
      const messageBody = JSON.parse(message.Body);

      const emailSubject = "New Message";
      const emailBody = generateEmailBody(messageBody);

      await sendEmail("jezes70@gmail.com", emailSubject, emailBody);

      await sqs.send(
        new DeleteMessageCommand({
          QueueUrl: emailQueueUrl,
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

function generateEmailBody(messageBody) {
  const { name, content } = messageBody;

  const emailBody = `Hello ${name}!<br><br>Here's the message content: ${content}.`;

  return emailBody;
}

async function sendEmail(recipientEmail, subject, body) {
  try {
    const sesParams = {
      Destination: {
        ToAddresses: [recipientEmail],
      },
      Message: {
        Body: {
          Html: {
            Data: body,
          },
        },
        Subject: {
          Data: subject,
        },
      },
      Source: "sender@example.com",
    };

    await ses.send(new SendEmailCommand(sesParams));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email sent successfully." }),
    };
  } catch (error) {
    console.error("Error sending email:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error sending email." }),
    };
  }
}

module.exports = {
  generateEmailBody,
  sendEmail,
};
