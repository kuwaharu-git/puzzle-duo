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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">Puzzle Duo</h1>
        <p className="text-center text-gray-600 mb-8">協力型オンラインパズルゲーム</p>
        
        <div className="space-y-6">
          <div>
            <button
              onClick={handleCreateRoom}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-105"
            >
              部屋を作成
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">または</span>
            </div>
          </div>
          
          <div>
            <input
              type="text"
              placeholder="部屋IDを入力"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={6}
            />
            <button
              onClick={handleJoinRoom}
              disabled={!roomId.trim()}
              className="w-full mt-2 bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              部屋に参加
            </button>
          </div>
        </div>
        
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h2 className="font-bold text-gray-800 mb-2">ゲームの遊び方：</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 2人で協力してパズルを解きます</li>
            <li>• Player A: ヒントを見る役割</li>
            <li>• Player B: 操作を行う役割</li>
            <li>• 情報を共有してクリアを目指そう！</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
