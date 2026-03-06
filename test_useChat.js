const { renderHook } = require('@testing-library/react-hooks');
const { useChat } = require('@ai-sdk/react');

console.log(Object.keys(useChat()));
