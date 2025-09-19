'use strict';

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const isLocal = process.env.IS_OFFLINE;
const client = new DynamoDBClient({
  ...(isLocal && {
    endpoint: "http://127.0.0.1:8000",
    region: "ap-northeast-1", // A mock region for local testing
  }),
});

const docClient = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Hello, World! Your function executed successfully! " + new Date().toISOString(),
        input: event,
      },
      null,
      2
    ),
  };
};

module.exports.createUser = async (event) => {

    const body = JSON.parse(event.body);
    const userId = body.userId;
    const username = body.username;

    const command = new PutCommand({
        TableName: "users-table-dev",
        Item: body,
    });

    await docClient.send(command);

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "user created successfully!" }),
    }
}

module.exports.getUsers = async (event, context) => {
  const params = {
    TableName: "users-table-dev"
  };

  try {
    const result = await docClient.scan(params).promise();
  } catch (error) {
    
  }
}