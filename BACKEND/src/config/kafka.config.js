import { Kafka } from "kafkajs";
import dotenv from "dotenv";

dotenv.config();

const brokers = process.env.KAFKA_BROKERS
  ? process.env.KAFKA_BROKERS.split(",")
  : ["localhost:9092"];

const kafka = new Kafka({
  clientId: "url-shortener",
  brokers,
});

export const producer = kafka.producer();
