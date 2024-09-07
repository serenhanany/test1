// Initialize web3 with Infura for Ethereum Sepolia and Linea Sepolia
var web3 = new Web3('https://sepolia.infura.io/v3/f654697c672449ec8f01af1cf4cf0342');  // Infura API for Ethereum Sepolia
var web3Linea = new Web3('https://linea-sepolia.infura.io/v3/f654697c672449ec8f01af1cf4cf0342'); // Infura API for Linea Sepolia

// Check if the account creation form exists and attach a listener for the submit event
var createAccountForm = document.getElementById('createAccountForm');
if (createAccountForm) {
    createAccountForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the form from being submitted normally
        createAccount(); // Trigger the account creation process
    });
}

// Create a new account to use the wallet
function createAccount() {              
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    var seedPhrase = lightwallet.keystore.generateRandomSeed(); // Generate a random seed phrase

    // Create a new wallet vault
    lightwallet.keystore.createVault({
        password: password,
        seedPhrase: seedPhrase,
        hdPathString: "m/44'/60'/0'/0"
    }, function (err, keyStore) {  
        if (err) throw err;

        keyStore.keyFromPassword(password, function (err, pwDerivedKey) {
            if (err) throw err;
            keyStore.generateNewAddress(pwDerivedKey, 1);
            var addr = keyStore.getAddresses()[0];

            var userData = {
                username: username,
                password: password,
                address: addr,
                seedPhrase: seedPhrase,
                isLoggedIn: true,
                serializedKeystore: keyStore.serialize(),
                transactions: [] 
            };

           // Retrieve all users from LocalStorage 
            var allUsers = JSON.parse(localStorage.getItem('userData')) || [];

            // Check if the username already exists
            var existingUser = allUsers.find(user => user.username === username);
            if (existingUser) {
                document.getElementById('accountAddress').innerText = 'A user with this username already exists. Please choose a different username.';
                return;
            }

            // Check if there is a user already logged in
            var loggedInUser = allUsers.find(user => user.isLoggedIn);
            if (loggedInUser) {
                document.getElementById('accountAddress').innerText = 'You are already logged in. Logout before creating a new account.';
                return;
            }

           // Save the new user data in LocalStorage
            allUsers.push(userData);
            localStorage.setItem('userData', JSON.stringify(allUsers));

            // Display the account details on the screen
            document.getElementById('accountAddress').innerText = 'Username: ' + username + ', Account Address: ' + addr;
            document.getElementById('seedPhraseDisplay').innerText = seedPhrase; // Display the seed phrase
        });
    });
}

// Login function
function login() { 
    var username = document.getElementById('loginUsername').value;
    var password = document.getElementById('loginPassword').value;
    var loginResult = document.getElementById('loginResult');

    var allUsers = JSON.parse(localStorage.getItem('userData')) || [];

    // Prevent login if any user is already logged in
    var loggedInUser = allUsers.find(user => user.isLoggedIn);
    if (loggedInUser) {
        loginResult.innerText = 'Another user is already logged in. Logout before logging in.';
        return;
    }

    // Check if the username and password match
    var user = allUsers.find(user => user.username === username && user.password === password);

    if (!user) {
        loginResult.innerText = 'Invalid Username or Password';
        return;
    }

    // Show success message and redirect to HomePage
    showLoginPopup("Login Successful. Redirecting...");
    setTimeout(function () {
        window.location.href = 'HomePage.html';
    }, 2000);

    // Mark the user as logged in and save to LocalStorage
    user.isLoggedIn = true;
    localStorage.setItem('userData', JSON.stringify(allUsers));
}

// Display a popup message when the user logs in
function showLoginPopup(message) {
    var popup = document.createElement("div");
    popup.classList.add("loginPopup");
    popup.innerText = message;

    document.body.appendChild(popup);

    setTimeout(function() {
        popup.style.display = "none";
    }, 2000); // Hide the popup after 2 seconds
}

// Log out the currently logged-in user
function logOut() { 
    var allUsers = JSON.parse(localStorage.getItem('userData')) || [];

    // Find the logged-in user and log them out
    var loggedInUser = allUsers.find(user => user.isLoggedIn);

    if (loggedInUser) {
        loggedInUser.isLoggedIn = false;
    }

    // Update the LocalStorage with the new status
    localStorage.setItem('userData', JSON.stringify(allUsers));

    // Redirect to the login page
    window.location.href = 'LogInPage.html';  
}

// Get and display the user's Ethereum balance
async function getUserBalance() {  
    var allUsers = JSON.parse(localStorage.getItem('userData')) || [];
    var loggedInUser = allUsers.find(user => user.isLoggedIn);

    if (!loggedInUser) {
        console.log('No logged-in user found');
        return;
    }

    // Fetch balance in Wei and convert to Ether
    let balanceWei = await web3.eth.getBalance(loggedInUser.address);
    let balanceEth = web3.utils.fromWei(balanceWei, 'ether');
    
    console.log("Balance: ", balanceEth);
    document.getElementById('walletBalance').innerText = `${balanceEth} ETH`; // Display the balance
}

