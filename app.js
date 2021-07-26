require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const mongoose = require('mongoose')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const User = require('./model/user')

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
//Get the default connection
const db = mongoose.connection
db.on('error', (error) => console.error(error, "Error connecting to the database."))
db.once('open', () => console.log('Connected to Database!'))

// //Bind connection to error event (to get notification of connection errors)
// db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (request, response) => {
    console.log("Welcome to the API.")
    response.send("Welcome to the poetrywriter-API.")
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

app.get('/words', (request, response) => {
    const savedWords = words.filter(word => word.userId == 1)
    response.send(savedWords)
})

app.post('/words', (request, response) => {

    words.push({ id: 2, userId: 1, word: "pushedWord" })

    const savedWords = words.filter(word => word.userId == 1)
    response.send(savedWords)

})

app.delete('/words', (request, response) => {

    const savedWords = words.filter(word => word.id != 1)
    response.send(savedWords)
})

app.get('/poetry', (request, response) => {

    response.send(poetry)
})

app.post('/poetry', (request, response) => {

    poetry.push({ id: 2, userId: 1, poetry: "newpoetry" })
    response.send(poetry)
})

app.listen(8080)