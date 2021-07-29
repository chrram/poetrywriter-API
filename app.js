require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const mongoose = require('mongoose')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const {User} = require('./model/schemas')
const {Words} = require('./model/schemas')

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
    let foundUser = await User.find({_id: request.user.sub})

    let foundWords = await User.find({_id: request.user.sub}).populate("words")

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

    let foundUser = await User.find({username: request.body.username.toString()})

    if (foundUser.length == 0)
        response.status(400).json({ message: "WRONG USERNAME OR PASSWORD."});
    else{
        
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
                response.status(400).json({ message: "WRONG USERNAME OR PASSWORD."});
            }
        })
    }
})

app.get('/words', authenticateToken, async (request, response) => {
    const foundWords = await User.findOne({_id: request.user.sub}).populate("words", ["word"])
    response.status(200).json(foundWords.words)
})

app.post('/words', authenticateToken, async (request, response) => {

 
    const word = new Words({
        word: request.body.word,
    })
    
    try {
        const savedWord = await word.save();
        let foundUser = await User.findOne({_id: request.user.sub })

        foundUser.words.push(savedWord._id);
        const savedUser = await foundUser.save();
        response.status(201).json(savedUser)
        
    } catch (error) {
        response.status(400).json({ message: error.message })
    }

})

app.delete('/words',authenticateToken, async (request, response) => {

    const wordId = request.body.wordId || ""

    try {
        const foundUser = await User.findOne({_id: request.user.sub})
        foundUser.words = foundUser.words.filter(ids => ids != wordId)
        const newUserData = await foundUser.save()
        
        //Deletes the word in the collection for words. 
        const wordToDelete = await Words.findByIdAndDelete(wordId)

        response.status(200).json({ wordId })
    } catch (error) {
        response.status(400).json({ message: error.message })
    }

})

app.get('/poetry', (request, response) => {

    response.send(poetry)
})

app.post('/poetry', (request, response) => {

    poetry.push({ id: 2, userId: 1, poetry: "newpoetry" })
    response.send(poetry)
})

app.listen(8080)