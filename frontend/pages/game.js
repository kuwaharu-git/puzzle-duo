import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function Game() {
  const router = useRouter();
  const { create, roomId: queryRoomId } = router.query;

  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [role, setRole] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [stage, setStage] = useState(1);
  const [puzzle, setPuzzle] = useState(null);
  const [progress, setProgress] = useState([]);
  const [isCleared, setIsCleared] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('roomCreated', ({ roomId, role }) => {
      setRoomId(roomId);
      setRole(role);
      setMessage('部屋を作成しました。もう一人のプレイヤーを待っています...');
    });

    newSocket.on('roomJoined', ({ roomId, role }) => {
      setRoomId(roomId);
      setRole(role);
      setMessage('部屋に参加しました。');
    });

    newSocket.on('gameStart', ({ stage, puzzle }) => {
      setGameStarted(true);
      setStage(stage);
      setPuzzle(puzzle);
      setProgress([]);
      setIsCleared(false);
      setMessage('');
    });

    newSocket.on('progressUpdate', ({ progress, isCleared }) => {
      setProgress(progress);
      setIsCleared(isCleared);
    });

    newSocket.on('stageClear', ({ stage }) => {
      setIsCleared(true);
      setMessage(`ステージ${stage}クリア！`);
    });

    newSocket.on('incorrect', ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 3000);
    });

    newSocket.on('gameComplete', ({ message }) => {
      setIsComplete(true);
      setMessage(message);
    });

    newSocket.on('playerLeft', ({ message }) => {
      setError(message);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    });

    newSocket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    });

    return () => newSocket.close();
  }, [router]);

  useEffect(() => {
    if (!socket || !router.isReady) return;

    if (create === 'true') {
      socket.emit('createRoom');
    } else if (queryRoomId) {
      socket.emit('joinRoom', queryRoomId);
    }
  }, [socket, create, queryRoomId, router.isReady]);

  const handleAction = (action) => {
    if (socket && roomId) {
      socket.emit('submitAction', { roomId, action });
    }
  };

  const handleNextStage = () => {
    if (socket && roomId) {
      socket.emit('nextStage', { roomId });
    }
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          {roomId && (
            <>
              <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">部屋ID</h2>
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <p className="text-4xl font-mono text-center text-purple-600">{roomId}</p>
              </div>
              <p className="text-center text-gray-600 mb-4">この部屋IDを相手に共有してください</p>
              <p className="text-center text-sm text-gray-500">あなたの役割: Player {role}</p>
            </>
          )}
          {message && (
            <div className="mt-4 p-4 bg-blue-100 text-blue-800 rounded-lg text-center">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-blue-500">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">🎉 おめでとうございます！ 🎉</h1>
          <p className="text-xl text-gray-600 mb-8">{message}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-6 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Puzzle Duo</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">部屋: {roomId}</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                Player {role}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                Stage {stage}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {role === 'A' ? (
            <PlayerAView puzzle={puzzle} />
          ) : (
            <PlayerBView 
              puzzle={puzzle} 
              onAction={handleAction} 
              progress={progress}
              isCleared={isCleared}
            />
          )}
          
          {role === 'B' ? (
            <PlayerAView puzzle={puzzle} isObserver={true} />
          ) : (
            <PlayerBView 
              puzzle={puzzle} 
              onAction={handleAction} 
              progress={progress}
              isCleared={isCleared}
              isObserver={true}
            />
          )}
        </div>

        {isCleared && (
          <div className="mt-4 bg-white rounded-lg shadow-2xl p-6 text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">ステージクリア！</h2>
            <button
              onClick={handleNextStage}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
            >
              次のステージへ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerAView({ puzzle, isObserver = false }) {
  return (
    <div className={`bg-white rounded-lg shadow-xl p-6 ${isObserver ? 'opacity-50' : ''}`}>
      <h2 className="text-xl font-bold mb-4 text-purple-600">
        {isObserver ? 'Player A の画面（参考）' : 'あなたはPlayer A - ヒント役'}
      </h2>
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
        <h3 className="font-bold text-yellow-800 mb-2">💡 ヒント:</h3>
        <p className="text-gray-700">{puzzle?.hint}</p>
      </div>
      <div className="mt-4 bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Player Bに口頭でヒントを伝えて、正しい操作を行ってもらいましょう！
        </p>
      </div>
    </div>
  );
}

function PlayerBView({ puzzle, onAction, progress, isCleared, isObserver = false }) {
  if (puzzle?.correctSequence) {
    return (
      <div className={`bg-white rounded-lg shadow-xl p-6 ${isObserver ? 'opacity-50' : ''}`}>
        <h2 className="text-xl font-bold mb-4 text-pink-600">
          {isObserver ? 'Player B の画面（参考）' : 'あなたはPlayer B - 操作役'}
        </h2>
        
        <div className="mb-4">
          <h3 className="font-semibold text-gray-700 mb-2">現在の入力:</h3>
          <div className="flex gap-2 flex-wrap min-h-[40px] bg-gray-50 rounded p-2">
            {progress.map((item, index) => (
              <span key={index} className="px-3 py-1 bg-blue-500 text-white rounded">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {puzzle.options.map((option) => (
            <button
              key={option}
              onClick={() => !isObserver && !isCleared && onAction(option)}
              disabled={isObserver || isCleared}
              className={`py-3 px-4 rounded-lg font-semibold transition duration-200 ${
                isObserver || isCleared
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-pink-500 hover:bg-pink-600 text-white transform hover:scale-105'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        
        {!isObserver && (
          <div className="mt-4 bg-pink-50 rounded-lg p-4">
            <p className="text-sm text-pink-800">
              Player Aのヒントを聞いて、正しい順番でボタンを押してください！
            </p>
          </div>
        )}
      </div>
    );
  }

  if (puzzle?.correctAnswer !== undefined) {
    return (
      <div className={`bg-white rounded-lg shadow-xl p-6 ${isObserver ? 'opacity-50' : ''}`}>
        <h2 className="text-xl font-bold mb-4 text-pink-600">
          {isObserver ? 'Player B の画面（参考）' : 'あなたはPlayer B - 操作役'}
        </h2>
        
        <div className="grid grid-cols-2 gap-2">
          {puzzle.options.map((option) => (
            <button
              key={option}
              onClick={() => !isObserver && !isCleared && onAction(option)}
              disabled={isObserver || isCleared}
              className={`py-3 px-4 rounded-lg font-semibold transition duration-200 ${
                isObserver || isCleared
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-pink-500 hover:bg-pink-600 text-white transform hover:scale-105'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        
        {!isObserver && (
          <div className="mt-4 bg-pink-50 rounded-lg p-4">
            <p className="text-sm text-pink-800">
              Player Aのヒントを聞いて、正しい答えを選んでください！
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
