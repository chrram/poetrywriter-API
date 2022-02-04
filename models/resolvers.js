const { User, Words, Poem, Comment } = require('./schemas')
const { AuthenticationError } = require('apollo-server-express');

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const { Types } = require('mongoose');

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
        }
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

        signIn: async (parent, { username, password }) => {
            const user = await User.findOne({ username: username })

            if (!user) {
                console.log(" User not found ")
                throw new AuthenticationError("Error signing in")
            }

            const valid = await bcrypt.compare(password, user.password)

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

            return updatedUser
        }

    }
}