// Get and display the user's Linea balance
async function getUserBalance2() {  
    var allUsers = JSON.parse(localStorage.getItem('userData')) || [];
    var loggedInUser = allUsers.find(user => user.isLoggedIn);

    if (!loggedInUser) {
        console.log('No logged-in user found');
        return;
    }

    // Fetch balance in Wei and convert to Linea
    let balanceWei = await web3Linea.eth.getBalance(loggedInUser.address);
    let balanceLinea = web3Linea.utils.fromWei(balanceWei, 'wei');
    
    console.log("Balance: ", balanceLinea);
    document.getElementById('walletBalanceLINEA').innerText = `${balanceLinea} LINEA`; // Display the balance
}

// Retrieve the address of the currently logged-in user
function getLoggedInUserAddress() {
    var allUsers = JSON.parse(localStorage.getItem('userData')) || [];
    var loggedInUser = allUsers.find(user => user.isLoggedIn);

    if (!loggedInUser) {
        console.log('No logged-in user found');
        return;
    }

    console.log("User Address: ", loggedInUser.address);
    document.getElementById('walletAddress').innerText = ` ${loggedInUser.address}`; // Display the address
}

// Check the login status and display the user's details
function checkLoginStatus() {   
    var allUsers = JSON.parse(localStorage.getItem('userData')) || [];
    var loggedInUser = allUsers.find(user => user.isLoggedIn);

    if (loggedInUser) {
        document.getElementById('loginStatus').innerHTML = `Active account: ${loggedInUser.username}`;
        getLoggedInUserAddress(); 
        getUserBalance(); 
    } else {
        document.getElementById('loginStatus').innerHTML = 'Log in to Begin';
    }
}

// Send an Ethereum transaction
function sendETHTransaction(toAddress, amountInEther) { 
    var allUsers = JSON.parse(localStorage.getItem('userData')) || [];
    var loggedInUser = allUsers.find(user => user.isLoggedIn);
    var password = loggedInUser ? loggedInUser.password : null;

    if (!password) {
        document.getElementById('transactionStatus').innerText = "No logged-in user found";
        return;
    }

    var senderAddress = loggedInUser.address.toLowerCase();
    var recipientAddress = toAddress.toLowerCase();

    // Prevent sending ETH to yourself
    if (senderAddress === recipientAddress) {
        document.getElementById('transactionStatus').innerText = "Cannot send to yourself";
        return;
    }

    // Validate recipient address
    try {
        const recipientBalance = web3.eth.getBalance(toAddress);
        if (parseInt(recipientBalance) === 0) {
            document.getElementById('transactionStatus').innerText = "Recipient address does not exist or has zero balance";
            return;
        }
    } catch (error) {
        console.error("Error validating recipient address:", error);
        document.getElementById('transactionStatus').innerText = "Error validating recipient address";
        return;
    }

    // Deserialize the keystore and send the transaction
    var serializedKeystore = loggedInUser.serializedKeystore;
    var ks = lightwallet.keystore.deserialize(serializedKeystore);
    ks.keyFromPassword(password, function (err, pwDerivedKey) {
        if (err) throw err;

        var privateKey = ks.exportPrivateKey(loggedInUser.address, pwDerivedKey);
        var account = web3.eth.accounts.privateKeyToAccount(privateKey);
        web3.eth.accounts.wallet.add(account);

        var transactionParams = {
            from: account.address,
            to: toAddress,
            value: web3.utils.toWei(amountInEther.toString(), "ether"),
            gas: 21000,  
            gasPrice: 54340000000 
        };

        // Send the transaction
        web3.eth.sendTransaction(transactionParams)
            .on('transactionHash', function(hash) {
                console.log("Transaction successful. Hash: ", hash);
                document.getElementById('transactionStatus').innerText = "Transaction successful. Hash: " + hash;

                // Update transaction history
                var transactionDetails = {
                    hash: hash,
                    from: account.address,
                    to: toAddress,
                    value: amountInEther,
                    type: "ETH"
                };
                if(!loggedInUser.transactions) {
                    loggedInUser.transactions = [];
                }
                loggedInUser.transactions.push(transactionDetails);

                // Find recipient and add transaction to their history
                var ToUser = allUsers.find(user => user.address === toAddress);
                if(ToUser && !ToUser.transactions) {
                    ToUser.transactions = [];
                }
                if(ToUser) {
                    ToUser.transactions.push(transactionDetails);
                }

                localStorage.setItem('userData', JSON.stringify(allUsers));
            })
            .on('error', function(error) {
                console.error(error);
                document.getElementById('transactionStatus').innerText = "Transaction failed. Not enough funds.";
            });
    });
}

