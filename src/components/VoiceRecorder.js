'use client';

import { useState, useRef } from 'react';

export default function VoiceRecorder() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  const handleToggle = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        setListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    }

    if (listening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      recognitionRef.current.start();
    }

    setListening(!listening);
  };

  return (
    <div className="p-4">
      <button
        onClick={handleToggle}
        className={`px-4 py-2 rounded text-white ${
          listening ? 'bg-red-500' : 'bg-blue-600'
        }`}
      >
        {listening ? 'Stop Listening' : 'Start Listening'}
      </button>

      {transcript && (
        <div className="mt-4 p-2 border rounded bg-gray-100 text-black">
          <strong>Transcribed Text:</strong>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
}
