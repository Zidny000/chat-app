const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage } = require('./utils/message')
const {addUser,removeUser , getUser ,getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket)=>{

 

 // socket.broadcast.on('sendLocation')

 socket.on('join', (options,callback) => {  

 
  const {error, user } = addUser({ id:socket.id, ...options })
  socket.join(user.room)
  
  if(error){
   return callback(error)
  }

  socket.emit('message', generateMessage(user.username,'Welcome'))
  socket.broadcast.to(user.room).emit('message',generateMessage(user.username,`${user.username} has joined!`))

  io.to(user.room).emit('roomData',{
   room:user.room,
   users:getUsersInRoom(user.room)
  })

  callback()

 })

 socket.on('sendLocation', (croods,callback)=> {
  const user = getUser(socket.id)
  if(!user){
   return callback('Can not find user')
  }
  io.to(user.room).emit('locationMessage',generateMessage(user.username,`https://google.com/maps?q=${croods.latitude},${croods.longitude}`))  
  callback()
 })

 socket.on('sendMessage', (message,callback)=> {

  const user = getUser(socket.id)
  const filter = new Filter()
  if(!user){
   return callback('Can not find user')
  }
  if(filter.isProfane(message)){
   return callback('Profanity is not allowed')
  }

  io.to(user.room).emit('message',generateMessage(user.username,message))
  callback()
 })

 socket.on('disconnect',()=>{
  const user = removeUser(socket.id)

  if (user) {
   io.to(user.room).emit('message',generateMessage(`${user.username} has left`))
   io.to(user.room).emit('roomData',{
    room:user.room,
    users:getUsersInRoom(user.room)
   })
  }
  
 })
 
})


server.listen(port , ()=>{
 console.log(`Server id up on port ${port}!`)
})