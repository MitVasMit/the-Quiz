import { shuffleArray } from "./shuffle.js";

class Question {
  constructor(questionText, correctAnswer, incorrectAnswer) {
    this.questionText = questionText;
    this.correctAnswer = correctAnswer;
    this.incorrectAnswer = incorrectAnswer;
  }
}

const questionContainer = document.querySelector("#question-container");
const progressBar = document.querySelector("#progress-bar");

let questions = [];
let currentQuestionIndex = 0;
let correctAnswersCount = 0;

async function fetchQuestions() {
  const responce = await fetch("https://opentdb.com/api.php?amount=20");
  const data = await responce.json();
  questions = data.results.map((result) => {
    const { question, correct_answer, incorrect_answers } = result;
    return new Question(question, correct_answer, incorrect_answers);
  });
}

function displayQuestion(index) {
  const question = questions[index];
  if (question) {
    const choices = [...question.incorrectAnswer, question.correctAnswer];
    shuffleArray(choices);
    questionContainer.innerHTML = `
    <p class="animate__animated animate__backInDown">${
      question.questionText
    }</p>
    <ul class="animate__animated animate__backInUp">
      ${choices.map((answer) => `<li>${answer}</li>`).join("")}
    </ul>
    <small>Question ${index + 1}/20</small>
    `;
    progressBar.value++;
  }
}

window.addEventListener("hashchange", () => {
  const hash = window.location.hash;
  if (hash.startsWith("#question-")) {
    const index = parseInt(hash.substring(10));
    if (!isNaN(index) && index >= 1 && index <= questions.length) {
      currentQuestionIndex = index - 1;
      displayQuestion(currentQuestionIndex);
    } else if (index > questions.length) {
      if (correctAnswersCount != 20) {
        if (correctAnswersCount === 0) {
          questionContainer.innerHTML = `
            <p>Sorry to tell you this, but you didn't get any question right :( 
            </p><br>
            <p>Whant to try again maybe?</p>`;
          progressBar.style.display = "none";
        } else {
          questionContainer.innerHTML = `
            <h2>Quiz Complete</h2>
            <p>You answered ${correctAnswersCount} out of ${questions.length} questions correctly.</p> <br>
            <p>Whant to try again maybe?</p>
            `;
          progressBar.style.display = "none";
        }
      } else {
        questionContainer.innerHTML = `
            <h2>Congratulations, you have answered all questions right</h2>
        `;
      }
    }
  }
});

document
  .querySelector("#question-container")
  .addEventListener("click", (event) => {
    if (event.target.tagName === "LI") {
      const selectedAnswer = event.target.textContent;
      const currentQuestion = questions[currentQuestionIndex];
      if (selectedAnswer === currentQuestion.correctAnswer) {
        correctAnswersCount++;
      }
      currentQuestionIndex++;

      localStorage.setItem("currentQuestionIndex", currentQuestionIndex);
      localStorage.setItem("correctAswersCount", correctAnswersCount);
      window.location.hash = `#question-${currentQuestionIndex + 1}`;
    }
  });

// fetch the questions as soon as the DOM loading is complete
document.addEventListener("DOMContentLoaded", () => {
  fetchQuestions().then(() => {
    const loadingScreen = document.querySelector("#loading-screen");
    loadingScreen.style.display = "none";
    const startScreen = document.querySelector("#start-screen");
    const startOverScreen = document.querySelector("#start-over");
    const progressBar = document.querySelector("#progress-bar");

    const storedCurrentQuestionIndex = localStorage.getItem(
      "currentQuestionIndex"
    );
    if (storedCurrentQuestionIndex) {
      // continue from where the user left (if suddenly page refreshes, or user loses Internet connection)
      currentQuestionIndex = parseInt(storedCurrentQuestionIndex);
      correctAnswersCount =
        parseInt(localStorage.getItem("correctAnswersCount")) || 0;
      progressBar.value = currentQuestionIndex;
      startOverScreen.style.display = "block";
      progressBar.style.display = "block";

      if (currentQuestionIndex < questions.length) {
        displayQuestion(currentQuestionIndex);
      } else {
        // quiz complete
        startScreen.style.display = "none";
      }
    } else {
      startScreen.style.display = "block";
    }
  });
});

document.querySelector("#start-btn").addEventListener("click", () => {
  // start the quiz by displaying the first question
  document.querySelector("#start-screen").style.display = "none";
  document.querySelector("#progress-bar").style.display = "block";
  document.querySelector("#start-over").style.display = "block";

  displayQuestion(currentQuestionIndex);
  localStorage.setItem("currentQuestionIndex", currentQuestionIndex);
});

document
  .querySelector("#start-over-btn")
  .addEventListener("click", async () => {
    // hide the "start-over" div and display the "start-screen" div
    document.querySelector("#start-over").style.display = "none";
    document.querySelector("#start-screen").style.display = "block";
    document.querySelector("#progress-bar").style.display = "none";

    window.location.hash = "";
    questionContainer.innerHTML = "";

    // fetch new 20 questions so the user doesnt have a chance to remember the questions and then answer them correctly the secont time after "start-over"
    await fetchQuestions();

    // reset variales
    currentQuestionIndex = 0;
    correctAnswersCount = 0;
    progressBar.value = 0;

    localStorage.clear();
  });
