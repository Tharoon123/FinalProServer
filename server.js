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
const app = express();





//hello --- Testing For Pipeline --- Removed

// Setup Express

const server = http.createServer(app);
const io = socketIo(server); // Setup socket.io for real-time communication

// Enable CORS for all routes
app.use(cors());

app.use(express.json());

// Set up storage options for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'D:/GitHub/React Native Expo Final/Final/FinalPro_FaceRecognition_Localhost-Main/uploads');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

// Set up MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'bankmate'
    
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
        const { name, number, expire_date, cvv, balance, username, nic, email } = req.body;

        // Encrypt sensitive data
        const encryptedNumber = encrypt(number);
        const encryptedCvv = encrypt(cvv);
        const encryptednic = encrypt(nic);
        const encrypteduser = encrypt(username)
        const newUsername = username+encrypteduser.slice(0,4)
        const pass=encrypteduser.slice(5,10)
        const encryptedPassword = encrypt(pass)
        const getEmail=email
        //console.log(newUsername)
        const filename = req.file.filename;

        const setQuery = 'INSERT INTO userdata (NAME, NUMBER, EXPIRE_DATE, CVV, IMAGE, BALANCE, USERNAME, PASSWORD, IDNUM, EMAIL) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

        connection.query(setQuery, [name, encryptedNumber, expire_date, encryptedCvv, filename, balance, newUsername, encryptedPassword, encryptednic, getEmail], (error, results) => {
            if (error) {
                console.error('Database insertion error:', error);
                return res.status(500).send('Error saving user data');
            }
            
            const emailBody=`<a class="email" title="Email a friend" href="#" onclick="javascript:window.location='mailto:${getEmail}?subject=User Creation Success&body=Dear Customer ${name} Please Reset Your Password in the First Login User Name : ${newUsername} Password : ${pass}'"> Click Here</a>`
            //const email=`<a class="email" title="Email a friend" href="#" onclick="javascript:window.location='mailto:${getEmail}?subject=User Creation Success&body=Please Reset Your Password in the First Login User Name : '">Email</a>`
            const msg = `<center>User added successfully <br>Send the Email to :  ${getEmail}  ${emailBody} </center>`;
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

    const searchBalanceQuery = 'SELECT BALANCE FROM userdata WHERE USER_ID ='+userId;
    connection.query(searchBalanceQuery, (error, results) => {
        if (error) {
            console.error('Error fetching balance:', error);
            return res.status(500).send('Error fetching balance');
        }
        if (results.length > 0) {
            const balance = results[0].BALANCE;
            if (balance < amount) {
                console.log("Insufficient Balance")
                return res.status(400).send('Insufficient balance');
            }else{
                console.log("Sufficient Balance")
                addTransaction();
            }
        } else {
            return res.status(404).send('User not found');
        }
    });

    function addTransaction(){
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
    }
    
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


app.post('/editUserServerSide', async (req, res) => {
    
    const { name, nic, currPass, newPass,confirmPass } = req.body;
    console.log(req.body); // This should now show the posted data
    // const msg = 'Server is Online : ' + name + '<br>The New User Name is : ' + nic + '</center>';
    // res.send(msg);
    
    const query = 'SELECT * FROM userdata WHERE USERNAME = ?';
    connection.query(query, [name], (error, results) => {
        if (error) {
            console.error('Error fetching user:', error);
            return res.status(500).send('Error Retrieving user Data');
        }
        if (results.length > 0) {
            //console.log("User Data Recieved")
            if(name === results[0].USERNAME && nic === decrypt(results[0].IDNUM) && currPass === decrypt(results[0].PASSWORD)){
                if(newPass === confirmPass){
                    editUserData();
                }
            }else{
                res.status(404).send('Invalid credentials');
            }
            
        } else {
            console.log(req.query)
            res.status(404).send('No matching user found');
            
        }
    });

    function editUserData(){
        const encpass = encrypt(newPass);
        const query = 'UPDATE userdata SET PASSWORD = ? WHERE USERNAME = ?';
        connection.query(query, [encpass, name], (error, results) => {
            if (error) {
                console.error('Error fetching user:', error);
                return res.status(500).send('Error Updating user Data');
            }else{
                res.json(results)
            }
            
        });
    }
    //console.log("Hello")
})

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true })); // Parse form data
app.use(bodyParser.json()); // Parse JSON bodies

