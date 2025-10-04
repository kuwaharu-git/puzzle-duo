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

// Puzzle generator for cooperative mode - Linux command themed
function generatePuzzle(stage) {
  const puzzles = [
    {
      stage: 1,
      type: 'sequence',
      title: 'シークレットログ追跡作戦',
      narrative: '施設のどこかに重要なログが隠されています。あなたたちの情報を組み合わせて正しいコマンドを構築しましょう。',
      sequence: [
        { role: 'A', value: 'find' },
        { role: 'B', value: '/var/log' },
        { role: 'A', value: '-name' },
        { role: 'B', value: '"*secret*"' }
      ],
      playerA: {
        roleLabel: 'Player A / コマンドナビゲーター',
        hint: '調査の主導権はあなたにあります。Bが持っているパス情報に合わせて適切なサブコマンドを選びましょう。',
        intel: '対象のログは find コマンドで洗い出す必要があります。サブコマンド「-name」を使って部分一致検索ができるようです。',
        options: [
          { id: 'find', label: 'find', value: 'find' },
          { id: 'grep', label: 'grep', value: 'grep' },
          { id: 'ls', label: 'ls', value: 'ls' },
          { id: '-name', label: '-name', value: '-name' },
          { id: '-type', label: '-type', value: '-type' }
        ]
      },
      playerB: {
        roleLabel: 'Player B / パスナビゲーター',
        hint: 'あなたは環境側の情報を握っています。Aが指示するタイミングに合わせて正しい経路やキーワードを差し込みましょう。',
        intel: '怪しいログは /var/log 配下にあり、ファイル名に "secret" が含まれているようです。',
        options: [
          { id: '/var/log', label: '/var/log', value: '/var/log' },
          { id: '/etc', label: '/etc', value: '/etc' },
          { id: '"*secret*"', label: '"*secret*"', value: '"*secret*"' },
          { id: '"*error*"', label: '"*error*"', value: '"*error*"' },
          { id: '/home/user', label: '/home/user', value: '/home/user' }
        ]
      },
      successMessage: 'TARGET FILE LOCATED 📂',
      failureMessage: 'パラメータが噛み合いません。もう一度相談しながら組み立てましょう。'
    },
    {
      stage: 2,
      type: 'sequence',
      title: 'プロセス監視ターミナル',
      narrative: 'メモリを圧迫しているプロセスを早急に特定する必要があります。役割分担しながら最適なコマンドラインを構築してください。',
      sequence: [
        { role: 'A', value: 'ps' },
        { role: 'B', value: 'aux' },
        { role: 'A', value: '--sort=-%mem' },
        { role: 'B', value: '| head -n 5' }
      ],
      playerA: {
        roleLabel: 'Player A / オプション解析班',
        hint: 'プロセス情報を詳細に取得し、メモリ使用量で並び替える手段を持っています。',
        intel: 'ps コマンドのフラグやソートオプションに詳しいのはあなたです。Bのシェル操作と連携して上位5件に絞り込みましょう。',
        options: [
          { id: 'ps', label: 'ps', value: 'ps' },
          { id: '--sort=-%mem', label: '--sort=-%mem', value: '--sort=-%mem' },
          { id: '--sort=pid', label: '--sort=pid', value: '--sort=pid' },
          { id: '-ef', label: '-ef', value: '-ef' },
          { id: 'watch', label: 'watch', value: 'watch' }
        ]
      },
      playerB: {
        roleLabel: 'Player B / シェル統制班',
        hint: 'シェル構文とパイプライン制御に長けています。Aが提示したコマンドを補完して、必要な情報だけを抜き出しましょう。',
        intel: 'プロセスを広く取得するには aux オプションが必要です。さらに head コマンドで出力を圧縮しましょう。',
        options: [
          { id: 'aux', label: 'aux', value: 'aux' },
          { id: '-A', label: '-A', value: '-A' },
          { id: '| head -n 5', label: '| head -n 5', value: '| head -n 5' },
          { id: '| tail -n 5', label: '| tail -n 5', value: '| tail -n 5' },
          { id: '| grep ssh', label: '| grep ssh', value: '| grep ssh' }
        ]
      },
      successMessage: 'HIGH USAGE PROCESSES IDENTIFIED ✅',
      failureMessage: '監視コマンドがうまく連結できませんでした。役割を確認して組み直しましょう。'
    },
    {
      stage: 3,
      type: 'sequence',
      title: '権限移譲プロトコル',
      narrative: '重要ファイル「config.txt」のオーナー権限をユーザー user1 に移譲します。互いの権限情報を持ち寄りましょう。',
      sequence: [
        { role: 'A', value: 'chown' },
        { role: 'B', value: 'user1' },
        { role: 'A', value: ':' },
        { role: 'B', value: 'config.txt' }
      ],
      playerA: {
        roleLabel: 'Player A / 権限管理オペレーター',
        hint: '所有者変更コマンドの使い方に精通しています。書式を崩さずに引数を指示しましょう。',
        intel: 'コマンドは chown を使い、必要であればコロンでグループ指定もできます。',
        options: [
          { id: 'chown', label: 'chown', value: 'chown' },
          { id: 'chmod', label: 'chmod', value: 'chmod' },
          { id: ':', label: ': (区切り)', value: ':' },
          { id: '.', label: '. (カレント)', value: '.' },
          { id: '-R', label: '-R', value: '-R' }
        ]
      },
      playerB: {
        roleLabel: 'Player B / 対象ファイル管理官',
        hint: 'ユーザーとファイルの実情を把握しています。Aの指示に合わせて正しい対象を投入しましょう。',
        intel: '新しい所有者は user1 です。対象ファイルは config.txt。グループは変更不要です。',
        options: [
          { id: 'user1', label: 'user1', value: 'user1' },
          { id: 'user2', label: 'user2', value: 'user2' },
          { id: 'config.txt', label: 'config.txt', value: 'config.txt' },
          { id: 'settings.yaml', label: 'settings.yaml', value: 'settings.yaml' },
          { id: 'app.log', label: 'app.log', value: 'app.log' }
        ]
      },
      successMessage: 'OWNERSHIP UPDATED 🔐',
      failureMessage: '権限の指定を間違えました。指定順序と対象を再確認してください。'
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
      room.currentProgress = [];
      room.isCleared = false;
      io.to(roomId).emit('gameStart', {
        stage: room.stage,
        puzzle: room.puzzle,
        nextRole: room.puzzle.sequence?.[0]?.role || null
      });
    }

    console.log(`Player joined room ${roomId} as Player ${role}`);
  });

  socket.on('submitAction', ({ roomId, action, role }) => {
    const room = rooms.get(roomId);

    if (!room || !room.isGameStarted) {
      return;
    }

    const puzzle = room.puzzle;
    if (puzzle.sequence) {
      const currentIndex = room.currentProgress.length;
      const expectedStep = puzzle.sequence[currentIndex];

      if (!expectedStep) {
        return;
      }

      if (expectedStep.role !== role) {
        const turnMessage = expectedStep.role === 'A'
          ? '今はPlayer Aの番です。相談して順番を確認しましょう。'
          : '今はPlayer Bの番です。相談して順番を確認しましょう。';
        io.to(roomId).emit('incorrect', { message: turnMessage });
      } else if (expectedStep.value === action) {
        room.currentProgress.push({ role, value: action });

        if (room.currentProgress.length === puzzle.sequence.length) {
          room.isCleared = true;
          io.to(roomId).emit('stageClear', { 
            stage: room.stage,
            message: puzzle.successMessage || `ステージ${room.stage}クリア！`
          });
        }
      } else {
        room.currentProgress = [];
        room.isCleared = false;
        io.to(roomId).emit('incorrect', { message: puzzle.failureMessage || '組み合わせが違います。最初から試してください。' });
      }
    }

    const nextStep = puzzle.sequence?.[room.currentProgress.length] || null;

    io.to(roomId).emit('progressUpdate', { 
      progress: room.currentProgress,
      isCleared: room.isCleared,
      nextRole: nextStep ? nextStep.role : null
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
      puzzle: room.puzzle,
      nextRole: room.puzzle.sequence?.[0]?.role || null
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
