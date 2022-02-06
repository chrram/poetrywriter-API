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
		rhyme: [{type: String}]
	},
	{ collection: 'saved_words' }
)

const poem = new mongoose.Schema(
	{
		title: { type: String, required: true},
		text: { type: String, required: true},
		writtenBy: {type: mongoose.Types.ObjectId, ref: "users", required:true},
		likedBy: [{type: mongoose.Types.ObjectId, ref: "users"}],
		comments: [{type: mongoose.Types.ObjectId, ref: "comments"}]
	},
	{timestamps: true},
	{ collection: 'poems' }
)

const poemComment = new mongoose.Schema(
	{
		text: {type:String, required:true},
		commentOn: {type: mongoose.Types.ObjectId, ref: "poems", required:true},
		writtenBy: {type: mongoose.Types.ObjectId, ref: "users", required:true}
	},
	{timestamps: true},
	{collection: 'comments'}
)

const userSchema = mongoose.model('users', user)
const wordSchema = mongoose.model('words', word)
const poemSchema = mongoose.model('poems', poem)
const commentSchema = mongoose.model('comments', poemComment)

module.exports = { User: userSchema, Words: wordSchema, Poem: poemSchema, Comment: commentSchema}