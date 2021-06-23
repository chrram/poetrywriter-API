const express = require('express')
const bodyParser = require('body-parser')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))

const user = [
    {id: 1, mail:"test@gmail.com", password:"test"}
]

const words = [
    {id: 1, userId:1, word: "test"},
    {id: 2, userId:1, word: "test2"},
]

const poetry = [
    {id: 1, userId:1, poetry: "testtesetst"}
]

app.get('/',  (request, response) => {  
    response.send("Welcome to the poetrywriter-API.")
})

app.get('/words', (request, response) => {  
    response.send(words)
})

app.post('/words', (request, response) => {  
    response.send(words)
})

app.get('/poetry', (request, response) => {  
    response.send(poetry)
})

app.post('/poetry', (request, response) => {  
    response.send(poetry)
})

app.listen(8080)