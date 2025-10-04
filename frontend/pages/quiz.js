import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function Quiz() {
  const router = useRouter();

  const [socket, setSocket] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionId, setCurrentQuestionId] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('quizStarted', ({ sessionId, question, currentQuestionId, totalQuestions }) => {
      setSessionId(sessionId);
      setCurrentQuestion(question);
      setCurrentQuestionId(currentQuestionId);
      setTotalQuestions(totalQuestions);
      setGameStarted(true);
      setShowExplanation(false);
      setSelectedAnswer(null);
    });

    newSocket.on('quizAnswerResult', ({ isCorrect, explanation, message }) => {
      if (isCorrect) {
        setShowExplanation(true);
        setExplanation(explanation);
        setMessage('正解！次の問題へ進みましょう。');
      } else {
        setError(message);
        setSelectedAnswer(null);
        setTimeout(() => setError(''), 3000);
      }
    });

    newSocket.on('quizQuestionUpdate', ({ question, currentQuestionId, totalQuestions }) => {
      setCurrentQuestion(question);
      setCurrentQuestionId(currentQuestionId);
      setTotalQuestions(totalQuestions);
      setShowExplanation(false);
      setMessage('');
      setSelectedAnswer(null);
    });

    newSocket.on('quizComplete', ({ message, totalQuestions }) => {
      setIsComplete(true);
      setMessage(message);
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
    socket.emit('startQuiz');
  }, [socket, router.isReady]);

  const handleAnswer = (answer) => {
    if (socket && sessionId && !showExplanation) {
      setSelectedAnswer(answer);
      socket.emit('submitQuizAnswer', { sessionId, answer });
    }
  };

  const handleNextQuestion = () => {
    if (socket && sessionId) {
      socket.emit('nextQuizQuestion', { sessionId });
    }
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-gray-900 border-2 border-green-500 rounded-lg shadow-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-pulse">
              <p className="text-green-500 font-mono text-xl mb-4">&gt; Loading...</p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-900 border border-red-500 text-red-300 rounded font-mono text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-gray-900 border-2 border-green-500 rounded-lg shadow-2xl p-8 max-w-2xl w-full text-center">
          <h1 className="text-4xl font-bold mb-4 text-green-500 font-mono">
            🎉 MISSION COMPLETE 🎉
          </h1>
          <p className="text-xl text-green-400 mb-8 font-mono">{message}</p>
          <div className="bg-black p-4 rounded border border-green-700 mb-8">
            <p className="text-green-500 font-mono text-sm">
              &gt; すべての問題をクリアしました！
            </p>
            <p className="text-green-400 font-mono text-xs mt-2">
              &gt; Total Questions: {totalQuestions}/{totalQuestions}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 hover:bg-green-700 text-black font-bold py-3 px-6 rounded-lg transition duration-200 font-mono border-2 border-green-400"
          >
            &gt; ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gray-900 border-2 border-green-500 rounded-lg shadow-2xl p-6 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-green-500 font-mono">&gt; HACKER QUIZ_</h1>
            <div className="flex items-center gap-4">
              <span className="text-green-400 font-mono text-sm">
                Question: {currentQuestionId}/{totalQuestions}
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 border-2 border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4 font-mono text-sm">
            &gt; ERROR: {error}
          </div>
        )}

        {/* Success Message */}
        {message && !showExplanation && (
          <div className="bg-green-900 border-2 border-green-500 text-green-300 px-4 py-3 rounded-lg mb-4 font-mono text-sm">
            &gt; {message}
          </div>
        )}

        {/* Question Section */}
        <div className="bg-gray-900 border-2 border-green-500 rounded-lg shadow-2xl p-6 mb-4">
          <div className="mb-6">
            <p className="text-green-500 font-mono text-sm mb-2">&gt; QUESTION #{currentQuestionId}:</p>
            <p className="text-green-400 font-mono text-lg mb-4">{currentQuestion?.question}</p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <p className="text-green-500 font-mono text-sm mb-3">&gt; SELECT ANSWER:</p>
            {currentQuestion?.options.map((option, index) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={showExplanation}
                className={`w-full text-left p-4 rounded-lg font-mono transition duration-200 border-2 ${
                  showExplanation
                    ? option === currentQuestion.correctAnswer
                      ? 'bg-green-900 border-green-500 text-green-300'
                      : selectedAnswer === option
                      ? 'bg-red-900 border-red-500 text-red-300'
                      : 'bg-gray-800 border-gray-700 text-gray-500'
                    : selectedAnswer === option
                    ? 'bg-green-700 border-green-400 text-black'
                    : 'bg-gray-800 border-green-700 text-green-400 hover:bg-gray-700 hover:border-green-500'
                }`}
              >
                <span className="text-green-500">[{index + 1}]</span> {option}
              </button>
            ))}
          </div>
        </div>

        {/* Explanation Section */}
        {showExplanation && (
          <div className="bg-gray-900 border-2 border-green-500 rounded-lg shadow-2xl p-6 mb-4">
            <p className="text-green-500 font-mono text-sm mb-2">&gt; EXPLANATION:</p>
            <p className="text-green-400 font-mono text-sm mb-6">{explanation}</p>
            <div className="text-center">
              <button
                onClick={handleNextQuestion}
                className="bg-green-600 hover:bg-green-700 text-black font-bold py-3 px-6 rounded-lg transition duration-200 font-mono border-2 border-green-400"
              >
                &gt; 次の問題へ [ENTER]
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-900 border-2 border-green-500 rounded-lg shadow-2xl p-4">
          <p className="text-green-600 font-mono text-xs text-center">
            &gt; Hacker Quiz v1.0 | Press number keys [1-4] to select answer
          </p>
        </div>
      </div>
    </div>
  );
}
