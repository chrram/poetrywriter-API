const mongoose = require('mongoose')

const user = new mongoose.Schema(
	{
		username: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		words: [{type: mongoose.Types.ObjectId, ref: "words"}]
	},
	{ collection: 'users' }
)

const word = new mongoose.Schema(
	{
		word: { type: String, required: true},
	},
	{ collection: 'saved_words' }
)

const userSchema = mongoose.model('users', user)
const wordSchema = mongoose.model('words', word)

module.exports = { User: userSchema, Words: wordSchema }

// module.exports = mongoose.model('userSchema', user)