app.post('/deleteUser', async (req, res) => {
    const {delUsername, delnic} = req.body;
    if(delUsername && delnic){
        const query = 'SELECT * FROM userdata WHERE USERNAME = ?';
        connection.query(query, [delUsername], (error, results) => {
            if (error) {
                console.error('Error fetching user:', error);
                const msg = '<center>Error fetching user</center>';
                res.send(msg);
            }
            if (results.length > 0) {
                //console.log("User Data Recieved")
                if(delUsername === results[0].USERNAME && delnic === decrypt(results[0].IDNUM)){
                    deleteUser();
                }else{
                    const msg = '<center>Invalid credentials</center>'; 
                    res.send(msg);

                    
                }
                
            } else {
                console.log(req.query)
                const msg = '<center>No Matching User Found</center>';
                res.send(msg);
                
                
            }
        });
    }

    function deleteUser(){
        const query = 'DELETE FROM userdata WHERE USERNAME = ?';
        connection.query(query, [delUsername], (error, results) => {
            if (error) {
                console.error('Error fetching user:', error);
                const msg = '<center>Error Deleting User</center>';
                res.send(msg);
            }else{
                const msg = '<center>User Deleted Successfully</center>';
                res.send(msg)
            }
            
        });
    }
});

app.post('/createCustomerSupermarket', (req, res) => {
    const { email, password, isAdmin, fname, lname } = req.body;
    const query = 'INSERT INTO users (fname, lname, email, password, isAdmin) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [fname, lname, email, password, isAdmin ], (error, results) => {
        if (error) {
            console.error('Error creating user:', error);
            return res.status(500).send('Error creating user');
        }
        res.send('User created successfully');
    });
});


const { generateAccessAndRefreshToken, refreshToken } = require('./utils/token'); 
app.post('/loginCustomerSupermarket', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    connection.query(query, [email, password], (error, results) => {
        if (error) {
            console.error('Error fetching user:', error);
            return res.status(500).send('Error fetching user');
        }
        if (results.length > 0) {
            let userData = {
                userId: results[0].userId,
                isAdmin: results[0].isAdmin,
            }
            const {token, refreshToken} = generateAccessAndRefreshToken(userData);
            userData.token = token;
            // if refresh token gives cros error avoid passing refresh token in cookies & pass as nrml param
            userData.refreshToken = refreshToken;
            //res.json(userData);
            //console.log(userData)
            //res.cookie('refreshToken', refreshToken, { httpOnly: true });
            res.json({ 
                userId: results[0].userId, 
                isAdmin: results[0].isAdmin, 
                token, 
                refreshToken 
            });
        } else {
            res.status(404).send('Invalid credentials');
        }
    });
});

app.post('/createProduct', (req, res) => {
    const { name, description, price, } = req.body;
    const query = 'INSERT INTO product (name, description,  price) VALUES (?, ?, ?)';
    connection.query(query, [name, description, price], (error, results) => {
        if (error) {
            console.error('Error creating product:', error);
            return res.status(500).send('Error creating product');
        }
        res.status(201).json({ message: 'Product created successfully' });
        //res.send('Product created successfully');
    });
});

app.get('/getProducts', (req, res) => {
    const query = 'SELECT * FROM product';
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching product:', error);
            return res.status(500).send('Error fetching products');
        }
        res.json(results);
    });
});

app.delete('/deleteProduct', (req, res) => {
    console.log(req.body)
    const { productId } = req.body;
    try{
        const query = 'DELETE FROM product WHERE productId = ?';
        connection.query(query, [productId], (error, results) => {
        if (error) {
            console.error('Error deleting product:', error);
            return res.status(500).send('Error deleting product');
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    });

    }catch(err){
        console.log(err)
    }
    
});


//--------------Customer Login----------------

app.get('/getProducts', (req, res) => {
    const query = 'SELECT * FROM product';
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching product:', error);
            return res.status(500).send('Error fetching products');
        }
        res.json(results);
    });
});

// API to get all products in the cart for a user
app.post("/api/cart/add", (req, res) => {
    const { customerId, productId, quantity } = req.body;

    connection.query("SELECT * FROM cart WHERE userId = ? AND productId = ?", [customerId, productId], (err, results) => {
      if (err) {
        res.status(500).json({ error: "Error retrieving cart" });
      } else if (results.length > 0) {
        connection.query("UPDATE cart SET quantity = quantity + ? WHERE userId = ? AND productId = ?", [quantity, customerId, productId], (err) => {
          if (err) res.status(500).json({ error: "Error updating cart" });
          else res.status(200).json({ message: "Cart updated" });
        });
      } else {
        connection.query("INSERT INTO cart (userId, productId, quantity) VALUES (?, ?, ?)", [customerId, productId, quantity], (err) => {
          if (err) res.status(500).json({ error: "Error adding to cart" });
          else res.status(201).json({ message: "Product added to cart" });
        });
      }
    });
  });



app.delete('/deleteProductInCart', (req, res) => {
    const { productId, customerId } = req.body;
    const query = 'DELETE FROM shopingcart WHERE productId = ? userId = ?';
    connection.query(query, [productId, customerId], (error, results) => {
        if (error) {
            console.error('Error deleting product in cart:', error);
            return res.status(500).send('Error deleting product in cart');
        }
        res.status(200).json({ message: 'Product deleted from cart successfully' });
    });
});
  

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
