var startBtn = document.querySelector(".start-btn"),
  nextBtn = document.querySelector(".next-btn"),
  questionElement = document.querySelector(".question"),
  answersContainer = document.querySelector(".q-container"),
  quizTitleElement = document.querySelector(".quiz-title"),
  result = document.getElementById("result"),
  numPreguntas =  document.getElementById("numPreguntas"),
  progressBar = document.getElementById("progressBar"),
  correctCount = document.querySelector(".correct-count");
let currentQuestion = 0;
let correct = 0;

var host = window.location.origin;
var socket = io.connect(host);


window.addEventListener("load", () => {
  quizTitleElement.innerHTML = quizData.title;
  numPreguntas.innerHTML = questions.length;
});

startBtn.addEventListener("click", () => {
  startQuiz();
});

nextBtn.addEventListener("click", () => {
  loadQuestion(++currentQuestion);
});
let numTotalPoints = 0;
let numPoints = 0;
let arrEncerts = new Array(questions.length);
function startQuiz() {
  console.log("start Quiz");
  for (var i=0; i < questions.length; i++) {
    //console.log(questions[i].points);
    if (questions[i].points === undefined){
      numTotalPoints = numTotalPoints + 1;
    }
    else{
      numTotalPoints = numTotalPoints + questions[i].points;
    }
 }
 progressBar.max = numTotalPoints;
 console.log("NUm totla points: " + numTotalPoints);
  startBtn.classList.add("hide");
  nextBtn.classList.remove("hide");
  questionElement.classList.remove("hide");
  answersContainer.classList.remove("hide");
  correctCount.classList.remove("hide");
  for(i = 0; i < questions.length; i++) {
    $('#ariadnaThread').append('<div style="background-color: rgb(231, 126, 35);" class="item" id="item-'+ i +'" >' + (i+1) +  '</div>');
  }
  loadQuestion(currentQuestion);
  console.log(questions);
}

function loadQuestion(questionNum) {
  console.log("carrega quest"+ questionNum);
  numPreguntas.innerHTML = correct + "/" + questions.length;

  result.innerHTML = "";
  if (currentQuestion === questions.length) {
    startBtn.classList.remove("hide");
    nextBtn.classList.add("hide");
    questionElement.classList.add("hide");
    answersContainer.classList.add("hide");
    startBtn.innerHTML = "Restart";
    correct = 0;
    correctCount.innerHTML = `Correct: ${correct}/${questions.length}`;
    $('.item').remove();
    arrEncerts = new Array(questions.length);
    currentQuestion = 0;
  } else {
    while (answersContainer.firstChild) {
      answersContainer.removeChild(answersContainer.firstChild);
    }
    answersContainer.dataset.type = null;
    questionElement.innerHTML = questions[questionNum].id + " " + questions[questionNum].text;
    // Question types
    var btnGrid = document.createElement("div");
    btnGrid.setAttribute("id", questions[questionNum].id);
    if (questions[questionNum].type === "mc") {
      answersContainer.appendChild(btnGrid);
      questions[questionNum].answers.forEach((answer) => {
        var answerElement = document.createElement("button");
        btnGrid.classList.add("btn-grid");
        answerElement.innerHTML = answer.text;
        //answerElement.dataset.correct = answer.correct;
        answerElement.addEventListener("click", (e) => {
          Array.from(btnGrid.children).forEach(
            (element) => (element.disabled = true)
          );
          e.target.dataset.clicked = "true";
          console.log("clicked on it");
          e.target.style.backgroundColor = "blue";
          checkAnswer(e, updateDB);
        });
        btnGrid.appendChild(answerElement);
      });
      answersContainer.dataset.type = "mc";
      
    } else if (questions[questionNum].type === "txt") {
      var inputElement = document.createElement("input");
      answersContainer.appendChild(btnGrid);
      var checkBtn = document.createElement("button");
      checkBtn.innerHTML = "Check";
      checkBtn.classList.add("check-btn");
      inputElement.type = "text";
      checkBtn.addEventListener("click", (e) => {
        checkAnswer(e, updateDB);
      });
      answersContainer.appendChild(inputElement);
      answersContainer.appendChild(checkBtn);
      answersContainer.dataset.type = "txt";

    }else if (questions[questionNum].type === "check") {
      answersContainer.appendChild(btnGrid);
      var checkBtn = document.createElement("button");
      checkBtn.innerHTML = "Check";
      checkBtn.classList.add("check-btn");
      checkBtn.addEventListener("click", (e) => {
        checkAnswer(e, updateDB);
      });

      answersContainer.appendChild(checkBtn);
      answersContainer.dataset.type = "check";
    }
    correctCount.innerHTML = `Correct: ${correct}`;
  }

  if (currentQuestion != 0) {
    for(i = 0; i < questions.length; i++) {
      document.getElementById("item-" + i).classList.remove("itemSelected");
      if (arrEncerts[i] == 1){
        document.getElementById("item-" + i).style.backgroundColor = "green";
      }
      else if (arrEncerts[i] == 0){
        document.getElementById("item-" + i).style.backgroundColor = "red";
      }
    }

    console.log(questions[questionNum].pre);
  if(questions[questionNum].pre !== undefined){
    console.log("El slug es " + quizData.slug);
    socket.emit('execQuiz', {tipus: "pre", currentQuestion: currentQuestion, idContainer: id, slug: quizData.slug }, (response) => {
      socket.removeAllListeners();
      socket.disconnect();
    });
  }
  document.getElementById("item-" + questionNum).classList.add("itemSelected");

  }
}

