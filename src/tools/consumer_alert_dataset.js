import axios from 'axios';
import { Parser } from 'json2csv';
import fs from 'fs';

const url = "https://api.bnm.gov.my/public/consumer-alert";
const headers = {
    "Accept": "application/vnd.BNM.API.v1+json"
};

async function extractBNMData() {
    try {
        console.log("Connecting to BNM Open API...");
        
        const response = await axios.get(url, { headers });

        if (response.status === 200) {
            // The data is nested under 'data' key just like in Python
            const alertList = response.data.data;

            if (alertList && alertList.length > 0) {
                // Initialize the JSON to CSV parser
                const parser = new Parser();
                const csv = parser.parse(alertList);

                // Save to file
                fs.writeFileSync('bnm_consumer_alerts.csv', csv);
                
                console.log(`Success! Extracted ${alertList.length} records to bnm_consumer_alerts.csv`);
            } else {
                console.log("No data found in the response.");
            }
        } else {
            console.log(`Failed to fetch data. Status code: ${response.status}`);
        }
    } catch (error) {
        console.error(`An error occurred: ${error.message}`);
    }
}

extractBNMData();