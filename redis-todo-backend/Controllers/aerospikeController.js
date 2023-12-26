import aerospike from 'aerospike';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const config = { hosts: 'localhost:3000' };

var policy = {
    exists: aerospike.policy.exists.CREATE,
    key: aerospike.policy.key.SEND
}



class AerospikeManager {
    constructor() {
        if (!AerospikeManager.instance) {
            this.client = null;
            AerospikeManager.instance = this;
        }

        return AerospikeManager.instance;
    }

    async connect() {
        if (!this.client) {
            this.client = await aerospike.connect(config);
            console.info('Connected to Aerospike server');
        }

        return this.client;
    }

    disconnect() {
        if (this.client) {
            this.client.close();
            console.info('Disconnected from Aerospike server');
        }
    }
}

const aerospikeManager = new AerospikeManager();

async function getClient() {
    return await aerospikeManager.connect();
}

// Function to disconnect from Aerospike
function disconnectFromAerospike() {
    aerospikeManager.disconnect();
}



async function signup(req, res) {
    const client = await getClient();
    const {
        fullName,
        email,
        password,
        role,
        manager,
    } = req.body;
    try {
        // client = await connectToAerospike();

        const key = new aerospike.Key('test', 'users', email);
        const newUser = { fullName, email, password, role, manager }

        await client.put(key, newUser, [], policy, (error) => {
            if (error && error.code === aerospike.status.AEROSPIKE_ERR_RECORD_EXISTS) {
                console.info('Record already exists');
                res.status(409).json({ success: false, message: 'Record already exists' });
            } else if (error) {
                // disconnectFromAerospike(client);
                console.error('Error during put operation:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            } else {
                console.log("Successfully stored user data");
                res.status(201).json({ success: true, message: 'User signed up successfully' });
            }
        });

        return true;

    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
        return false;
    } finally {
        // disconnectFromAerospike(client);
    }
}

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const client = await getClient();

        const key = new aerospike.Key('test', 'users', email);
        const record = await client.get(key);

        if (!record || !record.bins) {
            // disconnectFromAerospike(client);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = record.bins;

        if (user.password !== password) {
            // disconnectFromAerospike(client);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(user, "645g6s5r4g65trg94trs6g4sr1t5gh456wretgh61stbg1tr665gh4rt6gbh56");

        // disconnectFromAerospike(client);
        res.json({ success: true, message: 'User logged in successfully', token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


async function getManager(req, res) {
    try {
        const client = await getClient();

        const scan = client.query('test', 'users');
        const records = await scan.results();

        const users = records
            .filter(record => record.bins && record.bins.role === "manager")
            .map(record => record.bins);

        // disconnectFromAerospike(); // Disconnect after the scan

        res.json(users);
    } catch (error) {
        console.error('Error during getManager:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const createTodo = async (req, res) => {
    try {
        const client = await getClient();

        const {
            createdBy,
            assigned_to,
            todo,
            due_date_time,
            fullName,
            is_completed,
            id
        } = req.body;

        const { email } = verifyToken(req.headers.authorization.split(' ')[1]) || {};
        const userKey = new aerospike.Key('test', 'todos', email);

        const record = await new Promise((resolve, reject) => {
            client.get(userKey, (error, result) => {
                if (error) {
                    if (error.code === aerospike.status.AEROSPIKE_ERR_RECORD_NOT_FOUND) {
                        resolve(null);
                    } else {
                        reject(error);
                    }
                } else {
                    resolve(result);
                }
            });
        });

        const existingTodos = record ? record.bins['todos'] || [] : [];

        const newTodo = { createdBy, assigned_to, todo, due_date_time, fullName, is_completed, id };

        existingTodos.push(newTodo);

        await new Promise((resolve, reject) => {
            client.operate(userKey, [
                aerospike.operations.write('todos', existingTodos),
            ], (error) => {
                if (error) {
                    console.error('Error during operate operation:', error);

                    if (error.code === aerospike.status.AEROSPIKE_ERR_RECORD_EXISTS) {
                        console.info('Record already exists');
                        if (res && res.json) {
                            res.status(409).json({ success: false, message: 'Record already exists' });
                        }
                    } else {
                        if (res && res.json) {
                            res.status(500).json({ success: false, message: 'Internal server error' });
                        }
                    }

                    reject(error);
                } else {
                    console.log("Successfully stored todo data");
                    if (res && res.json) {
                        res.json({ success: true, message: 'Todo created successfully' });
                    }
                    resolve();
                }
            });
        });
    } catch (error) {
        console.error('Error during createTodo:', error);
        if (res && res.json) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    } finally {
        // disconnectFromAerospike(client); // You may disconnect if needed
    }
};

const getEmployees = async (req, res) => {
    try {
        const client = await getClient();

        const scan = client.query('test', 'users');
        const records = await scan.results();

        const token = req.headers.authorization.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const { email } = decoded;

        const users = records
            .filter(record => record.bins && record.bins.manager === email)
            .map(record => record.bins);

        res.json(users);
    } catch (error) {
        console.error('Error during getEmployees:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getCreatedTodos = async (req, res) => {
    try {
        const client = await getClient();

        const token = req.headers.authorization.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const { email } = decoded;

        const userKey = new aerospike.Key('test', 'todos', email);

        const records = await client.get(userKey);

        const todos = records.bins.todos;

        res.json(todos);
    } catch (error) {
        console.error('Error fetching todos:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const getAllTodos = async (req, res) => {
    try {
        const client = await getClient();

        const scan = client.query('test', 'todos');
        const records = await scan.results();

        const todos = records.flatMap(record => record.bins.todos);

        res.json(todos);
    } catch (error) {
        console.error('Error fetching todos:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


const getPersonalTodos = async (req, res) => {
    try {
        const client = await getClient();

        const token = req.headers.authorization.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const { email } = decoded;

        const scan = client.query('test', 'todos');
        const records = await scan.results();

        const todos = records.map(record => record.bins.todos).flat();

        const filteredTodos = todos.filter(todo => todo.assigned_to === email);

        res.json(filteredTodos);
    } catch (error) {
        console.error('Error fetching todos:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const completeTodo = async (req, res) => {
    try {
        const client = await getClient();

        const token = req.headers.authorization.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { id } = req.params;

        const userKeys = await client.query('test', 'todos').results();

        for (const userKey of userKeys) {
            const { bins: userData } = await client.get(userKey.key);

            if (userData && userData.todos) {
                const todoIndex = userData.todos.findIndex(todo => todo.id === id);

                if (todoIndex !== -1) {
                    userData.todos[todoIndex].is_completed = true;

                    await client.put(userKey.key, userData);

                    return res.json({ success: true, message: 'Todo is completed successfully' });
                }
            }
        }

        return res.status(404).json({ error: 'Todo not found' });
    } catch (error) {
        console.error('Error completing todo:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const inCompleteTodo = async (req, res) => {
    try {
        const client = await getClient();

        const token = req.headers.authorization.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { id } = req.params;

        const userKeys = await client.query('test', 'todos').results();

        for (const userKey of userKeys) {
            const { bins: userData } = await client.get(userKey.key);

            if (userData && userData.todos) {
                const todoIndex = userData.todos.findIndex(todo => todo.id === id);

                if (todoIndex !== -1) {
                    userData.todos[todoIndex].is_completed = false;

                    await client.put(userKey.key, userData);

                    return res.json({ success: true, message: 'Todo is completed successfully' });
                }
            }
        }

        return res.status(404).json({ error: 'Todo not found' });
    } catch (error) {
        console.error('Error completing todo:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const createComment = async (req, res) => {
    try {
        const client = await getClient();

        const { todo_id, comment } = req.body;

        const token = req.headers.authorization.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const commentKey = new aerospike.Key('test', 'comments', uuidv4());

        await client.put(commentKey, { todo_id, comment });

        res.json({ success: true, message: 'Comment created successfully' });
    } catch (error) {
        console.error('Error creating comment:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const getAllCommentsForTodo = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id);
        const client = await getClient();

        const commentsKeys = await client.query('test', 'comments');
        const commentsRecords = await commentsKeys.results();

        const comments = commentsRecords
            .filter(record => record.bins.todo_id === id)
            .map(record => record.bins);

        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const changeAssignedToById = async (req, res) => {
    try {
        const client = await getClient();

        const { id, new_assigned_to, fullName } = req.body;

        const token = req.headers.authorization.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }


        const userKeys = await client.query('test', 'todos').results();

        for (const userKey of userKeys) {
            const { bins: userData } = await client.get(userKey.key);

            if (userData && userData.todos) {
                const todoIndex = userData.todos.findIndex(todo => todo.id === id);

                if (todoIndex !== -1) {
                    userData.todos[todoIndex].assigned_to = new_assigned_to;
                    userData.todos[todoIndex].fullName = fullName;


                    await client.put(userKey.key, userData);

                    return res.json({ success: true, message: 'Todo is completed successfully' });
                }
            }
        }

        return res.status(404).json({ error: 'Todo not found' });
    } catch (error) {
        console.error('Error completing todo:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

process.on('SIGINT', () => {
    disconnectFromAerospike();
    process.exit();
});





const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, "645g6s5r4g65trg94trs6g4sr1t5gh456wretgh61stbg1tr665gh4rt6gbh56");
        return decoded;
    } catch (error) {
        console.error('Error verifying token:', error.message);
        return null;
    }
};
export {
    signup,
    login,
    getManager,
    createTodo,
    getEmployees,
    getAllTodos,
    getPersonalTodos,
    completeTodo,
    inCompleteTodo,
    createComment,
    getAllCommentsForTodo,
    changeAssignedToById,
    getCreatedTodos
};
