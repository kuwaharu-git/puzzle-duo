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

// Quiz questions - Hacker/Linux command themed
const quizQuestions = [
  {
    id: 1,
    question: "Linuxで現在のディレクトリのパスを表示するコマンドは？",
    options: ['pwd', 'cd', 'ls', 'mkdir'],
    correctAnswer: 'pwd',
    explanation: "pwdコマンド（Print Working Directory）は現在のディレクトリの完全パスを表示します。"
  },
  {
    id: 2,
    question: "ファイルの権限を変更するコマンドは？",
    options: ['chown', 'chmod', 'chgrp', 'ls -l'],
    correctAnswer: 'chmod',
    explanation: "chmodコマンド（Change Mode）はファイルやディレクトリのアクセス権限を変更します。"
  },
  {
    id: 3,
    question: "実行中のプロセスを確認するコマンドは？",
    options: ['ps', 'kill', 'top', 'htop'],
    correctAnswer: 'ps',
    explanation: "psコマンド（Process Status）は現在実行中のプロセスの情報を表示します。"
  },
  {
    id: 4,
    question: "ファイルの内容を表示するコマンドは？",
    options: ['cat', 'dog', 'view', 'show'],
    correctAnswer: 'cat',
    explanation: "catコマンド（concatenate）はファイルの内容を標準出力に表示します。"
  },
  {
    id: 5,
    question: "スーパーユーザー権限でコマンドを実行するには？",
    options: ['sudo', 'su', 'root', 'admin'],
    correctAnswer: 'sudo',
    explanation: "sudoコマンド（SuperUser DO）は一時的に管理者権限でコマンドを実行できます。"
  }
];

// Get question by ID
function getQuestion(questionId) {
  return quizQuestions.find(q => q.id === questionId) || quizQuestions[0];
}

// Get total number of questions
function getTotalQuestions() {
  return quizQuestions.length;
}

// Room management
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('startGame', () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const firstQuestion = getQuestion(1);
    
    rooms.set(roomId, {
      id: roomId,
      players: [{ id: socket.id }],
      currentQuestionId: 1,
      question: firstQuestion,
      isGameStarted: true,
      totalQuestions: getTotalQuestions()
    });

    socket.join(roomId);
    socket.emit('gameStarted', { 
      roomId, 
      question: firstQuestion,
      currentQuestionId: 1,
      totalQuestions: getTotalQuestions()
    });
    console.log(`Game started: ${roomId}`);
  });

  socket.on('submitAnswer', ({ roomId, answer }) => {
    const room = rooms.get(roomId);

    if (!room || !room.isGameStarted) {
      return;
    }

    const question = room.question;
    const isCorrect = answer === question.correctAnswer;

    if (isCorrect) {
      io.to(roomId).emit('answerResult', { 
        isCorrect: true, 
        explanation: question.explanation,
        currentQuestionId: room.currentQuestionId
      });
    } else {
      io.to(roomId).emit('answerResult', { 
        isCorrect: false, 
        message: '不正解です。もう一度試してください。'
      });
    }
  });

  socket.on('nextQuestion', ({ roomId }) => {
    const room = rooms.get(roomId);

    if (!room) {
      return;
    }

    room.currentQuestionId += 1;

    if (room.currentQuestionId > getTotalQuestions()) {
      io.to(roomId).emit('gameComplete', { 
        message: 'すべての問題をクリアしました！おめでとうございます！',
        totalQuestions: getTotalQuestions()
      });
      return;
    }

    const nextQuestion = getQuestion(room.currentQuestionId);
    room.question = nextQuestion;
    
    io.to(roomId).emit('questionUpdate', {
      question: nextQuestion,
      currentQuestionId: room.currentQuestionId,
      totalQuestions: getTotalQuestions()
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    // Remove player from rooms
    for (const [roomId, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
