const quizData = {
  title: "US Common Knowledge",
  slug: "us-common-knowledge"
  };
  
  const questions = [
    {
      id: 1,
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
      id: 2,
      text: "Crea el fichero /tmp/pepe.txt",
      type: "check"
    },
    {
      id: 3,
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
      id: 4,
      text: "Which processor is RISC?",
      type: "mc",
      answers: [
        { text: "AMD Sempron", correct: false },
        { text: "Intel i9", correct: false },
        { text: "ARM", correct: true },
        { text: "Intel Celeron", correct: false }
      ]
    },
    {
      id: 5,
      text: "Where was the first capital of the US?",
      type: "txt",
      answers: ["Philadelphia"]
    },
    {
      id: 6,
      text: "Qué ingrediente no forma parte del gazpacho clásico?",
      type: "mc",
      answers: [
        { text: "Tomate", correct: false },
        { text: "Pepino", correct: false },
        { text: "Cebolla", correct: false },
        { text: "Berenjena", correct: true }
      ]
    }
  ];
  
  