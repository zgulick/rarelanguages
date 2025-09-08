/**
 * AudioButton Component
 * Reusable audio controls for text-to-speech and recording
 */

import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

const AudioButton = ({ 
  text, 
  language = 'sq-AL', 
  mode = 'play', // 'play' or 'record'
  onRecordingComplete,
  disabled = false,
  size = 'medium',
  variant = 'primary'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  
  const sizeClasses = {
    small: 'p-2 text-sm',
    medium: 'p-3 text-base',
    large: 'p-4 text-lg'
  };
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };
  
  const playAudio = async () => {
    if (!text || isPlaying) return;
    
    try {
      setIsPlaying(true);
      
      // Check if speech synthesis is supported
      if (!('speechSynthesis' in window)) {
        throw new Error('Speech synthesis not supported');
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.8; // Slower for learning
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlaying(false);
      };
      
      speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsPlaying(false);
    }
  };
  
  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }
    
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language;
      
      recognitionRef.current.onstart = () => {
        setIsRecording(true);
      };
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        
        if (onRecordingComplete) {
          onRecordingComplete({ transcript, confidence });
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current.start();
      
    } catch (error) {
      console.error('Recording error:', error);
      setIsRecording(false);
    }
  };
  
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };
  
  const handleClick = () => {
    if (mode === 'play') {
      playAudio();
    } else if (mode === 'record') {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };
  
  const getIcon = () => {
    if (mode === 'play') {
      return isPlaying ? '⏸️' : '🔊';
    } else {
      return isRecording ? '⏹️' : '🎤';
    }
  };
  
  const getLabel = () => {
    if (mode === 'play') {
      return isPlaying ? 'Playing...' : 'Play Audio';
    } else {
      return isRecording ? 'Stop Recording' : 'Record';
    }
  };
  
  return (
    <button
      onClick={handleClick}
      disabled={disabled || (mode === 'play' && !text)}
      className={`
        ${sizeClasses[size]} 
        ${variantClasses[variant]} 
        rounded-lg font-medium transition-all duration-200 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2 min-w-12
        touch-manipulation
      `}
      aria-label={getLabel()}
    >
      <span className="text-lg" role="img" aria-hidden="true">
        {getIcon()}
      </span>
      <span className="hidden sm:inline">
        {getLabel()}
      </span>
    </button>
  );
};

AudioButton.propTypes = {
  text: PropTypes.string,
  language: PropTypes.string,
  mode: PropTypes.oneOf(['play', 'record']),
  onRecordingComplete: PropTypes.func,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger'])
};

export default AudioButton;