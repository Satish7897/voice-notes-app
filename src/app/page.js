'use client';

import { useState, useRef } from 'react';
import React from 'react';
import Sidebar from '../components/Sidebar';
import AnalogClock from '../components/AnalogClock';

export default function HomePage() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const SILENCE_TIMEOUT = 2000; // 2 seconds of silence before stopping
  const sidebarRef = useRef(null);

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  };

  const resetSilenceTimeout = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    silenceTimeoutRef.current = setTimeout(() => {
      stopListening();
    }, SILENCE_TIMEOUT);
  };

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported in this browser.');
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Reset silence timeout whenever we get results
        resetSilenceTimeout();
        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopListening();
      };

      recognition.onend = () => {
        // Only restart if we're still supposed to be listening
        if (listening) {
          recognition.start();
        }
      };

      recognitionRef.current = recognition;
    }

    if (listening) {
      stopListening();
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setListening(true);
      resetSilenceTimeout();
    }
  };

  // Clean up timeouts when component unmounts
  React.useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  const generateNotes = async () => {
    if (!transcript) return alert('Please record something first.');
    setLoading(true);
    setNote('');

    try {
      const response = await fetch('/api/generate-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate note');
      }

      setNote(data.note || 'No note generated.');
    } catch (err) {
      console.error('Error details:', err);
      alert(err.message || 'Failed to generate note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addToTodo = () => {
    if (!note) return;

    console.log('Original note:', note); // Debug log for original note

    // Create a temporary div to parse the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note;

    // Get the current date
    const currentDate = new Date();

    // First try to get list items from HTML
    const listItems = tempDiv.querySelectorAll('ul li, ol li');
    console.log('HTML list items found:', listItems.length); // Debug log for HTML items

    if (listItems.length > 0) {
      // Handle HTML list items
      listItems.forEach(item => {
        const text = item.textContent.trim().replace(/\s+/g, ' ');
        if (text) {
          console.log('Adding HTML list item:', text);
          sidebarRef.current?.addTodo(text, currentDate);
        }
      });
    } else {
      // Handle plain text content
      const content = tempDiv.textContent;
      console.log('Plain text content:', content); // Debug log for plain text

      // Split by newlines and filter out empty lines
      const items = content
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      console.log('Found plain text items:', items); // Debug log for found items

      // Add each non-empty item as a todo
      items.forEach((item, index) => {
        if (item) {
          console.log(`Adding item ${index + 1}:`, item);
          sidebarRef.current?.addTodo(item, currentDate);
        }
      });
    }
  };

  return (
    <main className="main-container">
      <div className="greeting-section">
        <AnalogClock />
      </div>
      <div className="content-wrapper">
        <h1 className="title">🎤 Voice to Notes with ChatGPT</h1>

        <div className="content-section">
          <button
            onClick={toggleListening}
            className={`button button-record ${listening ? 'active' : ''}`}
          >
            {listening ? '⏹️ Stop Listening' : '🎙️ Start Listening'}
          </button>

          {transcript && (
            <div className="card fade-in">
              <h2 className="card-title">Live Transcript</h2>
              <p className="card-content">{transcript}</p>
            </div>
          )}

          <button
            onClick={generateNotes}
            disabled={loading || !transcript}
            className="button button-generate"
          >
            {loading ? '✨ Generating Notes...' : '📝 Generate Notes'}
          </button>

          {note && (
            <div className="card note-card fade-in">
              <h2 className="card-title">AI Note</h2>
              <div 
                className="card-content"
                dangerouslySetInnerHTML={{ __html: note }}
              />
              <button
                onClick={addToTodo}
                className="button button-todo"
              >
                📋 Add to Todo List
              </button>
            </div>
          )}
        </div>
      </div>
      <Sidebar ref={sidebarRef} />
    </main>
  );
}
