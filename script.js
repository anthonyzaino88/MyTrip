// formHandler.js

const questions = [
    {
        question: "What type of vacation are you looking for?",
        type: "select",
        options: ["Relaxation", "Adventure", "Cultural", "Family", "Romantic"]
    },
    {
        question: "What activities do you like?",
        type: "select",
        options: ["Hiking", "Dining", "Sightseeing", "Beach", "Museums"]
    },
    {
        question: "What is your budget range?",
        type: "select",
        options: ["<$500", "$500-$1000", "$1000-$2000", ">$2000"]
    },
    {
        question: "How long is your trip?",
        type: "select",
        options: ["3 days", "5 days", "1 week", "2 weeks"]
    },
    {
        question: "Do you have any preferred destinations?",
        type: "text",
        placeholder: "e.g., Paris, Tokyo"
    },
    {
        question: "What are your travel dates?",
        type: "date-range"
    },
    {
        question: "Do you have any dietary restrictions?",
        type: "text",
        placeholder: "e.g., Vegetarian, Vegan"
    },
    {
        question: "Who are you traveling with?",
        type: "select",
        options: ["Solo", "Couple", "Family", "Friends"]
    }
];

let currentQuestionIndex = 0;
const formContainer = document.getElementById('form-container');
const questionContainer = document.getElementById('question-container');
const nextButton = document.getElementById('next-button');
const formData = {};

function loadQuestion() {
    const currentQuestion = questions[currentQuestionIndex];
    questionContainer.style.opacity = 0;

    setTimeout(() => {
        questionContainer.innerHTML = '';
    
        const label = document.createElement('label');
        label.textContent = currentQuestion.question;
        questionContainer.appendChild(label);
    
        if (currentQuestion.type === 'select') {
            const select = document.createElement('select');
            select.name = currentQuestionIndex;
            currentQuestion.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.toLowerCase();
                optionElement.textContent = option;
                select.appendChild(optionElement);
            });
            questionContainer.appendChild(select);
        } else if (currentQuestion.type === 'text') {
            const input = document.createElement('input');
            input.type = 'text';
            input.name = currentQuestionIndex;
            input.placeholder = currentQuestion.placeholder;
            questionContainer.appendChild(input);
        } else if (currentQuestion.type === 'date-range') {
            const startDate = document.createElement('input');
            startDate.type = 'date';
            startDate.name = 'start-date';
            questionContainer.appendChild(startDate);
    
            const endDate = document.createElement('input');
            endDate.type = 'date';
            endDate.name = 'end-date';
            questionContainer.appendChild(endDate);
        }
    
        nextButton.style.display = 'block';
        questionContainer.style.opacity = 1;
    }, 500);
}

function handleNextButtonClick() {
    const currentQuestion = questions[currentQuestionIndex];
    const answer = document.querySelector(`[name="${currentQuestionIndex}"]`)?.value ||
                   { startDate: document.querySelector('[name="start-date"]')?.value,
                     endDate: document.querySelector('[name="end-date"]')?.value };

    formData[currentQuestion.question] = answer;
    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        submitForm();
    }
}

function submitForm() {
    console.log(formData); // For debugging
    // Send formData to your backend or AI service
    fetch('/api/getRecommendations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(recommendations => {
        console.log(recommendations);
        // Display recommendations to the user
        // You can redirect to another page or update the current page's content
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

nextButton.addEventListener('click', handleNextButtonClick);

// Load the first question on page load
loadQuestion();
