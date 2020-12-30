const express = require("express");
const fetch = require("node-fetch");
const { gql } = require("apollo-server-express");
const cors = require("cors");
const { ApolloServer } = require("apollo-server-express");
const jwt = require("express-jwt");

// this is not secure! this is for dev purposes
process.env.JWT_SECRET = process.env.JWT_SECRET || "somereallylongsecretkey";

const PORT = process.env.PORT || 3500;
const app = express();

app.use(cors());

const typeDefs = gql`
  type Image {
    id: ID
    tags: String
    largeImageURL: String
    user: String
    userImageURL: String
    views: Int
  }

  type Query {
    results(keyword: String): [Image]
    image(id: ID!): Image
    images(page: Int, category: String, keyword: String): [Image]
  }
`;

function fetchImages(page, category, keyword) {
  // More info about the fetch function? https://github.com/bitinn/node-fetch#json
  const response = encodeURI(keyword);
  return fetch(
    `https://pixabay.com/api/?key=14217170-67091f69280d11e8fd820524a&category=${category}&page=${page}&per_page=30&q=${response}`
  )
    .then((res) => res.json())
    .then((json) => json.hits);
}

function fetchImageById(id) {
  // More info about the fetch function? https://github.com/bitinn/node-fetch#json
  return fetch(
    `https://pixabay.com/api/?key=14217170-67091f69280d11e8fd820524a&id=${id}`
  )
    .then((res) => res.json())
    .then((json) => json.hits[0]);
}

function fetchImagesByName(keyword) {
  return fetch(
    `https://pixabay.com/api/?key=14217170-67091f69280d11e8fd820524a&q=${keyword}`
  )
    .then((res) => res.json())
    .then((json) => json.hits);
}

const resolvers = {
  Query: {
    images: (_, args) => {
      const page = args.page;
      const category = args.category;
      const keyword = args.keyword;
      console.log(category);
      console.log(page);
      console.log(keyword);
      return fetchImages(page, category, keyword);
    },
    image: (_, args) => {
      const id = args.id;
      console.log(id);
      return fetchImageById(id);
    },
    results: (_, args) => {
      const keyword = args.keyword;
      console.log(keyword);
      return fetchImagesByName(keyword);
    },
  },
};

// auth middleware
const auth = jwt({
  secret: process.env.JWT_SECRET,
  credentialsRequired: false,
});

const server = new ApolloServer({
  introspection: true, // do this only for dev purposes
  playground: true, // do this only for dev purposes
  typeDefs,
  resolvers,
});

app.use(auth);

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const { status } = err;
  res.status(status).json(err);
};
app.use(errorHandler);
server.applyMiddleware({ app, path: "/graphql" });

if (!process.env.NOW_REGION) {
  app.listen(PORT, () => {
    console.log(`Listening at http://localhost:${PORT}/graphql`);
  });
}

module.exports = app;
