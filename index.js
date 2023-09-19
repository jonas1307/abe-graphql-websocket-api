import express from "express";
import http from "http";
import { Server } from "socket.io";
import { ApolloServer } from "apollo-server-express";
import axios from "axios";
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
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
        "https://rp6w0qdem1.execute-api.us-east-1.amazonaws.com/polls"
      );
      return res.data;
    },
    pollById: async (_, { pollId }) => {
      const res = await axios.get(
        `https://rp6w0qdem1.execute-api.us-east-1.amazonaws.com/polls/${pollId}`
      );
      return res.data;
    },
  },
  Mutation: {
    addPoll: async (_, { question, options }) => {
      const res = await axios.post(
        "https://rp6w0qdem1.execute-api.us-east-1.amazonaws.com/polls",
        { question, options }
      );
      io.emit("poll-insert", res.data);
      return res.data;
    },
    addVote: async (_, { pollId, label }) => {
      const res = await axios.post(
        "https://rp6w0qdem1.execute-api.us-east-1.amazonaws.com/votes",
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

apolloServer.start().then(() => {
  apolloServer.applyMiddleware({ app });
});

app.get("/", (req, res) => {
  res.json({ status: "OK" });
});

io.on("connection", (socket) => {
  console.log("a user connected");
});

server.listen(5000, () => {
  console.log("listening on *:5000");
});
