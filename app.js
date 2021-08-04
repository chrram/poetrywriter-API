require('dotenv').config()
const axios = require("axios")
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const mongoose = require('mongoose')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const { User, Words, Poem, Comment } = require('./models/schemas')

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })

const db = mongoose.connection
db.on('error', (error) => console.error(error, "Error connecting to the database."))
db.once('open', () => console.log('Connected to Database!'))

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (request, response) => {
    console.log("Welcome to the API.")
    response.send("Welcome to the poetrywriter-API.")
})

// Token checking middleware
// Code taken and modified from:
// https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs
const authenticateToken = (request, response, next) => {

    const authHeader = request.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return response.sendStatus(401)
    jwt.verify(token, "secret-string-of-some-sorts", (err, user) => {

        if (err) return response.sendStatus(401)
        request.user = user
        next()
    })
}

app.get('/user', authenticateToken, async (request, response) => {
    let foundUser = await User.find({ _id: request.user.sub })

    let foundWords = await User.find({ _id: request.user.sub }).populate("words")

    console.log(foundUser, "foundUser", foundWords, "words")
})


app.post('/user', async (request, response) => {

    let password = request.body.password
    const hashedPassword = await new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, function (error, hash) {
            if (error) reject(error)
            resolve(hash)
        });
    })

    const user = new User({
        username: request.body.username,
        password: hashedPassword
    })

    try {
        const newUser = await user.save()
        response.status(201).json(newUser)
    } catch (error) {
        response.status(400).json({ message: error.message })
    }

})

app.post('/token', async (request, response) => {

    let foundUser = await User.find({ username: request.body.username.toString() })

    if (foundUser.length == 0)
        response.status(400).json({ message: "WRONG USERNAME OR PASSWORD." });
    else {

        bcrypt.compare(request.body.password, foundUser[0].password, (error, result) => {
            if (result) {

                // IF THE WE MANAGED TO LOG IN
                const accessToken = jwt.sign({
                    sub: foundUser[0].id
                }, "secret-string-of-some-sorts")

                const idToken = jwt.sign({
                    sub: foundUser[0].id,
                    preferred_username: foundUser[0].username,
                }, "secret-string-of-some-sorts")

                return response.status(200).json({ "access_token": accessToken, "token_type": "Bearer", "id_token": idToken })

            } else {
                //IF THE PASSWORD IS WRONG
                response.status(400).json({ message: "WRONG USERNAME OR PASSWORD." });
            }
        })
    }
})



app.get('/rhymes', async (request, response) => {

})

app.get('/words', authenticateToken, async (request, response) => {
    const foundWords = await User.findOne({ _id: request.user.sub }).populate("words", ["word"])
    response.status(200).json(foundWords.words)
})

app.post('/words', authenticateToken, async (request, response) => {

    const word = new Words({
        word: request.body.word,
    })

    try {
        axios.get(`https://api.datamuse.com/words?rel_rhy=${request.body.word}`)
            .then(async result => {

                for (const property in result.data) {
                    word.rhyme.push(result.data[property].word)
                }
                
                const savedWord = await word.save();
                let foundUser = await User.findOne({ _id: request.user.sub })

                // console.log(foundUser, word, "testttt")
                foundUser.words.push(savedWord._id);
                const savedUser = await foundUser.save();
                response.status(201).json(savedUser)


            })
            .catch(error => response.send(error));
    }
    catch (error) {
        response.status(400).json({ message: error.message })
    }

})

app.delete('/words', authenticateToken, async (request, response) => {

    const wordId = request.body.wordId || ""

    try {
        const foundUser = await User.findOne({ _id: request.user.sub })
        foundUser.words = foundUser.words.filter(ids => ids != wordId)
        await foundUser.save()
        //Deletes the word in the collection for words. 
        await Words.findByIdAndDelete(wordId)

        response.status(200).json({ wordId })
    } catch (error) {
        response.status(400).json({ message: error.message })
    }

})

app.get('/poetry', async (request, response) => {

    const allPoems = await Poem.find({}).populate("writtenBy", ["username"]).populate("comments");
    response.status(200).json(allPoems)
})
app.post('/poetry', authenticateToken, async (request, response) => {

    const newPoem = new Poem({
        title: "Title here",
        text: "Text goes here",
        writtenBy: request.user.sub
    })

    try {
        const savedPoem = await newPoem.save();
        let foundUser = await User.findOne({ _id: request.user.sub })

        foundUser.poems.push(savedPoem._id);
        const savedUser = await foundUser.save();
        response.status(201).json({ user: savedUser, poem: savedPoem })

    } catch (error) {
        response.status(400).json({ message: error.message })
    }
})