function updateDB(arrAciertos, puntos){
  console.log(arrAciertos)
  console.log(puntos)
  var mapQuiz = { slugLaboratori: quizData.slug, firstName: firstName, lastName: lastName,
    email: email, nota: puntos, arrEncerts: arrAciertos }
  socket.emit("postQuestion", mapQuiz);
}

var id = window.location.pathname.split('/')[3];
function checkAnswer(e, myCallback) {
  // Check different types
  let puntsActuals = 0;
  let solucio = "";
  switch (answersContainer.dataset.type) {
    case "mc":
      console.log(answersContainer.children[0].id);
      console.log(quizData.slug);
      $.ajax({
        type: 'post',
        url: '/containers/checkAnswer/ajax',
        data: {slug: quizData.slug, id: answersContainer.children[0].id },
        dataType: 'text',
        async: false
      })
      .done(function(data){
          solucio = JSON.parse(data).var1;
      });
      console.log(quizData.slug.replace(".js", ""));
      
      Array.from(answersContainer.children[0].children).forEach((button) => {
        if (button.dataset.clicked){
          button.style.border = "3px solid gray";
        }  
        if (button.textContent === solucio) {
            button.classList.add("correct");
            
            if (button.dataset.clicked === "true"){
              document.getElementById("item-" + (answersContainer.children[0].id-1)).style.backgroundColor = "green";
              correct++;
              puntsActuals = (typeof questions[currentQuestion].points !== "undefined") ? questions[currentQuestion].points : 1;
              numPoints = numPoints + puntsActuals;
              progressBar.value = numPoints;
              console.log("Punts actuals: " + puntsActuals);
              arrEncerts[(answersContainer.children[0].id)-1] = 1;
            }
            else{
              arrEncerts[(answersContainer.children[0].id)-1] = 0;
              document.getElementById("item-" + (answersContainer.children[0].id-1)).style.backgroundColor = "red";
            }
        } else {
            button.classList.add("wrong");
            //document.getElementById("item-" + (answersContainer.children[0].id)-1).style.backgroundColor = "red";
        }

        });
      numPreguntas.innerHTML = correct + "/" + questions.length;
      break;

    case "txt":
      var qInputElement = answersContainer.children[1];
      var foundValues = questions[currentQuestion].answers.find(
        (answer) => answer.toUpperCase() === qInputElement.value.toUpperCase()
      );
      console.log("foundValue"+foundValues);
      if (foundValues) {
        qInputElement.classList.add("correct");
        puntsActuals = (typeof questions[currentQuestion].points !== "undefined") ? questions[currentQuestion].points : 1;
        numPoints = numPoints + puntsActuals;
        progressBar.value = numPoints;
        arrEncerts[(answersContainer.children[0].id)-1] = 1;
        correct++;
        document.getElementById("item-" + (answersContainer.children[0].id-1)).style.backgroundColor = "green";
      } else {
        qInputElement.classList.add("wrong");
        arrEncerts[(answersContainer.children[0].id)-1] = 0;
        document.getElementById("item-" + (answersContainer.children[0].id-1)).style.backgroundColor = "red";
      }
      break;
    
    case "check":
      socket.emit('execQuiz', { tipus: 'check', currentQuestion: currentQuestion, idContainer: id, slug: quizData.slug }, (response) => {
        socket.removeAllListeners();
        socket.disconnect();
      });
      socket.on('returnDrawerResponse', function(message) {
        if (message.trim() === "0"){
          correct++;
          //result.innerHTML = "correct";
          arrEncerts[(answersContainer.children[0].id)-1] = 1;
          puntsActuals = (typeof questions[currentQuestion].points !== "undefined") ? questions[currentQuestion].points : 1;
          numPoints = numPoints + puntsActuals;
          progressBar.value = numPoints;
          console.log("punts actuals chekc: " + puntsActuals);
          numPreguntas.innerHTML = correct + "/" + questions.length;
          document.getElementById("item-" + (answersContainer.children[0].id-1)).style.backgroundColor = "green";
        }
        else{
          //result.innerHTML = "wrong";
          arrEncerts[(answersContainer.children[0].id)-1] = 0;
          document.getElementById("item-" + (answersContainer.children[0].id-1)).style.backgroundColor = "red";
        }
      });
      console.log(e);
      e.target.style.visibility = 'hidden';
      break;

    default:
      return;
      break;
  }
  myCallback(arrEncerts, numPoints);
  console.log("PuntsFinsAlmomemnnt" + numPoints);
  
  //alert(numPoints);
}

