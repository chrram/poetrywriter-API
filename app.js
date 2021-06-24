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
    {id: 3, userId:2, word: "test3"},
]

const poetry = [
    {id: 1, userId:1, poetry: "testtesetst"}
]

app.get('/',  (request, response) => {  
    response.send("Welcome to the poetrywriter-API.")
})

app.get('/words', (request, response) => {  
    const savedWords = words.filter(word => word.userId == 1)
    response.send(savedWords)
})

app.post('/words', (request, response) => {

    words.push({id:2,userId:1, word:"pushedWord"})

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

    poetry.push({id: 2, userId:1, poetry: "newpoetry"})
    response.send(poetry)
})

app.listen(8080)