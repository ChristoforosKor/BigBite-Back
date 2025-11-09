const config = require('config');
const { Kafka, Partitioners } = require('kafkajs');
const winston = require('winston');
const broker = config.get('kafkaBroker');
const kafka = new Kafka({
  clientId: 'recycle-node',
  brokers: [broker],
});

const producer = kafka.producer({createPartitioner: Partitioners.LegacyPartitioner});  //producer({ createPartitioner: Kafka.DefaultPartitioner });

const produceWeightEvent = async (data) => {
  try {
    await producer.connect();
    console.log('Kafka connected.');
    winston.info('Kafka connected...');
    await producer.send({
      topic: 'weights-topic',
      messages: [{ value: JSON.stringify(data) }],
    });

    console.log('Message sent to Kafka.');

    await producer.disconnect();
    console.log('Kafka disconnected.');
    winston.info('Kafka disconnected.');
  } catch (error) {
    console.error('Kafka error:', error);
    throw error; // rethrow so caller (your route) can handle it
  }
};

const produceCRMEvent = async (data) => {
  try {
    await producer.connect();
    console.log('Kafka connected (CRM)');
    winston.info('Kafka connected (CRM)...');

    await producer.send({
      topic: config.get("kafkaTopic"),
      messages: [{ value: JSON.stringify(data) }],
    });

    winston.info('CRM message sent to Kafka.');
    producer.disconnect();
    winston.info('Kafka disconnected (CRM).');
  } catch (error) {
    console.error('Kafka error (CRM):', error);
    throw error;
  }
};

module.exports = {
  produceWeightEvent,
  produceCRMEvent,
};
