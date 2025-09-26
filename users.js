'use strict';

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDb = process.env.DYNAMODB_ENDPOINT 
  ? new AWS.DynamoDB.DocumentClient({endpoint: process.env.DYNAMODB_ENDPOINT})
  : new AWS.DynamoDB.DocumentClient();

module.exports.get = async (event, context) => {
  // 使用你 serverless.yml 裡面設定的 DynamoDB 資料表名稱
  const params = {
    TableName: 'users-local',
  };

  try {
    // 執行掃描（scan）操作，以取得資料表中所有項目
    const result = await dynamoDb.scan(params).promise();

    // 將項目以 JSON 格式回傳
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    console.log('============================================');
    console.error(error);
    console.log('============================================');
    return {
      statusCode: 500,
      body: JSON.stringify({ message: '無法取得使用者資料' }),
    };
  }
};

module.exports.addUser = async (event, context) => {
  const body = JSON.parse(event.body);
  if (!body.email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'email empty' })
    };
  }

  const userId = uuidv4();
  const timestamp = new Date().toISOString();

  const params = {
    TransactItems: [
      //第一筆 用戶個人檔案
      {
        Put: {
          TableName: 'users-local',
          Item: {
            PK: `USER#${userId}`,
            SK: `PROFILE#${userId}`,
            email: body.email,
            createdAt: timestamp,
          }
        }
      },
      //第二筆 用戶註冊活動
      {
        Put: {
          TableName: 'users-local',
          Item: {
            PK: `USER#${userId}`,
            SK: `ACTIVITY${timestamp}`,
            activityType: 'user_registered',
            details: {
              hash: 'EJUFHEFIJEUGFEHDJHDUGFYEH',
            }
          }
        }
      }
    ]
  };

  try {
    await dynamoDb.transactWrite(params).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: '用戶新增成功', userId: userId }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error }),
    }
  }
}