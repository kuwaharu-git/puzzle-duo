const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Game state management
const rooms = new Map();

// Puzzle generator
function generatePuzzle(stage) {
  const puzzles = [
    {
      stage: 1,
      hint: "色のパターンを見つけてください。赤→青→緑の順番です。",
      correctSequence: ['red', 'blue', 'green'],
      options: ['red', 'blue', 'green', 'yellow']
    },
    {
      stage: 2,
      hint: "数字の和を計算してください。3 + 5 + 2 = 10です。正しい答えは10です。",
      correctAnswer: 10,
      options: [8, 9, 10, 11]
    },
    {
      stage: 3,
      hint: "左から右へ、矢印の順番は：→ ↑ ← ↓",
      correctSequence: ['right', 'up', 'left', 'down'],
      options: ['up', 'down', 'left', 'right']
    }
  ];

  return puzzles[stage - 1] || puzzles[0];
}

// Room management
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('createRoom', () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms.set(roomId, {
      id: roomId,
      players: [{ id: socket.id, role: 'A' }],
      stage: 1,
      puzzle: generatePuzzle(1),
      currentProgress: [],
      isGameStarted: false,
      isCleared: false
    });

    socket.join(roomId);
    socket.emit('roomCreated', { roomId, role: 'A' });
    console.log(`Room created: ${roomId}`);
  });

  socket.on('joinRoom', (roomId) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('error', { message: '部屋が見つかりません' });
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('error', { message: '部屋が満員です' });
      return;
    }

    const role = room.players.length === 0 ? 'A' : 'B';
    room.players.push({ id: socket.id, role });
    socket.join(roomId);

    socket.emit('roomJoined', { roomId, role });

    if (room.players.length === 2) {
      room.isGameStarted = true;
      io.to(roomId).emit('gameStart', {
        stage: room.stage,
        puzzle: room.puzzle
      });
    }

    console.log(`Player joined room ${roomId} as Player ${role}`);
  });

  socket.on('submitAction', ({ roomId, action }) => {
    const room = rooms.get(roomId);

    if (!room || !room.isGameStarted) {
      return;
    }

    const puzzle = room.puzzle;
    let isCorrect = false;

    // Check if action is correct based on puzzle type
    if (puzzle.correctSequence) {
      room.currentProgress.push(action);
      
      if (room.currentProgress.length === puzzle.correctSequence.length) {
        isCorrect = JSON.stringify(room.currentProgress) === JSON.stringify(puzzle.correctSequence);
        
        if (isCorrect) {
          room.isCleared = true;
          io.to(roomId).emit('stageClear', { stage: room.stage });
        } else {
          room.currentProgress = [];
          io.to(roomId).emit('incorrect', { message: '不正解です。もう一度試してください。' });
        }
      }
    } else if (puzzle.correctAnswer !== undefined) {
      isCorrect = action === puzzle.correctAnswer;
      
      if (isCorrect) {
        room.isCleared = true;
        io.to(roomId).emit('stageClear', { stage: room.stage });
      } else {
        io.to(roomId).emit('incorrect', { message: '不正解です。もう一度試してください。' });
      }
    }

    io.to(roomId).emit('progressUpdate', { 
      progress: room.currentProgress,
      isCleared: room.isCleared
    });
  });

  socket.on('nextStage', ({ roomId }) => {
    const room = rooms.get(roomId);

    if (!room) {
      return;
    }

    room.stage += 1;
    room.currentProgress = [];
    room.isCleared = false;

    if (room.stage > 3) {
      io.to(roomId).emit('gameComplete', { message: 'すべてのステージをクリアしました！' });
      return;
    }

    room.puzzle = generatePuzzle(room.stage);
    io.to(roomId).emit('gameStart', {
      stage: room.stage,
      puzzle: room.puzzle
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    // Remove player from rooms
    for (const [roomId, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted`);
        } else {
          io.to(roomId).emit('playerLeft', { message: 'プレイヤーが退出しました' });
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
