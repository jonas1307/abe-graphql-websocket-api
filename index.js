import express from "express";
import http from "http";
import { Server } from "socket.io";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import axios from "axios";
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
  },
});

const typeDefs = `#graphql

  type Poll {
    pollId: String
    question: String
    options: [QuestionOption]
  }

  type QuestionOption {
    label: String
    answers: Int
  }

  type Query {
    polls: [Poll]
    pollById(pollId: String): Poll
  }

  type Mutation {
    addPoll(question: String, options: [String]): Poll
    addVote(pollId: String, label: String): Poll
  }
`;

const resolvers = {
  Query: {
    polls: async () => {
      const res = await axios.get(
        "https://6ooimsri26.execute-api.us-east-1.amazonaws.com/polls"
      );
      return res.data;
    },
    pollById: async (_, { pollId }) => {
      const res = await axios.get(
        `https://6ooimsri26.execute-api.us-east-1.amazonaws.com/polls/${pollId}`
      );
      return res.data;
    },
  },
  Mutation: {
    addPoll: async (_, { question, options }) => {
      const res = await axios.post(
        "https://6ooimsri26.execute-api.us-east-1.amazonaws.com/polls",
        { question, options }
      );
      io.emit("poll-insert", res.data);
      return res.data;
    },
    addVote: async (_, { pollId, label }) => {
      const res = await axios.post(
        "https://6ooimsri26.execute-api.us-east-1.amazonaws.com/votes",
        { pollId, label }
      );
      io.emit("poll-update", res.data);
      return res.data;
    },
  },
};

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(apolloServer, {
  listen: { port: 4000 },
});

console.log(`🚀 Server ready at: ${url}`);

app.get("/", (req, res) => {
  res.json({ status: "OK" });
});

io.on("connection", (socket) => {
  console.log("a user connected");
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