// Fetch and display the user's transaction history
function fetchTransactions() { 
    var allUsers = JSON.parse(localStorage.getItem('userData')) || [];
    var loggedInUser = allUsers.find(user => user.isLoggedIn);
    
    if (!loggedInUser) {
        console.log('No logged-in user found');
        return;
    }

    let transactionList = document.querySelector("#transactionList");
    let transactions = loggedInUser.transactions;

    // Display each transaction in the list
    if(transactions && transactions.length) {
        transactions.forEach((tx) => {
            let transactionElement = document.createElement('div');
            transactionElement.innerHTML = `
                <p><b>Transaction</b></p>
                <p>Hash: ${tx.hash}</p>
                <p>From: ${tx.from}</p>
                <p>To: ${tx.to}</p>
                <p>Amount: ${tx.value} ${tx.type}</p>
                <br/>
            `;
            transactionList.appendChild(transactionElement);
        });
    } else {
        console.log('No transactions found for this user');
    }
}

// Send a Linea transaction
async function sendLINEAtransaction(toAddress, amountInEther) {
    var allUsers = JSON.parse(localStorage.getItem('userData')) || [];
    var loggedInUser = allUsers.find(user => user.isLoggedIn);
    var password = loggedInUser ? loggedInUser.password : null;

    if (!password) {
        console.log('No logged-in user found');
        return;
    }

    var serializedKeystore = loggedInUser.serializedKeystore;
    var ks = lightwallet.keystore.deserialize(serializedKeystore);

    ks.keyFromPassword(password, function (err, pwDerivedKey) {
        if (err) throw err;

        var privateKey = ks.exportPrivateKey(loggedInUser.address, pwDerivedKey);
        var account = web3Linea.eth.accounts.privateKeyToAccount(privateKey);
        web3Linea.eth.accounts.wallet.add(account);

        var transactionParams = {
            from: account.address,
            to: toAddress,
            value: web3Linea.utils.toWei(amountInEther.toString(), "ether"),
            gas: 21000,  
            gasPrice: 54340000000  
        };

        // Send the transaction
        web3Linea.eth.sendTransaction(transactionParams)
            .on('transactionHash', function(hash){
                console.log("Transaction sent successfully. Hash: ", hash);
                document.getElementById('transactionStatus').innerText = "Transaction sent successfully. Hash: " + hash;

                var transactionDetails = {
                    hash: hash,
                    from: account.address,
                    to: toAddress,
                    value: amountInEther,
                    type: "LINEA"
                };
    
                if(!loggedInUser.transactions) {
                    loggedInUser.transactions = [];
                }
    
                loggedInUser.transactions.push(transactionDetails);

                // Update the recipient's transaction history
                var ToUser = allUsers.find(user => user.address === toAddress);
                if(ToUser && !ToUser.transactions) {
                    ToUser.transactions = [];
                }
                if(ToUser) {
                    ToUser.transactions.push(transactionDetails);
                }

                localStorage.setItem('userData', JSON.stringify(allUsers));
            })
            .on('error', function(error){
                console.error(error);
                document.getElementById('transactionStatus').innerText = "Transaction failed. Not enough funds.";
            });
    });
}

// Send coins depending on the coin type (ETH or LINEA)
function sendCoins(event) { 
    event.preventDefault(); 

    var toAddress = document.getElementById('recipient').value; // Get the recipient's account
    var amountInEther = document.getElementById('amount').value; // Get the amount
    var coinType = document.getElementById('coin').value; // Get the coin type

    // Send the appropriate transaction based on the coin type
    if (coinType === 'ETH') {
        sendETHTransaction(toAddress, amountInEther);
    } else if (coinType === 'LINEA') {
        sendLINEAtransaction(toAddress, amountInEther);
    }
}

// Fetch the current Ethereum price from CoinGecko API
function getEthPrice() {  
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
        .then(response => response.json())
        .then(data => {
            const ethPrice = data.ethereum.usd;
            document.getElementById('ethPrice').innerText = `${ethPrice} `;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

// Restore an account using the seed phrase
function restoreAccount(seedPhraseInput) {
    var allUsers = JSON.parse(localStorage.getItem('userData')) || [];

    // Check if a user is already logged in
    var loggedInUser = allUsers.find(user => user.isLoggedIn);
    if (loggedInUser) {
        return 'A user is already logged in. Please log out before restoring another account.';
    }

    // Find the user matching the seed phrase
    var user = allUsers.find(user => user.seedPhrase === seedPhraseInput.trim());

    if (user) {
        var newPassword = document.getElementById('newPassword').value;

        // Create a new vault with the provided seed phrase and password
        lightwallet.keystore.createVault({
            password: newPassword,
            seedPhrase: seedPhraseInput.trim(),
            hdPathString: "m/44'/60'/0'/0"
        }, function (err, keyStore) {
            if (err) throw err;

            keyStore.keyFromPassword(newPassword, function (err, pwDerivedKey) {
                if (err) throw err;

                keyStore.generateNewAddress(pwDerivedKey, 1);
                var addr = keyStore.getAddresses()[0];

                // Update the user data
                user.password = newPassword;
                user.address = addr;
                user.serializedKeystore = keyStore.serialize();
                user.isLoggedIn = true;

                localStorage.setItem('userData', JSON.stringify(allUsers));

                document.getElementById('errorMsg').innerText = 'Successfully logged in, password has been updated!';
            });
        });
    } else {
        document.getElementById('errorMsg').innerText = 'No user found with the given seed phrase.';
    }
}
