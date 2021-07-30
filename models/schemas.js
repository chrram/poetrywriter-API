const mongoose = require('mongoose')

const user = new mongoose.Schema(
	{
		username: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		words: [{type: mongoose.Types.ObjectId, ref: "words"}],
		poems: [{type: mongoose.Types.ObjectId, ref: "poems"}]
	},
	{ collection: 'users' }
)

const word = new mongoose.Schema(
	{
		word: { type: String, required: true},
	},
	{ collection: 'saved_words' }
)

const poem = new mongoose.Schema(
	{
		title: { type: String, required: true},
		text: { type: String, required: true},
		writtenBy: {type: mongoose.Types.ObjectId, ref: "users", required:true},
		likedBy: [{type: mongoose.Types.ObjectId, ref: "users"}]
	},
	{timestamps: true},
	{ collection: 'poems' }
)

const userSchema = mongoose.model('users', user)
const wordSchema = mongoose.model('words', word)
const poemSchema = mongoose.model('poems', poem)

module.exports = { User: userSchema, Words: wordSchema, Poem: poemSchema }