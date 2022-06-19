const quizData = {
    title: "US Common Knowledge"
  };
  
  const questions = [
    {
      text: "What is the capital of the United States?",
      type: "mc",
      answers: [
        { text: "New York City", correct: false },
        { text: "Philadelphia", correct: false },
        { text: "Washington D.C.", correct: true },
        { text: "Chicago", correct: false }
      ]
    },
    {
      text: "What is the largest state in the US?",
      type: "mc",
      answers: [
        { text: "California", correct: false },
        { text: "Alaska", correct: true },
        { text: "Texas", correct: false },
        { text: "Nevada", correct: false }
      ]
    },
    {
      text: "Where was the first capital of the US?",
      type: "txt",
      answers: ["Philadelphia"]
    }
  ];
  
  module.exports = { quizData, questions };  