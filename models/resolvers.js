const { User, Words, Poem, Comment } = require('./schemas')
const { AuthenticationError } = require('apollo-server-express');

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

module.exports = {
    Query: {
        hello: () => 'Hello world',
        user: async (parent, args) => {
            return await User.findById(args.id)
        },
        users: async () => {
            return await User.find({})
        },
        poem: async (parent, args) => {
            return await Poem.findById(args.id).populate("writtenBy")
        }
    },
    Mutation: {
        newUser: async (parent, args) => {



            return await User.create({
                username: args.username,
                password: args.password
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
        }
    }
}