app.post('/poetry/comment', authenticateToken, async (request, response) => {

    const { id } = request.body

    console.log("buuuguuuuug")

    const newComment = new Comment({
        text: "Text goes here 2",
        commentOn: id,
        writtenBy: request.user.sub
    })

    try {
        const poem = await Poem.findOne({ _id: id })
        if (poem == null) throw { message: "This poem doesn't exist." }

        const savedComment = await newComment.save();
        poem.comments.push(savedComment._id);
        const savedPoem = await poem.save();
        response.status(201).json({ comment: savedComment, poem: savedPoem })
    }
    catch (error) {
        response.status(400).json({ message: error.message })
    }
})

app.delete('/poetry/comment', authenticateToken, async (request, response) => {
    const { id } = request.body

    console.log(request.user.sub, id, "test")
    try {

        const deletedComment = await Comment.findOneAndDelete({ _id: id, writtenBy: request.user.sub })

        if (deletedComment == null) throw { message: "Comment was not found among your comments." }

        // todo find the comment in the poems and remove it.
        const foundPoem = await Poem.findOne({ commentedOn: deletedComment.commentedOn })
        let index = foundPoem.comments.indexOf(id)
        foundPoem.comments[index] = "deleted"
        await foundPoem.save()
        response.status(201).json({ deletedComment, foundPoem })
    }
    catch (error) {
        response.status(400).json({ message: error.message })
    }
})



app.get('/poetry/:id', async (request, response) => {

    const id = request.params.id
    try {
        const poem = await
            Poem.findOne({ _id: id })
                .populate("writtenBy", ["username"])
                .populate("likedBy", ["username"])
        response.status(200).json({ message: poem })
    }
    catch (error) {
        response.status(400).json({ message: error.message })
    }
})



app.post('/poetry/like/:id', authenticateToken, async (request, response) => {

    const id = request.params.id
    try {
        const poem = await Poem.findOne({ _id: id })

        //If the user is trying to like his own poems.
        if (poem.writtenBy == request.user.sub) {
            throw { message: "You cannot like your own poems." }
        }

        // if the user has already liked this poem.
        if (poem.likedBy.find(userId => userId == request.user.sub)) {
            throw { message: "You have already liked this poem." }
        }

        poem.likedBy.push(request.user.sub)
        const likedPoem = await poem.save();
        response.status(201).json(likedPoem)
    }
    catch (error) {
        response.status(400).json({ message: error.message })
    }
})

app.delete('/poetry/like/:id', authenticateToken, async (request, response) => {

    console.log("rtetetteestet")

    const id = request.params.id

    try {
        const poem = await Poem.findOne({ _id: id })

        //If the user is trying to like his own poems.
        if (poem.writtenBy == request.user.sub) {
            throw { message: "You cannot like your own poems." }
        }

        // if the user has already liked this poem.
        if (!poem.likedBy.find(userId => userId == request.user.sub)) {
            throw { message: "You have not liked this poem." }
        }

        poem.likedBy = poem.likedBy.filter(userId => userId != request.user.sub)

        const deletedLike = await poem.save()
        response.status(201).json(deletedLike)
    }
    catch (error) {
        response.status(400).json({ message: error.message })
    }
})

app.delete('/poetry/:id', authenticateToken, async (request, response) => {

    //todo: delete all the comments associated with this poem.
    // deletemany

    const id = request.params.id
    try {

        // This can maybe be rewritten with findOneDelete later on.
        const foundUser = await User.findOne({ _id: request.user.sub })
            .populate({ path: "poems", match: { _id: id, writtenBy: request.user.sub } })

        // // Deletes the poem in the users poem array.
        foundUser.poems = foundUser.poems.filter(poemIds => poemIds._id != id)

        await foundUser.save()
        //Deletes the poem in the collection for poems. 
        await Poem.findByIdAndDelete(id)

        response.status(200).json({ foundUser })

    }
    catch (error) {
        response.status(400).json({ message: error.message })
    }
})



app.listen(8080)