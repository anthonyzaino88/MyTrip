// formHandler.js

const AMADEUS_API_KEY = 'V0d0bW6lNEjP6sMxGZAjvb9hifr0ZoBk'; // Replace with your Amadeus API key
const AMADEUS_API_SECRET = 'sSFQnKiQDxHa5cUB'; // Replace with your Amadeus API secret
let amadeusAccessToken = '';


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
    },
    {
        question: "Do you have kids traveling with you?",
        type: "select",
        options: ["Yes", "No"]
    },
    {
        question: "If yes, what are their age ranges?",
        type: "multi-select",
        options: ["0-2", "3-5", "6-9", "10-12", "13-17"],
        condition: (answers) => answers['Do you have kids traveling with you?'] === 'yes'
    },
    {
        question: "Do you have pets traveling with you?",
        type: "select",
        options: ["Yes", "No"]
    }
];

let currentQuestionIndex = 0;
const formContainer = document.getElementById('form-container');
const questionContainer = document.getElementById('question-container');
const nextButton = document.getElementById('next-button');
const formData = {};

function loadQuestion() {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion.condition && !currentQuestion.condition(formData)) {
        currentQuestionIndex++;
        return loadQuestion();
    }
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
        } else if (currentQuestion.type === 'multi-select') {
            const checkboxes = document.createElement('div');
            checkboxes.classList.add('multi-select');
            currentQuestion.options.forEach(option => {
                const checkboxLabel = document.createElement('label');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = option.toLowerCase();
                checkbox.name = `${currentQuestionIndex}-${option.toLowerCase()}`;
                checkboxLabel.appendChild(checkbox);
                checkboxLabel.appendChild(document.createTextNode(option));
                checkboxes.appendChild(checkboxLabel);
            });
            questionContainer.appendChild(checkboxes);
        }
    
        nextButton.style.display = 'block';
        questionContainer.style.opacity = 1;
    }, 500);
}

async function getAmadeusAccessToken() {
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', AMADEUS_API_KEY);
        params.append('client_secret', AMADEUS_API_SECRET);

        const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching Amadeus access token:', error);
    }
}

async function fetchDestinationSuggestions(formData) {
    if (!amadeusAccessToken) {
        amadeusAccessToken = await getAmadeusAccessToken();
    }
    
    try {
        const response = await axios.get('https://test.api.amadeus.com/v1/reference-data/locations', {
            params: {
                subType: 'CITY',
                keyword: formData['Do you have any preferred destinations?'] || '',
                'page[limit]': 10
            },
            headers: {
                Authorization: `Bearer ${amadeusAccessToken}`
            }
        });

        return response.data.data;
    } catch (error) {
        console.error('Error fetching destination suggestions:', error);
    }
}

function handleNextButtonClick() {
    const currentQuestion = questions[currentQuestionIndex];
    const answer = document.querySelector(`[name="${currentQuestionIndex}"]`)?.value ||
                   Array.from(document.querySelectorAll(`[name^="${currentQuestionIndex}-"]:checked`)).map(checkbox => checkbox.value) ||
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

async function submitForm() {
    console.log(formData); // For debugging
    const suggestions = await fetchDestinationSuggestions(formData);
    console.log('Destination Suggestions:', suggestions);

    if (!suggestions || suggestions.length === 0) {
        console.error('No destination suggestions found.');
        return;
    }

    // Filter and rank destinations based on user preferences
    const rankedDestinations = filterAndRankDestinations(suggestions, formData);

    // Generate and display the itinerary for the top-ranked destination
    const itinerary = generateItinerary(rankedDestinations[0], formData);
    displayItinerary(itinerary);
}

function filterAndRankDestinations(destinations, preferences) {
    // Implement your filtering and ranking algorithm here
    // Consider family-friendly, couple activities, kids' age range, pets, and budget
    return destinations;
}

function generateItinerary(destination, preferences) {
    // Generate a detailed itinerary based on the destination and user preferences
    const itinerary = [
        { day: 1, activity: `Arrive in ${destination.name}` },
        { day: 2, activity: `Explore ${preferences['What activities do you like?'][0]}` },
        { day: 3, activity: `Visit popular attractions in ${destination.name}` },
        { day: 4, activity: `Breakfast at a local cafe`, meal: 'breakfast' },
        { day: 4, activity: `Lunch at a recommended restaurant`, meal: 'lunch' },
        { day: 4, activity: `Dinner at a gourmet restaurant`, meal: 'dinner' }
        // Add more days and activities based on preferences and destination data
    ];
    return itinerary;
}

function displayItinerary(itinerary) {
    questionContainer.innerHTML = '<h2>Your Itinerary</h2>';
    itinerary.forEach(dayPlan => {
        const dayElement = document.createElement('div');
        dayElement.textContent = `Day ${dayPlan.day}: ${dayPlan.activity} (${dayPlan.meal || 'activity'})`;
        questionContainer.appendChild(dayElement);
    });
}

nextButton.addEventListener('click', handleNextButtonClick);

// Load the first question on page load
loadQuestion();