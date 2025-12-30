import { Kafka } from "kafkajs";
import dotenv from "dotenv";
import connectDB from "../config/monogo.config.js";
import Analytics from "../models/analytics.model.js";

dotenv.config();

const kafka = new Kafka({
  clientId: "url-shortener-analytics",
  brokers: process.env.KAFKA_BROKERS.split(","),
});

const consumer = kafka.consumer({ groupId: "analytics-group" });

const runConsumer = async () => {
  await connectDB();
  await consumer.connect();
  await consumer.subscribe({ topic: "url_clicks", fromBeginning: true });

  console.log("Kafka consumer connected (analytics)");

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());

      await Analytics.create({
        shortId: event.shortId,
        source: event.source,
        timestamp: new Date(event.timestamp),
      });

      console.log("📊 Analytics saved:", event.shortId);
    },
  });
};

runConsumer();
