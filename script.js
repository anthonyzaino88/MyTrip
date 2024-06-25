// formHandler.js

const AMADEUS_API_KEY = 'V0d0bW6lNEjP6sMxGZAjvb9hifr0ZoBk'; //  Amadeus API key
const AMADEUS_API_SECRET = 'sSFQnKiQDxHa5cUB'; //  Amadeus API secret
let amadeusAccessToken = '';


const questions = [
    {
        question: "Do you have any preferred destinations?",
        type: "text",
        placeholder: "e.g., Paris, Tokyo"
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
        question: "What are your travel dates?",
        type: "date-range"
    },
    {
        question: "Do you have any dietary restrictions?",
        type: "text",
        placeholder: "e.g., Vegetarian, Vegan"
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

async function fetchDestinationSuggestions(formData, retries = 3) {
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
        
        if (error.response && error.response.status === 429) {
            // Rate limit error, wait and retry
            const retryAfter = parseInt(error.response.headers['retry-after'], 10) || 5;
            console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            return fetchDestinationSuggestions(formData, retries - 1);
        } else if (retries > 0) {
            console.log(`Retrying... (${3 - retries + 1})`);
            return fetchDestinationSuggestions(formData, retries - 1);
        } else {
            alert("We're experiencing issues with our server. Please try again later.");
            return [];
        }
    }
}

async function fetchActivities(destination, formData) {
    if (!amadeusAccessToken) {
        amadeusAccessToken = await getAmadeusAccessToken();
    }

    try {
        const response = await axios.get('https://test.api.amadeus.com/v1/reference-data/locations/pois', {
            params: {
                latitude: destination.geoCode.latitude,
                longitude: destination.geoCode.longitude,
                radius: 10,
                categories: 'SIGHTS',
                'page[limit]': 3
            },
            headers: {
                Authorization: `Bearer ${amadeusAccessToken}`
            }
        });

        return response.data.data.map(poi => ({
            name: poi.name,
            type: poi.category
        }));
    } catch (error) {
        console.error('Error fetching activities:', error);
        return [];
    }
}
async function fetchDiningOptions(destination, formData) {
    // Placeholder for actual API call to fetch dining options based on destination and preferences
    return [
        { name: "Restaurant 1", type: "dining" },
        { name: "Restaurant 2", type: "dining" }
    ];
}

async function fetchHotelOptions(destination, formData) {
    // Placeholder for actual API call to fetch hotel options based on destination, preferences, and budget
    return [
        { name: "Hotel 1", type: "hotel" },
        { name: "Hotel 2", type: "hotel" },
        { name: "Hotel 3", type: "hotel" },
        { name: "Hotel 4", type: "hotel" },
        { name: "Hotel 5", type: "hotel" }
    ];
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

    // Assuming the first suggestion is the most relevant one
    const destination = suggestions[0];

    // Fetch activities, dining options, and hotel options based on the destination and form data
    const activities = await fetchActivities(destination, formData);
    const diningOptions = await fetchDiningOptions(destination, formData);
    const hotelOptions = await fetchHotelOptions(destination, formData);

    // Generate and display the itinerary
    const itinerary = generateItinerary(destination, activities, diningOptions, hotelOptions, formData);
    displayItinerary(itinerary);
}

function generateItinerary(destination, activities, diningOptions, hotelOptions, preferences) {
    const days = parseInt(preferences['How long is your trip?'].split(' ')[0]);
    const itinerary = [];

    for (let i = 0; i < days; i++) {
        itinerary.push({ day: i + 1, activity: activities[i % activities.length].name });
        itinerary.push({ day: i + 1, activity: `Breakfast at ${diningOptions[0].name}`, meal: 'breakfast' });
        itinerary.push({ day: i + 1, activity: `Lunch at ${diningOptions[1].name}`, meal: 'lunch' });
        itinerary.push({ day: i + 1, activity: `Dinner at ${diningOptions[0].name}`, meal: 'dinner' });
        itinerary.push({ day: i + 1, activity: `Stay at ${hotelOptions[i % hotelOptions.length].name}`, meal: 'hotel' });
    }
    return itinerary;
}

function displayItinerary(itinerary) {
    questionContainer.innerHTML = '<h2>Your Itinerary</h2>';
    const daysMap = {};

    itinerary.forEach(item => {
        if (!daysMap[item.day]) {
            daysMap[item.day] = [];
        }
        daysMap[item.day].push(item);
    });

    for (const day in daysMap) {
        const dayElement = document.createElement('div');
        dayElement.innerHTML = `<h3>Day ${day}</h3>`;
        daysMap[day].forEach(dayPlan => {
            const activityElement = document.createElement('div');
            activityElement.textContent = `${dayPlan.activity} (${dayPlan.meal || 'activity'})`;
            dayElement.appendChild(activityElement);
        });
        questionContainer.appendChild(dayElement);
    }
}

nextButton.addEventListener('click', handleNextButtonClick);

// Load the first question on page load
loadQuestion();