const mqtt = require('mqtt');
const config = require('config');
const winston = require('winston');
const mongoose = require('mongoose');
const Joi = require('joi');
const recycleTokens = require('../models/recycletokens');
const weightModel = require('../models/weights');
const collectionPointsModel = require('../models/collectionPoints');
const deviceModel = require('../models/devices');
const CRM = require('./CRM');
const protocol = 'mqtt';
const host = config.get('mqttAddress');
const mqttPort = config.get("mqttPort");
const clientId = 'emqx_nodejs_' + Math.random().toString(16).substring(2, 8)
const username = config.get('mqttUsername');
const password = config.get('mqttPassword');
const topic = config.get("mqttTopic");
const qos = 2;
const { produceCRMEvent } = require('../lib/kafkaProducer');
//const { prepareCreate,prepareUpdate,prepareRetrieve,prepareDelete } = require("../lib/sessionstorage");
//mongoose.connect('mongodb://127.0.0.1/recyclebin');


const client = mqtt.connect(host, {"port": mqttPort,
    "clientId": clientId,
    "username": username,
    "password": password
});

client.subscribe(topic, {qos}, (error) => {
    if (error) {
        winston.info('subscribe error:', error);
        return;
    }
});

client.on('message', async (topic, payload) => {
    try {
        //1) Receive payload - multiply weight *10
        const data = JSON.parse(payload);
        console.log("Received payload:", data);
        const record = data;
        //convertions to data
        record.bulkMobileCouponBindingModel[0].weight = String(record.bulkMobileCouponBindingModel[0].weight * 10);
        record.location.latitude = parseFloat(Number(record.location.latitude).toFixed(5));
        record.location.longitude = parseFloat(Number(record.location.longitude).toFixed(5));
        if (record?.weightDate) {
            const d = new Date(record.weightDate);
            record.createdAt = isNaN(d.getTime()) ? new Date() : d;
            } else {
            record.createdAt = new Date();
        }
        record.updatedAt = new Date();
        record.user = {"_id": "685a9b5356e503508b39c98f", "username": "test1@vvv.gr"};
        record.organization = {"_id": "685d3ed3b9dd9a6f58376e83", "organizationName": "Mainsys"}; // 6840478e5f6181f5683c61eb hardcoded organization ID ask christoforos to change it

        console.log("Payload after convertions:", record);

        //2) save weight on stagedWeights
        const stageWeightDoc = await weightModel.CreateMqttStagedWeight(record);
        if (!stageWeightDoc) {
            console.log("Failed to save staged weight document.");
            winston.error("Failed to save staged weight document.");
            return;
        }
        console.log("MQQT Save Stage Weight Doc:", JSON.stringify(stageWeightDoc.toObject(), null, 2));

        //3) Update stageweights push status 'pending'
        await weightModel.mqttUpdateOne(
            { _id: stageWeightDoc._id },
            { $push: {
                status: {
                    status: 'pending',
                    timestamp: new Date()
                }
            } }
        );

        //4) find device object for clientID and used on weights
        const getObject = await deviceModel.findOne({ deviceId: String(record.clientID) });

        if (!getObject) {
            console.log(`No device found for clientID: ${record.clientID}`);
            winston.warn(`No device found for clientID: ${record.clientID}`);
            await weightModel.mqttUpdateOne(
                { _id: stageWeightDoc._id },
                { $push: {
                    status: {
                        status: 'No device found',
                        timestamp: new Date()
                    }
                } }
            );
            return;
        }
        if (getObject) {
            record.device = {
                _id: String(getObject._id),
                title: getObject.title || "",
                type: getObject.type?.type || ""
            };
        } else {
            record.device = null;
        }
        console.log("Device found:", getObject._id);
        
        //5) save weight on weights
        const weightDoc = await weightModel.CreateMqttWeight(record);
        
        if (!weightDoc) {
            console.log("Failed to save weight document.");    //failed to local
            winston.error("Failed to save weight document.");
            await weightModel.mqttUpdateOne(
                { _id: stageWeightDoc._id },
                { $push: {
                    status: {
                        status: 'failed to local',
                        timestamp: new Date()
                    }
                } }
            );
            return;
        }
        console.log("MQQT Save Weight Doc:", JSON.stringify(weightDoc.toObject(), null, 2));
        //6) Convert to CRM format and send to kafkas
        const crmPayload = CRM.convertSingleWithId(stageWeightDoc);
        await produceCRMEvent(crmPayload);

        
        //7) update a record on devices
        /*const updateResult = await deviceModel.updateOne(
            { deviceId: String(record.clientID) },
            {
                $set: {
                battery: record.battery,
                fill: record.fill,
                updatedAt: record?.weightDate || new Date(),
                },
            }
        );

        if (updateResult) {
            console.log('✅ device updated successfully for ID:', record.clientID);
        } else {
            console.warn('❌ No matching device found to update for ID:', record.clientID);
            console.log("The Updating device was:", {
                deviceId: record.clientID,
                battery: record.battery,
                fill: record.fill,
                date: record?.weightDate || new Date()
            });
        }*/

    } catch (err) {
        console.error("Error handling MQTT message:", err);
        winston.error(`MQTT message error: ${err.message}`);
        //throw err;
    }
});


async function saveToDB(object) {
    const stagedDocument = new StagedDocument(JSON.parse(object));
    const res = await stagedDocument.save();
}

function transformPayload(orginalJson) {
    return {
        bulkMobileCouponBindingModel: [
            {
                bagCode: orginalJson.bulkMobileCouponBindingModel[0].bagCode,
                weight: orginalJson.bulkMobileCouponBindingModel[0].weight
            }
        ]
    };
}

async function sendPayload(value) {
    const token = await recycleTokens.requestNewToken('worker1@vvv.gr', 'worker1');
    return CRM.saveToCRM(value, token.data.access_token);

}