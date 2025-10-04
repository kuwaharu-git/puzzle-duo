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
const quizSessions = new Map();

// Puzzle generator for cooperative mode
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

// Quiz questions - Hacker/Linux command themed (for quiz mode)
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

// Get question by ID (for quiz mode)
function getQuestion(questionId) {
  return quizQuestions.find(q => q.id === questionId) || quizQuestions[0];
}

// Get total number of questions (for quiz mode)
function getTotalQuestions() {
  return quizQuestions.length;
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

  // Quiz mode handlers
  socket.on('startQuiz', () => {
    const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const firstQuestion = getQuestion(1);
    
    quizSessions.set(sessionId, {
      id: sessionId,
      playerId: socket.id,
      currentQuestionId: 1,
      question: firstQuestion,
      isGameStarted: true,
      totalQuestions: getTotalQuestions()
    });

    socket.join(sessionId);
    socket.emit('quizStarted', { 
      sessionId, 
      question: firstQuestion,
      currentQuestionId: 1,
      totalQuestions: getTotalQuestions()
    });
    console.log(`Quiz started: ${sessionId}`);
  });

  socket.on('submitQuizAnswer', ({ sessionId, answer }) => {
    const session = quizSessions.get(sessionId);

    if (!session || !session.isGameStarted) {
      return;
    }

    const question = session.question;
    const isCorrect = answer === question.correctAnswer;

    if (isCorrect) {
      io.to(sessionId).emit('quizAnswerResult', { 
        isCorrect: true, 
        explanation: question.explanation,
        currentQuestionId: session.currentQuestionId
      });
    } else {
      io.to(sessionId).emit('quizAnswerResult', { 
        isCorrect: false, 
        message: '不正解です。もう一度試してください。'
      });
    }
  });

  socket.on('nextQuizQuestion', ({ sessionId }) => {
    const session = quizSessions.get(sessionId);

    if (!session) {
      return;
    }

    session.currentQuestionId += 1;

    if (session.currentQuestionId > getTotalQuestions()) {
      io.to(sessionId).emit('quizComplete', { 
        message: 'すべての問題をクリアしました！おめでとうございます！',
        totalQuestions: getTotalQuestions()
      });
      return;
    }

    const nextQuestion = getQuestion(session.currentQuestionId);
    session.question = nextQuestion;
    
    io.to(sessionId).emit('quizQuestionUpdate', {
      question: nextQuestion,
      currentQuestionId: session.currentQuestionId,
      totalQuestions: getTotalQuestions()
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    // Remove player from cooperative game rooms
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

    // Remove player from quiz sessions
    for (const [sessionId, session] of quizSessions.entries()) {
      if (session.playerId === socket.id) {
        quizSessions.delete(sessionId);
        console.log(`Quiz session ${sessionId} deleted`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
