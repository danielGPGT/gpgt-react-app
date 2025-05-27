import axios from 'axios';
import { GoogleGenAI } from "@google/genai";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1/' || 'https://gpgt-api.onrender.com/api/v1/',
  withCredentials: true // allow cookies (useful later if you want secure auth)
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only remove token if it's an authentication error
      if (error.response.data?.requiresReauth) {
        localStorage.removeItem('token');
        // Redirect to login page
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Add Gemini API configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the Google AI client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Function to update an existing itinerary
export const updateItinerary = async (bookingId, content) => {
  try {
    console.log('Attempting to update itinerary for bookingId:', bookingId);
    const response = await api.put(`/itineraries?bookingId=${bookingId}`, {
      content,
      updated_at: new Date().toISOString()
    });
    console.log('Update itinerary response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating itinerary:', error);
    throw error;
  }
};

// Function to generate itinerary using Gemini
export const generateItinerary = async (bookingData) => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const prompt = `
You are an expert travel planner. Create a **day-by-day itinerary** for a Grand Prix weekend based on the booking details provided. Your goal is to make the itinerary **clear, simple, and fully detailed**, including only **essential information** — nothing extra or promotional.

**Formatting Guidelines:**
1. Each day should begin with the line:  
   **"Day X - [Day of Week] - [Title of the Day]"**  
   e.g., "Day 1 - Friday - Arrival & Practice"

2. List each activity on a **new line**, using this structure:  
   **HH:MM - [Activity Title]**  
   e.g., "14:30 - Transfer to circuit"

3. Use **24-hour time format (HH:MM)**. Always maintain chronological order.

4. Use the full hotel name **"${bookingData.hotel_name}"** the first time it is mentioned. After that, you can refer to it simply as "the hotel".

5. Include **flight details** using this format:
   - **Full airport names** (e.g., "London Heathrow Airport" not just "Heathrow")
   - Include both **departure** and **arrival** times
   - Mention the **flight number**, only if it's provided
   - Clearly label each as either **Outbound** or **Inbound**
   Example:
08:10 - Flight Outbound: London Heathrow Airport to Milan Malpensa Airport
Flight number: BA123
Arrival at 11:30

6. Include **all relevant timings** for:
- Hotel **check-in** and **check-out**
- **Airport transfers**
- **Circuit transfers**, labeled using: "${bookingData.circuit_transfer_type.replace(/\(.*?\)/g, '').trim()}"
- **Formula 1 sessions**: Practice, Qualifying, Race
- **Breakfast** (Only breakfast. Do not mention lunch or dinner.)

7. After any activity that has additional requirements, include short **notes/reminders**, e.g.:  
"Note: Please bring your race ticket and wear comfortable shoes."

8. Maintain a **clean, professional tone** using **clear and concise** language. Avoid all filler or promotional content.

9. **Separate each day** with a **single blank line**.

**Booking Data Provided:**
- Hotel: ${bookingData.hotel_name}
- Flight Outbound: ${bookingData.flight_outbound}
- Flight Inbound: ${bookingData.flight_inbound}
- Circuit Transfer Type: ${bookingData.circuit_transfer_type.replace(/\(.*?\)/g, '').trim()}

Create the final itinerary below:

Booking Details:
Event: ${bookingData.event_name}
Dates: ${bookingData.check_in_date} to ${bookingData.check_out_date}
Hotel: ${bookingData.hotel_name}
Flight Details: 
  Outbound: ${bookingData.flight_outbound}
  Inbound: ${bookingData.flight_inbound}
Transfers: 
  Airport: ${bookingData.airport_transfer_type}
  Circuit: ${bookingData.circuit_transfer_type}
Number of Travelers: ${bookingData.adults}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    if (!response.text) {
      throw new Error('No response generated from Gemini API');
    }

    // Store the generated itinerary
    const storedItinerary = await storeItinerary(bookingData.booking_id, response.text);
    return storedItinerary.content;
  } catch (error) {
    console.error('Error generating itinerary:', error);
    throw error;
  }
};

// Function to get an itinerary by booking ID
export const getItinerary = async (bookingId) => {
  try {
    console.log('Checking for existing itinerary with bookingId:', bookingId);
    const response = await api.get(`/itineraries?bookingId=${bookingId}`);
    console.log('getItinerary response:', response.data);
    // Return null if the response is an empty array
    return Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('Error retrieving itinerary:', error);
    return null;
  }
};

// Function to get all itineraries for a booking
export const getBookingItineraries = async (bookingId) => {
  try {
    const response = await api.get(`/itineraries/booking/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error('Error retrieving booking itineraries:', error);
    // Return empty array instead of throwing error
    return [];
  }
};

// Function to store an itinerary
export const storeItinerary = async (bookingId, itinerary) => {
  try {
    // First check if an itinerary already exists
    console.log('Checking if itinerary exists before storing for bookingId:', bookingId);
    const existingItinerary = await getItinerary(bookingId);
    console.log('Existing itinerary check result:', existingItinerary);
    
    if (existingItinerary) {
      console.log('Itinerary already exists, throwing error');
      throw new Error('An itinerary already exists for this booking. Please use the update function instead.');
    }

    console.log('Storing new itinerary for bookingId:', bookingId);
    const response = await api.post('/itineraries', {
      booking_id: bookingId,
      content: itinerary,
      generated_at: new Date().toISOString()
    });
    console.log('Store itinerary response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error storing itinerary:', error);
    throw error;
  }
};

export default api;
