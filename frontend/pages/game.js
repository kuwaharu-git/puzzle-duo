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
  const [nextRole, setNextRole] = useState(null);

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

    newSocket.on('gameStart', ({ stage, puzzle, nextRole: incomingNextRole }) => {
      setGameStarted(true);
      setStage(stage);
      setPuzzle(puzzle);
      setProgress([]);
      setIsCleared(false);
      setMessage('');
      setNextRole(incomingNextRole ?? (puzzle?.sequence?.[0]?.role || null));
    });

    newSocket.on('progressUpdate', ({ progress, isCleared, nextRole }) => {
      setProgress(progress || []);
      setIsCleared(isCleared);
      setNextRole(nextRole ?? null);
    });

    newSocket.on('stageClear', ({ stage, message }) => {
      setIsCleared(true);
      setMessage(message || `ステージ${stage}クリア！`);
      setNextRole(null);
    });

    newSocket.on('incorrect', ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 3000);
    });

    newSocket.on('gameComplete', ({ message }) => {
      setIsComplete(true);
      setMessage(message);
      setNextRole(null);
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
      socket.emit('submitAction', { roomId, action, role });
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

        <div className="space-y-4">
            <PuzzleBriefing puzzle={puzzle} progress={progress} nextRole={nextRole} />

            <div className="grid grid-cols-1 gap-4">
              {role === 'A' ? (
                <PlayerAView
                  puzzle={puzzle}
                  onAction={handleAction}
                  nextRole={nextRole}
                  isCleared={isCleared}
                />
              ) : (
                <PlayerBView
                  puzzle={puzzle}
                  onAction={handleAction}
                  nextRole={nextRole}
                  isCleared={isCleared}
                />
              )}
            </div>
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

function PuzzleBriefing({ puzzle, progress, nextRole }) {
  if (!puzzle) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-2xl p-6 mb-4">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{puzzle.title || '作戦概要'}</h2>
          {puzzle.narrative && (
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{puzzle.narrative}</p>
          )}
        </div>

        <CommandProgress progress={progress} nextRole={nextRole} />
      </div>
    </div>
  );
}

function CommandProgress({ progress = [], nextRole }) {
  const hasSteps = Array.isArray(progress) && progress.length > 0;
  const preview = hasSteps ? progress.map((step) => step.value).join(' ') : '';

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">構築中のコマンド</h3>
      <div className="flex flex-wrap gap-2 min-h-[40px] bg-gray-50 rounded-lg p-3 border border-gray-100">
        {hasSteps ? (
          progress.map((step, index) => (
            <span
              key={`${step.value}-${index}`}
              className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${
                step.role === 'A' ? 'bg-purple-500' : 'bg-pink-500'
              }`}
            >
              {step.value}
            </span>
          ))
        ) : (
          <span className="text-sm text-gray-400">まだ入力がありません</span>
        )}
      </div>
      {hasSteps && (
        <p className="mt-2 text-xs text-gray-500 font-mono break-words">{preview}</p>
      )}
      <p className="mt-3 text-sm font-medium text-gray-600">
        {nextRole
          ? `次の手番：Player ${nextRole}`
          : '全ステップ完了！ステージクリアを確認しましょう。'}
      </p>
    </div>
  );
}

function PlayerPanel({ role, data, onAction, nextRole, isCleared }) {
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-6">
        <p className="text-sm text-gray-500">このロールの情報を読み込んでいます...</p>
      </div>
    );
  }

  const isYourTurn = nextRole === role && !isCleared;
  const accentText = role === 'A' ? 'text-purple-600' : 'text-pink-600';
  const accentBadge = role === 'A' ? 'bg-purple-100 text-purple-800' : 'bg-pink-100 text-pink-800';
  const buttonAccent = role === 'A' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-pink-500 hover:bg-pink-600';
  const buttonDisabled = 'bg-gray-300 cursor-not-allowed text-gray-600';
  const indicatorAccent = role === 'A' ? 'bg-purple-500' : 'bg-pink-500';

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-xl font-bold ${accentText}`}>
          {data.roleLabel || `Player ${role}`}
        </h2>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${accentBadge}`}>
          Player {role}
        </span>
      </div>

      {data.hint && (
        <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 mb-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">作戦ヒント</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">{data.hint}</p>
        </div>
      )}

      {data.intel && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-1">保有情報</h3>
          <p className="text-sm text-blue-700 whitespace-pre-line">{data.intel}</p>
        </div>
      )}

      {data.options && data.options.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {data.options.map((option) => (
            <button
              key={option.id || option.value}
              onClick={() => onAction && isYourTurn && onAction(option.value)}
              disabled={!isYourTurn || isCleared}
              className={`py-3 px-4 rounded-lg font-semibold transition duration-200 ${
                isYourTurn && !isCleared
                  ? `${buttonAccent} text-white transform hover:scale-105`
                  : buttonDisabled
              }`}
            >
              {option.label || option.value}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">選択肢はありません。相談して次の手を決めましょう。</p>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className={`w-2 h-2 rounded-full ${indicatorAccent}`} />
        {isCleared
          ? 'ステージクリア！次の指示を待ちましょう。'
          : isYourTurn
            ? 'あなたの番です。最適な選択肢を選びましょう。'
            : nextRole
              ? `Player ${nextRole} の入力を待っています。`
              : '作戦状況を確認中...'}
      </div>
    </div>
  );
}

function PlayerAView({ puzzle, onAction, nextRole, isCleared }) {
  return (
    <PlayerPanel
      role="A"
      data={puzzle?.playerA}
      onAction={onAction}
      nextRole={nextRole}
      isCleared={isCleared}
    />
  );
}

function PlayerBView({ puzzle, onAction, nextRole, isCleared }) {
  return (
    <PlayerPanel
      role="B"
      data={puzzle?.playerB}
      onAction={onAction}
      nextRole={nextRole}
      isCleared={isCleared}
    />
  );
}
