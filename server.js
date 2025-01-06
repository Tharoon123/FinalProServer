const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { count } = require('console');

// Setup Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server); // Setup socket.io for real-time communication

// Enable CORS for all routes
app.use(cors());

app.use(express.json());

// Set up storage options for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'D:/GitHub/React Native Expo Final/Final/Face_Recognition_Localhost-main/uploads');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'banking'
    
});

connection.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL: ', err);
        
        return;
    }
    console.log('Connected to MySQL');
});

io.on('connection', socket => {
    console.log('New WebSocket connection');
    socket.on('faceRecognitionResult', data => {
        console.log('Received face recognition data:', data);
    });
});

// Use the provided string as the encryption key-------Crypto JS
const ENCRYPTION_KEY = Buffer.from('TEST_BANK_BACKEND'.padEnd(32, '_')); // Pads to 32 bytes
const IV_LENGTH = 16; // AES requires a 16-byte IV

// Encrypt function
function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

// Decrypt function
function decrypt(text) {
    const [iv, encryptedText] = text.split(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

app.post('/addUserData', upload.single('image'), async (req, res) => {
    if (req.file) {
        const { name, number, expire_date, cvv, balance, username, password, nic } = req.body;

        // Encrypt sensitive data
        const encryptedNumber = encrypt(number);
        const encryptedCvv = encrypt(cvv);
        const encryptedPassword = encrypt(password);
        const encryptednic = encrypt(nic);
        const encrypteduser = encrypt(username)
        const newUsername = username+encrypteduser.slice(0,4)
        console.log(newUsername)
        const filename = req.file.filename;

        const setQuery = 'INSERT INTO userdata (NAME, NUMBER, EXPIRE_DATE, CVV, IMAGE, BALANCE, USERNAME, PASSWORD, IDNUM) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

        connection.query(setQuery, [name, encryptedNumber, expire_date, encryptedCvv, filename, balance, newUsername, encryptedPassword, encryptednic], (error, results) => {
            if (error) {
                console.error('Database insertion error:', error);
                return res.status(500).send('Error saving user data');
            }
            const msg = '<center>User added successfully with ID:' + results.insertId + '<br>The New User Name is : ' + newUsername + '</center>';
            res.send(msg);
        });
    } else {
        res.status(400).send('No image uploaded');
    }
});


app.post('/verifyUser', async (req, res) => {
    const { number, expireDate, cvv } = req.body;
    console.log(number, expireDate, cvv);

    // Fetch all records matching the expire date
    const query = 'SELECT USER_ID, IMAGE, NUMBER, CVV FROM userdata WHERE EXPIRE_DATE = ?';
    connection.query(query, [expireDate], (error, results) => {
        if (error) {
            console.error('Error fetching user:', error);
            return res.status(500).send('Error verifying user');
        }

        if (results.length > 0) {
            console.log("Records fetched: ", results);

            // Iterate through results to find a matching record
            for (const user of results) {
                try {
                    const decryptedNumber = decrypt(user.NUMBER);
                    const decryptedCvv = decrypt(user.CVV);

                    // Check if both the decrypted values match
                    if (decryptedNumber === number && decryptedCvv === cvv) {
                        return res.json({ userId: user.USER_ID, image: user.IMAGE });
                    }else{
                        return res.json("Error ! Details not Matched")
                    }
                } catch (decryptionError) {
                    console.error('Decryption error:', decryptionError);
                }
            }

            // If no match is found
            res.status(404).send('No matching user found');
        } else {
            res.status(404).send('No matching user found');
        }
    });
});



app.post('/addTransaction', async (req, res) => {
    const { userId, amount, status, location } = req.body;
    console.log(userId, amount, status, location);

    // Validate request
    if (!userId || amount === undefined || status === undefined) {
        return res.status(400).send('Missing required fields: userId, amount, or status');
    }

    // Insert transaction into the transactions table
    const insertTransactionQuery = 'INSERT INTO transactions (USER_ID, AMOUNT, STATUS, LOCATION) VALUES (?, ?, ?, ?)';
    connection.query(insertTransactionQuery, [userId, amount, status, location], (error) => {
        if (error) {
            console.error('Error inserting transaction:', error);
            return res.status(500).send('Error adding transaction');
        }

        // If transaction is successful, update the BALANCE in the userdata table
        if (status === 1) { // Status 1 indicates success
            const updateBalanceQuery = 'UPDATE userdata SET BALANCE = BALANCE - ? WHERE USER_ID = ?';
            connection.query(updateBalanceQuery, [amount, userId], (updateError) => {
                if (updateError) {
                    console.error('Error updating balance:', updateError);
                    return res.status(500).send('Transaction added, but failed to update balance');
                }

                res.send('Transaction added successfully and balance updated');
            });
        } else {
            res.send('Transaction added successfully');
        }
    });
});

// API to get all transactions for a user
app.get('/getTransactions/:userId', (req, res) => {
    const { userId } = req.params;
    const query = 'SELECT * FROM transactions WHERE USER_ID = ?';
    connection.query(query, [userId], (error, results) => {
        if (error) {
            console.error('Error fetching transactions:', error);
            return res.status(500).send('Error fetching transactions');
        }
        res.json(results);
    });
});

// API to get balance and name for a user
app.get('/getBalance/:userId', (req, res) => {
    const { userId } = req.params;

    const query = 'SELECT NAME, BALANCE, NUMBER,IDNUM FROM userdata WHERE USER_ID = ?';
    connection.query(query, [userId], (error, results) => {
        if (error) {
            console.error('Error fetching balance and name:', error);
            return res.status(500).send('Error fetching balance and name');
        }
        if (results.length > 0) {
            res.json({
                name: results[0].NAME,
                balance: results[0].BALANCE,
                number: decrypt(results[0].NUMBER),
                nic: decrypt(results[0].IDNUM)
                
            });
            
        } else {
            res.status(404).send('User not found');
        }
    });
});

app.post('/login', async (req, res) => {
    
    const { username, password } = req.body;

    const query = 'SELECT USER_ID, PASSWORD FROM userdata WHERE USERNAME = ?';
    connection.query(query, [username], (error, results) => {
        if (error) {
            console.error('Error fetching user:', error);
            return res.status(500).send('Error verifying user');
        }
        if (results.length > 0) {
            const user = results[0];
            const decryptedPassword = decrypt(user.PASSWORD);
            
            if (decryptedPassword === password) {
                res.json({ userId: user.USER_ID });
                //res.send({ message: 'Login successful' });
            } else {
                res.status(404).send('Invalid credentials');
            }
        } else {
            res.status(404).send('No matching user found');
        }
    });
});






const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
