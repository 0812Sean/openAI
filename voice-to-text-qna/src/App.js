import React, { useState } from 'react';

// Check if the browser supports the Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

// Set to continuous mode and allow real-time interim results
recognition.continuous = true;
recognition.interimResults = true;

function App() {
  const [text, setText] = useState('');  // Complete final text
  const [interimText, setInterimText] = useState('');  // Real-time interim text
  const [answer, setAnswer] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Start speech recognition
  const startListening = () => {
    setIsSpeaking(true);
    setInterimText('');
    setText('');
    recognition.start();  // Start recognition
  };

  // Stop speech recognition and get the answer
  const stopListening = () => {
    recognition.stop();  // Stop speech recognition
    setIsSpeaking(false);
  };

  // Update the text display in real-time when a speech recognition result is received
  recognition.onresult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = 0; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    // Update interim text in real time
    setInterimText(interimTranscript);
    // Keep the final complete text
    setText(finalTranscript.trim());
  };

  // When speech recognition stops, get the answer
  recognition.onend = () => {
    handleAsk();  // Get the answer after speech recognition stops
  };

  // Trigger this event if there is an error in speech recognition
  recognition.onerror = (event) => {
    console.error('Speech recognition error detected:', event.error);
  };

  // Call the OpenAI API to get an answer to the question
  const fetchAnswer = async (question) => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    
    try {
      const response = await fetch('https://api.openai.com/v1/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'text-davinci-003',
          prompt: question,
          max_tokens: 150,
          temperature: 0.5,
        }),
      });
  
      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        setAnswer(data.choices[0].text.trim());
      } else {
        console.error('No choices in response', data);
        setAnswer('Sorry, I could not find an answer.');
      }
    } catch (error) {
      console.error('Error fetching answer:', error);
      setAnswer('There was an error processing your request.');
    }
  };

  // Handle getting the answer
  const handleAsk = () => {
    if (text && text.trim() !== '') {
      fetchAnswer(text);  // Get the answer based on the speech recognition text
    } else {
      console.error('No question detected to ask.');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Voice to Text Q&A</h1>
      <button 
        onClick={startListening} 
        disabled={isSpeaking}  
      >
        {isSpeaking ? 'Listening...' : 'Start Speaking'}
      </button>
      <button 
        onClick={stopListening} 
        disabled={!isSpeaking}  
      >
        Stop and Get Answer
      </button>
      <p><strong>Real-time Transcript:</strong> {interimText}</p>
      <p><strong>Final Transcript:</strong> {text}</p>
      <p><strong>Answer:</strong> {answer}</p>
    </div>
  );
}

export default App;
