import React, { useState, useEffect } from 'react';
import './PromptInput.css';

const PromptInput = ({ sketchId, onPromptSubmit, isProcessing, onActivityUpdate }) => {
  const [prompt, setPrompt] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [typing, setTyping] = useState(false);

  const characterLimit = 500;
  const characterCount = prompt.length;
  const isOverLimit = characterCount > characterLimit;
  const isSubmitDisabled = prompt.length < 3 || isOverLimit || isProcessing;

  // Load nickname from local storage on component mount
  useEffect(() => {
    const savedNickname = localStorage.getItem('user_nickname');
    if (savedNickname) {
      setNickname(savedNickname);
    }
  }, []);

  // Handle typing activity for real-time collaboration
  useEffect(() => {
    let typingTimer;

    if (prompt.length > 0 && !typing) {
      setTyping(true);
      onActivityUpdate && onActivityUpdate(sketchId, 'typing');
    }

    if (typing) {
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        setTyping(false);
        onActivityUpdate && onActivityUpdate(sketchId, 'viewing');
      }, 1000);
    }

    return () => {
      clearTimeout(typingTimer);
    };
  }, [prompt, typing, onActivityUpdate, sketchId]);

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
    setError(null);
  };

  const handleNicknameChange = (e) => {
    setNickname(e.target.value);
    // Save nickname to local storage
    localStorage.setItem('user_nickname', e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitDisabled) return;

    try {
      const result = await onPromptSubmit({
        text: prompt,
        nickname: nickname || undefined
      });

      if (result.success) {
        setSuccess(true);
        setPrompt('');
        
        // Reset success message after a delay
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError(result.error || 'Failed to submit prompt');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    }
  };

  return (
    <div className="prompt-input-container">
      <form onSubmit={handleSubmit}>
        <div className="input-header">
          <label htmlFor="prompt-text">Enter your prompt</label>
          <div className={`character-counter ${isOverLimit ? 'over-limit' : ''}`}>
            {characterCount}/{characterLimit}
          </div>
        </div>

        <textarea
          id="prompt-text"
          value={prompt}
          onChange={handlePromptChange}
          placeholder="Describe what you'd like to add or change in the sketch..."
          disabled={isProcessing}
          aria-describedby="prompt-error prompt-status"
        />

        <div className="nickname-field">
          <label htmlFor="nickname">Your nickname (optional)</label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={handleNicknameChange}
            placeholder="Anonymous"
            maxLength={30}
            disabled={isProcessing}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={`submit-button ${isProcessing ? 'processing' : ''}`}
        >
          {isProcessing ? 'Processing...' : 'Submit Prompt'}
        </button>
      </form>

      {error && (
        <div id="prompt-error" className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div id="prompt-status" className="success-message">
          Prompt submitted successfully!
        </div>
      )}

      <div className="prompt-guidelines">
        <h4>Guidelines</h4>
        <ul>
          <li>Be specific about what you want to change or add</li>
          <li>Avoid requests that might replace the entire sketch</li>
          <li>Keep it appropriate (no rude or harmful content)</li>
          <li>Focus on visual elements and behaviors</li>
        </ul>
      </div>

      <div className="prompt-examples">
        <h4>Example Prompts</h4>
        <ul>
          <li>"Add a blue circle that follows the mouse"</li>
          <li>"Make the background change colors over time"</li>
          <li>"Add bouncing rectangles that respond to clicks"</li>
          <li>"Create a particle system at the center"</li>
        </ul>
      </div>
    </div>
  );
};

export default PromptInput;