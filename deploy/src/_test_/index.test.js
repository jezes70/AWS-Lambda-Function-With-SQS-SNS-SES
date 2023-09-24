const { generateSMSTemplate, publishSmsToPhoneNumber } = require("../index");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

// Mock the SNSClient class
jest.mock("@aws-sdk/client-sns");

describe("generateSMSTemplate", () => {
  it("should generate an SMS template with the correct message", () => {
    const messageBody = {
      name: "John",
      content: "Hello, world!",
    };
    const expectedTemplate =
      "Hello John! Here's the message content: Hello, world!.";
    const actualTemplate = generateSMSTemplate(messageBody);
    expect(actualTemplate).toEqual(expectedTemplate);
  });
});

describe("publishSmsToPhoneNumber", () => {
  it("should publish an SMS message to the given phone number and return a 200 status code and success JSON response", async () => {
    const phoneNumber = "+1234567890";
    const message = "Hello, world!";

    // Mock the SNSClient.send method to simulate a successful message send
    SNSClient.prototype.send.mockResolvedValue({});

    const response = await publishSmsToPhoneNumber(phoneNumber, message);

    expect(SNSClient).toHaveBeenCalledTimes(1);
    expect(SNSClient).toHaveBeenCalledWith({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_KEY,
      },
    });

    expect(response.statusCode).toEqual(200);
    expect(JSON.parse(response.body)).toEqual({
      message: "SMS sent successfully.",
    });
  });

  it("should return a 500 status code and error JSON response when SMS message sending fails", async () => {
    const phoneNumber = "+1234567890";
    const message = "Hello, world!";

    SNSClient.prototype.send.mockRejectedValue(
      new Error("Failed to send SMS message")
    );

    const response = await publishSmsToPhoneNumber(phoneNumber, message);

    expect(SNSClient).toHaveBeenCalledTimes(1);
    expect(SNSClient).toHaveBeenCalledWith({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_KEY,
      },
    });

    expect(response.statusCode).toEqual(500);
    expect(JSON.parse(response.body)).toEqual({
      error: "Error sending SMS.",
    });
  });
});
