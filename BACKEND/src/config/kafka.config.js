import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "url-shortener",
  brokers: process.env.KAFKA_BROKERS.split(",")
});

export const producer = kafka.producer();
