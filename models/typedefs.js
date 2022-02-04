const { gql } = require('apollo-server-express');

module.exports = gql`

    type Query {
       users: [User]
       user(id: ID!): User
       poem(id: ID!): Poem!
   }

   type User {
       id: ID,
       username: String,
       password: String
       poems: [Poem]
   }

   type Poem {
       id: ID,
       title: String!,
       text: String!,
       writtenBy: User!
       likedBy: [User]
   }

   type Mutation {
       newUser(username: String!, password: String!): User!
       signIn(username: String!, password: String!): String!
       newPoem(title: String!, text: String!): User!
   }

`;