const { User, Words, Poem, Comment } = require('./schemas')
const { AuthenticationError } = require('apollo-server-express');

const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub();

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const { Types } = require('mongoose');

const POEM_ADDED = 'POEM_ADDED'

module.exports = {
    Query: {
        user: async (parent, args) => {
            return await User.findById(args.id).populate("poems")
        },
        users: async () => {
            return await User.find({})
        },
        poem: async (parent, args) => {
            return await Poem.findById(args.id).populate("writtenBy")
        },
        poems: async (parent, args) => await Poem.find({}).populate("writtenBy")
    },
    Mutation: {
        newUser: async (parent, { username, password }) => {

            const hashedPassword = await new Promise((resolve, reject) => {
                bcrypt.hash(password, 10, function (error, hash) {
                    if (error) reject(error)
                    resolve(hash)
                });
            })

            return await User.create({
                username: username,
                password: hashedPassword
            })

        },

        signIn: async (parent, { input }) => {
            
            const user = await User.findOne({ username: input.username })

            if (!user) {
                console.log(" User not found ")
                throw new AuthenticationError("Error signing in")
            }

            const valid = await bcrypt.compare(input.password, user.password)

            if (!valid) {
                console.log("User found but PASSWORD NOT VALID")
                throw new AuthenticationError("Error signing in")
            }

            const accessToken = jwt.sign({
                sub: user.id
            }, "secret-string-of-some-sorts")

            const idToken = jwt.sign({
                sub: user.id,
                preferred_username: user.username,
            }, "secret-string-of-some-sorts")

            return accessToken
        },

        newPoem: async (parent, { title, text }, { user }) => {

            if (!user) {
                throw new AuthenticationError("You must be signed in")
            }

            const newPoem = await Poem.create({
                title: title,
                text: text,
                writtenBy: user.sub
            })

            const updatedUser = await User.findByIdAndUpdate(user.sub,
                {
                    $push: {
                        poems: Types.ObjectId(newPoem._id)
                    }
                },
                {
                    new: true
                }
            ).populate("poems")
 
            pubsub.publish("POEM_ADDED", {newPoemPosted: newPoem})

            return updatedUser
        },

        deletePoem: async (parent, { id }, { user }) => {

            if (!user) {
                throw new AuthenticationError("You must be signed in")
            }

        }
    },

    Subscription: {
        newPoemPosted: {
            subscribe: () => pubsub.asyncIterator(["POEM_ADDED"])
        },
    },

}