import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  const handleStartGame = () => {
    router.push('/game');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-gray-900 border-2 border-green-500 rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 text-green-500 font-mono">
            &gt; HACKER QUIZ_
          </h1>
          <p className="text-green-400 font-mono text-sm mb-4">Linux Command Challenge</p>
          <div className="border-t border-green-500 my-4"></div>
        </div>
        
        <div className="space-y-4 mb-8">
          <div className="bg-black p-4 rounded border border-green-700">
            <p className="text-green-500 font-mono text-sm mb-2">&gt; システム情報:</p>
            <ul className="text-green-400 font-mono text-xs space-y-1 ml-4">
              <li>• Linux コマンドの知識を試す謎解きゲーム</li>
              <li>• 5つの問題を順番に解いていきます</li>
              <li>• 各問題には解説があります</li>
              <li>• ターミナル風のUIで本格的な雰囲気を体験</li>
            </ul>
          </div>
        </div>
        
        <div className="text-center">
          <button
            onClick={handleStartGame}
            className="bg-green-600 hover:bg-green-700 text-black font-bold py-4 px-8 rounded-lg transition duration-200 transform hover:scale-105 font-mono text-lg border-2 border-green-400"
          >
            &gt; ゲームを開始
          </button>
        </div>

        <div className="mt-8 border-t border-green-700 pt-4">
          <p className="text-green-600 font-mono text-xs text-center">
            Press [ENTER] to continue...
          </p>
        </div>
      </div>
    </div>
  );
}
