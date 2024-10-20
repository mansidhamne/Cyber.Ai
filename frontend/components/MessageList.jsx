import React from 'react';

const MessageList = ({ messages }) => {
  return (
    <div className="flex-grow overflow-y-auto p-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`mb-2 p-2 rounded ${
            message.sender === 'user' ? 'bg-gray-600 text-right' : 'bg-gray-100'
          }`}
        >
          {message.text}
        </div>
      ))}
    </div>
  );
};

export default MessageList;