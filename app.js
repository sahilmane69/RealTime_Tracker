const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const users = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register-user', ({ name, emoji }) => {
    users[socket.id] = { name, emoji };
  });

  socket.on('send-location', ({ latitude, longitude }) => {
    const user = users[socket.id] || { name: 'Unknown', emoji: '❓' };
    io.emit('receive-location', {
      id: socket.id,
      name: user.name,
      emoji: user.emoji,
      latitude,
      longitude
    });
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('user-disconnected', socket.id);
    console.log('User disconnected:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.render('index');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
