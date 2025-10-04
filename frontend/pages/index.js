import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const router = useRouter();

  const handleCreateRoom = () => {
    router.push('/game?create=true');
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      router.push(`/game?roomId=${roomId}`);
    }
  };

  const handleStartQuiz = () => {
    router.push('/quiz');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">Puzzle Duo</h1>
        <p className="text-center text-gray-600 mb-8">協力型パズル＆ハッカークイズ</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Cooperative Mode */}
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-6 border-2 border-purple-300">
            <h2 className="text-2xl font-bold text-purple-800 mb-4">協力モード</h2>
            <p className="text-sm text-gray-700 mb-4">2人で協力してパズルを解こう！</p>
            
            <div className="space-y-4">
              <button
                onClick={handleCreateRoom}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-105"
              >
                部屋を作成
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-gradient-to-br from-purple-100 to-pink-100 text-gray-500">または</span>
                </div>
              </div>
              
              <div>
                <input
                  type="text"
                  placeholder="部屋IDを入力"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  maxLength={6}
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={!roomId.trim()}
                  className="w-full mt-2 bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                >
                  部屋に参加
                </button>
              </div>
            </div>

            <div className="mt-4 bg-white bg-opacity-50 rounded p-3">
              <p className="text-xs text-gray-700 font-semibold mb-1">遊び方：</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Player A: ヒントを見る</li>
                <li>• Player B: 操作を行う</li>
                <li>• 協力してクリアを目指そう！</li>
              </ul>
            </div>
          </div>

          {/* Quiz Mode */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg p-6 border-2 border-green-500">
            <h2 className="text-2xl font-bold text-green-500 mb-4 font-mono">&gt; クイズモード_</h2>
            <p className="text-sm text-green-400 mb-4 font-mono">Linuxコマンドの知識を試そう！</p>
            
            <button
              onClick={handleStartQuiz}
              className="w-full bg-green-600 hover:bg-green-700 text-black font-bold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-105 font-mono border-2 border-green-400"
            >
              &gt; クイズを開始
            </button>

            <div className="mt-4 bg-black bg-opacity-50 rounded p-3 border border-green-700">
              <p className="text-xs text-green-500 font-semibold mb-1 font-mono">&gt; 特徴：</p>
              <ul className="text-xs text-green-400 space-y-1 font-mono">
                <li>• 一問一答形式（全5問）</li>
                <li>• ターミナル風UI</li>
                <li>• ハッカー/Linux テーマ</li>
                <li>• 解説付きで学習できる</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">
            💡 2つのゲームモードから選んで遊べます！
          </p>
        </div>
      </div>
    </div>
  );
}
