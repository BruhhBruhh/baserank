// Initialize Web3 with the Base Mainnet Alchemy WebSocket RPC endpoint
const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://base-mainnet.g.alchemy.com/v2/8dASJbrbZeVybFKSf3HWqgLu3uFhskOL', {
    reconnect: {
        auto: true,
        delay: 5000, // 5 seconds
        maxAttempts: 5
    }
}));

// Test Web3 connection
web3.eth.getBlockNumber()
    .then(block => console.log('Latest block:', block))
    .catch(err => console.error('Web3 connection error:', err));

// Contract address and ABI (unchanged)
const contractAddress = '0xffcbF84650cE02DaFE96926B37a0ac5E34932fa5';
const contractABI = [
    // Your ABI here (as provided earlier)
    // ...
];

// Initialize the contract
const cbXenContract = new web3.eth.Contract(contractABI, contractAddress);

// Log contract to debug
console.log('Contract:', cbXenContract);
if (!cbXenContract || !cbXenContract.events) {
    console.error('Contract initialization failed');
    return;
}

// Function to add a row to the table
function addRankToTable(blockNumber, user, term, rank, timestamp) {
    const tbody = document.getElementById('rankData');
    const row = document.createElement('tr');
    
    // Convert BigInt to number explicitly for term
    const termInDays = Number(term) / (3600 * 24); // Ensure term is a number before division
    row.innerHTML = `
        <td>${blockNumber}</td>
        <td>${user}</td>
        <td>${termInDays.toFixed(2)}</td> <!-- Use toFixed for cleaner display -->
        <td>${rank}</td>
        <td>${new Date(timestamp * 1000).toLocaleString()}</td>
    `;
    
    // Insert new rows at the top
    tbody.insertBefore(row, tbody.firstChild);
}

// Subscribe to RankClaimed events
cbXenContract.events.RankClaimed({
    fromBlock: 'latest' // Start listening from the latest block
})
.on('data', async (event) => {
    console.log('New RankClaimed event:', event);
    const blockNumber = event.blockNumber;
    const user = event.returnValues.user;
    const term = BigInt(event.returnValues.term); // Handle as BigInt
    const rank = BigInt(event.returnValues.rank); // Handle as BigInt

    // Get block timestamp
    const block = await web3.eth.getBlock(blockNumber);
    const timestamp = block.timestamp;

    // Add to table with explicit BigInt conversion
    addRankToTable(blockNumber, user, term, rank, timestamp);
})
.on('error', (error) => {
    console.error('Error subscribing to events:', error);
});

// Fetch past events (limited by provider)
async function fetchPastEvents() {
    try {
        const latestBlock = await web3.eth.getBlockNumber();
        console.log('Latest block:', latestBlock);
        const fromBlock = latestBlock - 5000; // Increased range to find more events
        console.log('Fetching events from block:', fromBlock, 'to latest');

        const pastEvents = await cbXenContract.getPastEvents('RankClaimed', {
            fromBlock: fromBlock,
            toBlock: 'latest'
        });
        console.log('Found events:', pastEvents.length);

        for (const event of pastEvents) {
            const blockNumber = event.blockNumber;
            const user = event.returnValues.user;
            const term = BigInt(event.returnValues.term); // Handle as BigInt
            const rank = BigInt(event.returnValues.rank); // Handle as BigInt
            const block = await web3.eth.getBlock(blockNumber);
            const timestamp = block.timestamp;

            console.log('Adding event:', { blockNumber, user, term, rank, timestamp });
            addRankToTable(blockNumber, user, term, rank, timestamp);
        }
    } catch (error) {
        console.error('Error fetching past events:', error);
    }
}

// Load past events on page load
fetchPastEvents();
