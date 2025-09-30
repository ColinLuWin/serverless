// ⭐️ 【ESM 語法】從 require 替換為 import 
import { v4 as uuidv4 } from 'uuid'; 

// ⭐️ 【AWS SDK V3】模組化導入所需的類別和 Command
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

// 設定 DynamoDB 客戶端
const config = {};

// 檢查 DYNAMODB_ENDPOINT 是否存在，用於本地測試
if (process.env.DYNAMODB_ENDPOINT) {
    // ⭐️ 處理本地端點設置：V3 客戶端配置
    config.endpoint = process.env.DYNAMODB_ENDPOINT;
}

// 建立 V3 的 DynamoDB 客戶端 (底層)
const client = new DynamoDBClient(config);

// 建立 DynamoDB 文件客戶端 (用於簡化操作，取代 V2 的 DocumentClient)
const dynamoDb = DynamoDBDocumentClient.from(client);

// =======================================================
// 1. getUsers Handler
// =======================================================

// ⭐️ 【ESM 語法】從 module.exports 替換為 export const 
export const getUsers = async (event) => {
    try {
        const params = {
            TableName: 'users',
        };

        // ⭐️ 【AWS SDK V3】使用 ScanCommand 替換 dynamoDb.scan()
        const command = new ScanCommand(params);
        const result = await dynamoDb.send(command);

        return {
            statusCode: 200,
            body: JSON.stringify(result.Items),
        };
    } catch (error) {
        console.error('Error fetching users:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', detail: error.message }),
        };
    }
};

// =======================================================
// 2. addUser Handler
// =======================================================

// ⭐️ 【ESM 語法】從 module.exports 替換為 export const 
export const addUser = async (event) => {
    try {
        // 確保 event.body 存在
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing request body' }),
            };
        }

        const body = JSON.parse(event.body);

        // 簡單的資料驗證
        if (!body.email) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required fields: email' }),
            };
        }

        const userId = uuidv4();
        const timestamp = new Date().toISOString();

        //【AWS SDK V3】使用 PutCommand 替換 dynamoDb.put()
        await dynamoDb.send(new PutCommand({
            TableName: 'users',
            Item: {
                PK: `USER#${userId}`,
                SK: `PROFILE#${userId}`,
                email: body.email,
                createdAt: timestamp,
            },
        }));

        await dynamoDb.send(new PutCommand({
            TableName: 'users',
            Item: {
                PK: `USER#${userId}`,
                SK: `ACTIVITY${timestamp}`,
                activityType: 'user_registered',
                details: {
                    hash: 'EJUFHEFIJEUGFEHDJHDUGFYEH',
                }
            },
        }));

        return {
            statusCode: 201,
            body: JSON.stringify({ message: '用戶新增成功', userId: userId }),
        };
    } catch (error) {
        console.error('Error adding user:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', detail: error.message }),
        };
    }
};