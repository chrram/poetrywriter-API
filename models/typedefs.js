const { gql } = require('apollo-server-express');

module.exports = gql`

    type Query {
       users: [User]
       user(id: ID!): User
       poem(id: ID!): Poem!
       poems: [Poem]!
   }

   type User {
       id: ID,
       username: String
       poems: [Poem]
   }

   type Poem {
       id: ID
       title: String!
       text: String!
       writtenBy: User!
       likedBy: [User]
   }

   input userInfo {
       username: String!
       password: String!
   }

   type Mutation {
       newUser(username: String!, password: String!): User!
       signIn(input: userInfo!): String!
       
       newPoem(title: String!, text: String!): User!
       deletePoem(id: ID): User!
   }

   type Subscription {
        newPoemPosted: Poem
    }


`;